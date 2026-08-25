import { getSql, withRetry } from "./db";
import type { CategoryWithDishes, Dish, DishOption } from "../types";

// The guest menu reads the database WITHOUT Prisma, on purpose — see src/lib/db.ts
// for why the WASM query engine has no place on a guest-facing path.

export type MenuRestaurant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: string | null;
  status: string;
  trialEndsAt: Date | null;
};

function toMenuRestaurant(row: Record<string, unknown>): MenuRestaurant {
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

  return rows[0] ? toMenuRestaurant(rows[0]) : null;
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
        ORDER BY "sortOrder" ASC, "id" ASC
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

/** Lowest-numbered restaurant — what the bare "/" route shows. */
export async function findFirstRestaurant(): Promise<MenuRestaurant | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "id", "name", "slug", "logoUrl", "settings", "status", "trialEndsAt"
      FROM "Restaurant"
      ORDER BY "id" ASC
      LIMIT 1
    `,
  )) as Array<Record<string, unknown>>;

  return rows[0] ? toMenuRestaurant(rows[0]) : null;
}

/**
 * Dishes with their category and options attached, shaped like the Prisma
 * `include` the public /api/dishes response has always returned.
 */
export async function findDishesWithCategory(restaurantId: number): Promise<unknown[]> {
  const sql = getSql();

  const [dishRows, categoryRows, optionRows] = (await withRetry(() =>
    Promise.all([
      sql`
        SELECT "id", "nameEn", "nameRu", "nameAz",
               "descriptionEn", "descriptionRu", "descriptionAz",
               "price", "imageUrl", "imagePositionX", "imagePositionY",
               "categoryId", "restaurantId", "createdAt", "updatedAt", "soldOut"
        FROM "Dish"
        WHERE "restaurantId" = ${restaurantId}
        ORDER BY "createdAt" DESC
      `,
      sql`
        SELECT "id", "nameEn", "nameRu", "nameAz", "restaurantId"
        FROM "Category"
        WHERE "restaurantId" = ${restaurantId}
        ORDER BY "sortOrder" ASC, "id" ASC
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

  const categoryById = new Map(categoryRows.map((row) => [Number(row.id), row]));

  const optionsByDish = new Map<number, Array<Record<string, unknown>>>();
  for (const row of optionRows) {
    const dishId = Number(row.dishId);
    const existing = optionsByDish.get(dishId);
    if (existing) {
      existing.push(row);
    } else {
      optionsByDish.set(dishId, [row]);
    }
  }

  return dishRows.map((row) => ({
    ...row,
    category: categoryById.get(Number(row.categoryId)) ?? null,
    options: optionsByDish.get(Number(row.id)) ?? [],
  }));
}

/**
 * Apply a billing webhook to the restaurant it belongs to.
 *
 * Finds the tenant by the restaurant_id the checkout carried, and failing that
 * by the subscription id recorded on a previous webhook. The second route is why
 * those columns exist: custom data is attached at checkout, so a renewal that
 * arrives without it must still be able to find its way home rather than let a
 * paying restaurant slide into past_due.
 *
 * The subscription and customer ids are written on every event, so the first
 * webhook for a new subscription is what establishes the link.
 */
export async function applySubscriptionFromBilling(event: {
  subscriptionId: string;
  customerId: string | null;
  restaurantId: number | null;
  status: string;
  trialEndsAt: Date | null;
}): Promise<{ matched: boolean; restaurantId: number | null }> {
  const sql = getSql();

  // Exactly one row, and an established subscription link beats custom data.
  //
  // Two reasons. The mundane one: matching both conditions at once would touch
  // two rows whenever custom data named one restaurant while the subscription
  // was already recorded against another, and since the subscription id is
  // unique that lands as a constraint violation and a 500 Lemon Squeezy retries
  // for hours.
  //
  // The one that matters: restaurant_id is a query parameter on a checkout URL,
  // so anyone can edit it. If custom data could move an existing subscription,
  // buying one month against a competitor's id and then cancelling would close
  // their menu. Once Lemon Squeezy has told us which restaurant a subscription
  // belongs to, only Lemon Squeezy gets to change it; custom data is trusted
  // for first contact and nothing else.
  const rows = (await withRetry(
    () => sql`
      UPDATE "Restaurant"
      SET "status" = ${event.status},
          "trialEndsAt" = ${event.trialEndsAt},
          "lemonSqueezySubscriptionId" = ${event.subscriptionId},
          "lemonSqueezyCustomerId" = ${event.customerId},
          "updatedAt" = NOW()
      WHERE "id" = (
        SELECT "id"
        FROM "Restaurant"
        WHERE "lemonSqueezySubscriptionId" = ${event.subscriptionId}
           OR "id" = ${event.restaurantId}
        ORDER BY CASE WHEN "lemonSqueezySubscriptionId" = ${event.subscriptionId} THEN 0 ELSE 1 END
        LIMIT 1
      )
      RETURNING "id"
    `,
  )) as Array<{ id: number }>;

  return {
    matched: rows.length > 0,
    restaurantId: rows[0] ? Number(rows[0].id) : null,
  };
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
