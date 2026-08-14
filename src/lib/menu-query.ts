import { getSql, withRetry } from "@/lib/db";
import type { CategoryWithDishes, Dish, DishOption } from "@/types";

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
