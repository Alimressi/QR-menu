import { PrismaNeon } from "@prisma/adapter-neon";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PrismaClient } from "@prisma/client";

type PrismaClientLike = PrismaClient;

function isCloudflareWorkerRuntime() {
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined";
}

// Prisma is now ADMIN-ONLY. The guest menu reads through src/lib/menu-query.ts.
//
// The client owns I/O handles, and Cloudflare refuses to let one request touch an
// I/O object created by another:
//
//   "Cannot perform I/O on behalf of a different request. (I/O type: Native)"
//
// Caching the client at module scope therefore failed ~40% of requests: whichever
// ones landed on a warm isolate hung until the runtime killed them. Measured on
// /api/admin/login, which reaches the database before rejecting: 8 failures in 20.
//
// So the client is scoped to a single request, keyed on the per-request
// ExecutionContext. Queries within one request share a client; nothing crosses
// between requests. The WeakMap lets each client die with its request.
//
// Booting a client costs real CPU, which is why this used to be a singleton — a
// per-request client on the guest menu blew the free plan's budget (Error 1102).
// That is no longer a concern here: these routes are used by one person clicking
// in an admin panel, not by every guest scanning a QR code.
//
// The module import stays cached globally. It is the expensive half and holds no
// I/O, so it is safe to keep.
let _modulePromise: Promise<{
  PrismaClient: new (options: { adapter: PrismaNeon }) => unknown;
}> | null = null;

const _clientsByRequest = new WeakMap<object, Promise<PrismaClientLike>>();

// Node and `next dev` have no per-request isolation and no such restriction, so a
// plain singleton is both correct and cheaper there.
let _nodeClientPromise: Promise<PrismaClientLike> | null = null;

function loadPrismaModule() {
  if (!_modulePromise) {
    _modulePromise = (
      isCloudflareWorkerRuntime() ? import("@prisma/client/wasm") : import("@prisma/client")
    ).then((mod) => mod as unknown as { PrismaClient: new (o: { adapter: PrismaNeon }) => unknown });
  }

  return _modulePromise;
}

async function createPrismaClient(): Promise<PrismaClientLike> {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set in the runtime environment.");
  }

  const { PrismaClient } = await loadPrismaModule();
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({ adapter }) as PrismaClientLike;
}

/** The object identifying the current request, or null when there isn't one. */
async function getRequestKey(): Promise<object | null> {
  if (!isCloudflareWorkerRuntime()) {
    return null;
  }

  try {
    const { ctx } = await getCloudflareContext({ async: true });
    return (ctx as unknown as object) ?? null;
  } catch {
    return null;
  }
}

async function getClient(): Promise<PrismaClientLike> {
  const key = await getRequestKey();

  if (!key) {
    if (isCloudflareWorkerRuntime()) {
      // On a Worker with no identifiable request, a fresh client is the only safe
      // choice — sharing one is exactly the bug this file exists to avoid.
      return createPrismaClient();
    }

    _nodeClientPromise ??= createPrismaClient().catch((error: unknown) => {
      _nodeClientPromise = null;
      throw error;
    });

    return _nodeClientPromise;
  }

  const existing = _clientsByRequest.get(key);
  if (existing) {
    return existing;
  }

  const created = createPrismaClient().catch((error: unknown) => {
    // Let the next query in this same request retry initialisation.
    _clientsByRequest.delete(key);
    throw error;
  });

  _clientsByRequest.set(key, created);
  return created;
}

function createModelProxy(modelName: string) {
  return new Proxy(
    {},
    {
      get(_target, methodName) {
        if (typeof methodName !== "string") {
          return undefined;
        }

        return (...args: unknown[]) =>
          getClient().then((client) => {
            const model = (client as unknown as Record<string, unknown>)[modelName] as
              | Record<string, (...innerArgs: unknown[]) => Promise<unknown>>
              | undefined;

            if (!model || typeof model[methodName] !== "function") {
              throw new Error(`Unknown Prisma model method: ${modelName}.${methodName}`);
            }

            return model[methodName](...args);
          });
      },
    },
  );
}

const prisma = new Proxy(
  {},
  {
    get(_target, propertyName) {
      if (typeof propertyName !== "string") {
        return undefined;
      }

      if (propertyName.startsWith("$")) {
        return (...args: unknown[]) =>
          getClient().then((client) => {
            const method = (client as unknown as Record<string, unknown>)[propertyName] as
              | ((...innerArgs: unknown[]) => Promise<unknown>)
              | undefined;

            if (typeof method !== "function") {
              throw new Error(`Unknown Prisma client method: ${propertyName}`);
            }

            // Applied to the client, not called bare. These methods read their
            // own internals off `this`; detaching one and calling it threw
            // "Cannot read properties of undefined (reading '_engineConfig')",
            // which surfaced as a flat "Failed to update dish." in the admin
            // panel. The model proxy below never had this problem because
            // `model[method](...)` keeps its receiver.
            return method.apply(client, args);
          });
      }

      return createModelProxy(propertyName);
    },
  },
) as unknown as PrismaClient;

export default prisma;
