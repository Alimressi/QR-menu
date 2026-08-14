import { neon } from "@neondatabase/serverless";

// The shared SQL client for everything on the guest path.
//
// Prisma on Workers runs a WASM query engine held in a client object. That client
// owns I/O handles, and Cloudflare forbids using an I/O object created during one
// request from another request's handler:
//
//   "Cannot perform I/O on behalf of a different request. (I/O type: Native)"
//
// Caching the client across requests therefore makes roughly a third of menu
// loads hang until the runtime kills them (Error 1101). Creating one per request
// instead blows the CPU budget (Error 1102). Both were observed in production.
//
// The engine is also heavy: query_compiler_bg.wasm alone is 1.9 MB, and every
// isolate that touches Prisma keeps it resident. On 13 August 2026 the Worker
// spent five and a half hours being killed with `exceededResources` before it
// could make a single subrequest — which is what moved the ordering routes here.
//
// neon() is a thin wrapper over fetch: no WASM, no engine to boot, and no state
// that can outlive a request. It is safe to hold at module scope and costs almost
// no CPU, which is what a guest-facing path needs.

type SqlClient = ReturnType<typeof neon>;

let _sql: SqlClient | null = null;

export function getSql(): SqlClient {
  if (!_sql) {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set in the runtime environment.");
    }

    _sql = neon(connectionString);
  }

  return _sql;
}

// Neon answers some requests with a 500 that means "try again", not "this is
// broken". The one seen in production is the compute wake-up:
//
//   NeonDbError: Server error (HTTP status 500):
//   {"message":"Control plane request failed", ...}
//
// The serverless driver does not retry on its own, so a single unlucky wake-up
// used to be a guest staring at an empty menu. Retrying costs nothing on the
// happy path and no CPU while waiting — a Worker is not billed for time spent
// on I/O.
export function isTransientDbError(error: unknown): boolean {
  const message = String((error as { message?: unknown })?.message ?? error);

  return (
    message.includes("Control plane request failed") ||
    // Any Neon 5xx: their gateway is unhappy, the query itself is fine.
    /Server error \(HTTP status 5\d\d\)/.test(message) ||
    message.includes("fetch failed") ||
    message.includes("Connection terminated") ||
    message.includes("terminating connection") ||
    message.includes("ECONNRESET")
  );
}

/** Waits between attempts. Length is also the cap on added latency: ~1.9s. */
const RETRY_DELAYS_MS = [200, 600, 1100];

/**
 * Run a query, retrying only the failures that a second attempt can fix.
 *
 * Safe for writes as well as reads: every statement sent through here is either
 * a single self-contained statement or one `sql.transaction([...])` batch, so a
 * retried attempt repeats an operation that never partially applied.
 */
export async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;

      // A real error — bad SQL, missing column — must surface immediately
      // rather than be tried three more times.
      if (!isTransientDbError(error) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }

  throw lastError;
}
