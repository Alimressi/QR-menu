import { PrismaNeon } from "@prisma/adapter-neon";
import type { PrismaClient } from "@prisma/client";

type PrismaClientLike = PrismaClient;

function isCloudflareWorkerRuntime() {
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined";
}

async function createPrismaClient(): Promise<PrismaClientLike> {
  const connectionString =
    process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DIRECT_DATABASE_URL must be set in the runtime environment."
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  if (isCloudflareWorkerRuntime()) {
    const { PrismaClient } = await import("@prisma/client/wasm");
    return new PrismaClient({ adapter }) as PrismaClientLike;
  }

  const { PrismaClient } = await import("@prisma/client");
  return new PrismaClient({ adapter }) as PrismaClientLike;
}

async function runWithClient<T>(fn: (client: PrismaClientLike) => Promise<T>) {
  const client = await createPrismaClient();
  try {
    return await fn(client);
  } finally {
    await client.$disconnect().catch(() => undefined);
  }
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
          runWithClient(async (client) => {
            const model = (client as unknown as Record<string, unknown>)[modelName] as
              | Record<string, (...innerArgs: unknown[]) => Promise<unknown>>
              | undefined;

            if (!model || typeof model[methodName] !== "function") {
              throw new Error(`Unknown Prisma model method: ${modelName}.${methodName}`);
            }

            return model[methodName](...args);
          });
      },
    }
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
          runWithClient(async (client) => {
            const method = (client as unknown as Record<string, unknown>)[propertyName] as
              | ((...innerArgs: unknown[]) => Promise<unknown>)
              | undefined;

            if (typeof method !== "function") {
              throw new Error(`Unknown Prisma client method: ${propertyName}`);
            }

            return method(...args);
          });
      }

      return createModelProxy(propertyName);
    },
  }
) as unknown as PrismaClient;

export default prisma;
