import { neon } from "@neondatabase/serverless";
import type { CategoryWithDishes, Dish, DishOption } from "@/types";

// The guest menu reads the database WITHOUT Prisma, on purpose.
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
// neon() is a thin wrapper over fetch: no WASM, no engine to boot, and no state
// that can outlive a request. It is safe to hold at module scope and costs
// almost no CPU, which is what the guest hot path needs. Prisma stays in the
// admin routes, where traffic is low and a retry costs nobody anything.

type SqlClient = ReturnType<typeof neon>;

let _sql: SqlClient | null = null;

function getSql(): SqlClient {
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
function isTransientDbError(error: unknown): boolean {
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

async function withRetry<T>(run: () => Promise<T>): Promise<T> {
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

export type MenuRestaurant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: string | null;
  status: string;
  trialEndsAt: Date | null;
};

export async function findRestaurantBySlug(slug: string): Promise<MenuRestaurant | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "id", "name", "slug", "logoUrl", "settings", "status", "trialEndsAt"
      FROM "Restaurant"
      WHERE "slug" = ${slug}
      LIMIT 1
    `,
  )) as Array<Record<string, unknown>>;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: row.logoUrl === null ? null : String(row.logoUrl),
    settings: row.settings === null ? null : String(row.settings),
    status: typeof row.status === "string" ? row.status : "active",
    trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt as string) : null,
  };
}

/**
 * The whole menu in one round trip.
 *
 * Ordering matches what the Prisma version produced: categories by id ascending,
 * dishes newest first, options by id ascending.
 */
export async function findMenuByRestaurantId(restaurantId: number): Promise<CategoryWithDishes[]> {
  const sql = getSql();

  // Retried as one unit: if any of the three fails the menu is incomplete
  // anyway, and re-running all three is a single extra round trip.
  const [categoryRows, dishRows, optionRows] = (await withRetry(() =>
    Promise.all([
      sql`
        SELECT "id", "nameEn", "nameRu", "nameAz"
        FROM "Category"
        WHERE "restaurantId" = ${restaurantId}
        ORDER BY "id" ASC
      `,
      sql`
        SELECT "id", "nameEn", "nameRu", "nameAz",
               "descriptionEn", "descriptionRu", "descriptionAz",
               "price", "imageUrl", "imagePositionX", "imagePositionY", "categoryId", "soldOut"
        FROM "Dish"
        WHERE "restaurantId" = ${restaurantId}
        ORDER BY "createdAt" DESC
      `,
      sql`
        SELECT o."id", o."dishId", o."nameEn", o."nameRu", o."nameAz", o."price"
        FROM "DishOption" o
        JOIN "Dish" d ON d."id" = o."dishId"
        WHERE d."restaurantId" = ${restaurantId}
        ORDER BY o."id" ASC
      `,
    ]),
  )) as Array<Array<Record<string, unknown>>>;

  const optionsByDish = new Map<number, DishOption[]>();
  for (const row of optionRows) {
    const dishId = Number(row.dishId);
    const option: DishOption = {
      id: Number(row.id),
      dishId,
      nameEn: String(row.nameEn),
      nameRu: String(row.nameRu),
      nameAz: String(row.nameAz),
      price: Number(row.price),
    };

    const existing = optionsByDish.get(dishId);
    if (existing) {
      existing.push(option);
    } else {
      optionsByDish.set(dishId, [option]);
    }
  }

  const dishesByCategory = new Map<number, Dish[]>();
  for (const row of dishRows) {
    const id = Number(row.id);
    const categoryId = Number(row.categoryId);
    const dish: Dish = {
      id,
      nameEn: String(row.nameEn),
      nameRu: String(row.nameRu),
      nameAz: String(row.nameAz),
      descriptionEn: String(row.descriptionEn),
      descriptionRu: String(row.descriptionRu),
      descriptionAz: String(row.descriptionAz),
      price: Number(row.price),
      imageUrl: String(row.imageUrl),
      imagePositionX: Number(row.imagePositionX),
      imagePositionY: Number(row.imagePositionY),
      categoryId,
      soldOut: row.soldOut === true,
      options: optionsByDish.get(id) ?? [],
    };

    const existing = dishesByCategory.get(categoryId);
    if (existing) {
      existing.push(dish);
    } else {
      dishesByCategory.set(categoryId, [dish]);
    }
  }

  return categoryRows.map((row) => {
    const id = Number(row.id);
    return {
      id,
      nameEn: String(row.nameEn),
      nameRu: String(row.nameRu),
      nameAz: String(row.nameAz),
      dishes: dishesByCategory.get(id) ?? [],
    };
  });
}

/** First dish photo for a restaurant — the og:image fallback on the menu page. */
export async function findFirstDishImage(restaurantId: number): Promise<string | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "imageUrl"
      FROM "Dish"
      WHERE "restaurantId" = ${restaurantId}
      ORDER BY "id" ASC
      LIMIT 1
    `,
  )) as Array<Record<string, unknown>>;

  const imageUrl = rows[0]?.imageUrl;
  return typeof imageUrl === "string" && imageUrl ? imageUrl : null;
}

/** Subscription fields only — the gate the public menu endpoints check. */
export async function findRestaurantStatusById(
  restaurantId: number,
): Promise<{ status: string; trialEndsAt: Date | null } | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "status", "trialEndsAt"
      FROM "Restaurant"
      WHERE "id" = ${restaurantId}
      LIMIT 1
    `,
  )) as Array<Record<string, unknown>>;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    status: typeof row.status === "string" ? row.status : "active",
    trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt as string) : null,
  };
}
