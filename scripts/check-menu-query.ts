/**
 * The guest read path — the code every QR scan runs.
 *
 * Creates a throwaway restaurant with a deliberately awkward menu (a sold-out
 * dish, a dish with options, an empty category, a second restaurant to leak
 * across) and asserts what comes back. Everything is removed in the `finally`
 * block.
 *
 * Run: npm run check:menu
 */
import { getSql } from "@/lib/db";
import {
  findDishesWithCategory,
  findFirstDishImage,
  findMenuByRestaurantId,
  findRestaurantBySlug,
  findRestaurantStatusById,
} from "@/lib/menu-query";

let failures = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

async function main() {
  const sql = getSql();
  const stamp = Date.now();
  const slug = `zz-menu-${stamp}`;
  const otherSlug = `zz-other-${stamp}`;
  const ids: number[] = [];

  try {
    const makeRestaurant = async (s: string, status: string) => {
      const [row] = (await sql`
        INSERT INTO "Restaurant" ("name", "slug", "logoUrl", "settings", "status", "updatedAt")
        VALUES ('Fixture', ${s}, '/logo.png', '{"brandName":"Fixture"}', ${status}, NOW())
        RETURNING "id"
      `) as Array<{ id: number }>;
      ids.push(Number(row.id));
      return Number(row.id);
    };

    const restaurantId = await makeRestaurant(slug, "active");
    const otherId = await makeRestaurant(otherSlug, "disabled");

    const makeCategory = async (rid: number, name: string) => {
      const [row] = (await sql`
        INSERT INTO "Category" ("nameEn", "nameRu", "nameAz", "restaurantId")
        VALUES (${name}, ${name}, ${name}, ${rid}) RETURNING "id"
      `) as Array<{ id: number }>;
      return Number(row.id);
    };

    const mains = await makeCategory(restaurantId, "Mains");
    const empty = await makeCategory(restaurantId, "Empty");
    const otherCategory = await makeCategory(otherId, "Theirs");

    /**
     * @param ageMinutes How far in the past createdAt sits. Set explicitly
     *   because the ordering assertions below depend on it: three inserts in the
     *   same millisecond would tie, and `ORDER BY "createdAt" DESC` would then
     *   return them in whatever order Postgres felt like — a test that passes
     *   most of the time and fails in CI for no reason.
     */
    const makeDish = async (
      rid: number,
      cid: number,
      name: string,
      price: number,
      image: string,
      ageMinutes: number,
    ) => {
      const [row] = (await sql`
        INSERT INTO "Dish" (
          "nameEn","nameRu","nameAz","descriptionEn","descriptionRu","descriptionAz",
          "price","imageUrl","categoryId","restaurantId","createdAt","updatedAt"
        )
        VALUES (
          ${name}, ${name}, ${name}, 'd', 'd', 'd', ${price}, ${image}, ${cid}, ${rid},
          NOW() - (${ageMinutes} || ' minutes')::interval, NOW()
        )
        RETURNING "id"
      `) as Array<{ id: number }>;
      return Number(row.id);
    };

    // findMenuByRestaurantId returns dishes newest first, so these ages decide
    // the expected order: soldOut, newer, older.
    const older = await makeDish(restaurantId, mains, "Older", 10, "/first.jpg", 30);
    const newer = await makeDish(restaurantId, mains, "Newer", 20, "/second.jpg", 20);
    const soldOut = await makeDish(restaurantId, mains, "SoldOut", 30, "/third.jpg", 10);
    await makeDish(otherId, otherCategory, "Theirs", 40, "/theirs.jpg", 5);

    await sql`UPDATE "Dish" SET "soldOut" = true WHERE "id" = ${soldOut}`;
    await sql`
      INSERT INTO "DishOption" ("dishId","nameEn","nameRu","nameAz","price")
      VALUES (${newer}, 'Large', 'Large', 'Large', 5)
    `;

    console.log("findRestaurantBySlug");
    const restaurant = await findRestaurantBySlug(slug);
    check("found by slug", restaurant?.id === restaurantId);
    check("name returned", restaurant?.name === "Fixture");
    check("logo returned", restaurant?.logoUrl === "/logo.png");
    check("settings returned raw", restaurant?.settings === '{"brandName":"Fixture"}');
    check("status returned", restaurant?.status === "active");
    check("null trialEndsAt stays null", restaurant?.trialEndsAt === null);
    check("unknown slug is null, not an error", (await findRestaurantBySlug("zz-nope")) === null);

    console.log("\nfindMenuByRestaurantId");
    const menu = await findMenuByRestaurantId(restaurantId);
    check("both categories returned, including the empty one", menu.length === 2, menu.length);
    check("categories ordered by id", menu[0]?.id === mains && menu[1]?.id === empty);
    check("empty category has an empty array, not null", Array.isArray(menu[1]?.dishes) && menu[1].dishes.length === 0);

    const dishes = menu[0]?.dishes ?? [];
    check("three dishes in Mains", dishes.length === 3, dishes.length);
    check("newest dish first", dishes[0]?.id === soldOut && dishes[2]?.id === older);
    check("sold-out flag survives", dishes.find((d) => d.id === soldOut)?.soldOut === true);
    check("in-stock dish is not marked sold out", dishes.find((d) => d.id === older)?.soldOut === false);
    check("option attached to the right dish", dishes.find((d) => d.id === newer)?.options?.length === 1);
    check("dish without options gets an empty array", dishes.find((d) => d.id === older)?.options?.length === 0);
    check("price is a number", typeof dishes[0]?.price === "number");

    console.log("\ntenant isolation");
    const otherMenu = await findMenuByRestaurantId(otherId);
    check("another restaurant sees only its own category", otherMenu.length === 1);
    check("...and only its own dish", otherMenu[0]?.dishes.length === 1);
    check(
      "no dish leaks across restaurants",
      !menu.some((category) => category.dishes.some((dish) => dish.nameEn === "Theirs")),
    );

    console.log("\nfindDishesWithCategory (public /api/dishes)");
    const flat = (await findDishesWithCategory(restaurantId)) as Array<Record<string, unknown>>;
    check("returns every dish", flat.length === 3, flat.length);
    check("newest first", Number(flat[0]?.id) === soldOut);
    check("category is a nested object", typeof flat[0]?.category === "object" && flat[0]?.category !== null);
    check("options is an array", Array.isArray(flat[0]?.options));
    check(
      "the dish with an option carries it",
      (flat.find((d) => Number(d.id) === newer)?.options as unknown[])?.length === 1,
    );
    check("createdAt is a Date", flat[0]?.createdAt instanceof Date);
    check("scoped to the tenant", (await findDishesWithCategory(otherId)).length === 1);

    console.log("\nfindFirstDishImage (og:image fallback)");
    check("returns the lowest-id dish photo", (await findFirstDishImage(restaurantId)) === "/first.jpg");
    check("a restaurant with no dishes returns null", (await findFirstDishImage(-1)) === null);

    console.log("\nfindRestaurantStatusById (the subscription gate)");
    const status = await findRestaurantStatusById(restaurantId);
    check("status returned", status?.status === "active");
    const disabled = await findRestaurantStatusById(otherId);
    check("a disabled tenant reports disabled", disabled?.status === "disabled");
    check("unknown id is null", (await findRestaurantStatusById(-1)) === null);
  } finally {
    for (const id of ids) {
      // OrderItem -> Dish is ON DELETE RESTRICT, so items first if any exist.
      await sql`DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "restaurantId" = ${id})`;
      await sql`DELETE FROM "Order" WHERE "restaurantId" = ${id}`;
      await sql`DELETE FROM "Restaurant" WHERE "id" = ${id}`;
    }

    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count FROM "Restaurant" WHERE "slug" LIKE 'zz-%'
    `) as Array<{ count: number }>;
    console.log(`\nfixtures removed (zz-* rows left: ${count})`);
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
