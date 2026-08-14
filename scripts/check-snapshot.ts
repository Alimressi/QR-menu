/**
 * The last-known-good menu snapshot.
 *
 * This is the fallback that runs only when the database is already down, which
 * means a bug in it stays invisible until the worst possible moment. The staleness
 * rule matters most: a snapshot that is too old carries wrong prices, and serving
 * wrong prices to a guest is worse than an honest error.
 *
 * Run: npm run check:snapshot
 */
import { getSql } from "@/lib/db";
import {
  MAX_SNAPSHOT_AGE_MS,
  buildMenuSnapshot,
  parseMenuSnapshot,
  snapshotKeyFor,
} from "@/lib/menu-snapshot";

let failures = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

/** What R2 actually stores and returns: JSON, not live objects. */
function roundTrip(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function main() {
  const sql = getSql();
  const stamp = Date.now();
  const slug = `zz-snap-${stamp}`;
  const emptySlug = `zz-snap-empty-${stamp}`;
  const ids: number[] = [];

  console.log("key format");
  check("key is namespaced", snapshotKeyFor("lumiere") === "snapshots/menu/lumiere.json");
  check("a slug with a slash cannot escape the prefix", !snapshotKeyFor("a/b").includes("a/b"));
  check("unicode slug is encoded", snapshotKeyFor("кафе").startsWith("snapshots/menu/%"));

  try {
    const makeRestaurant = async (s: string) => {
      const [row] = (await sql`
        INSERT INTO "Restaurant" ("name", "slug", "settings", "status", "trialEndsAt", "updatedAt")
        VALUES ('Snap Fixture', ${s}, '{"brandName":"Snap"}', 'trial', NOW() + interval '5 days', NOW())
        RETURNING "id"
      `) as Array<{ id: number }>;
      ids.push(Number(row.id));
      return Number(row.id);
    };

    const restaurantId = await makeRestaurant(slug);
    await makeRestaurant(emptySlug);

    const [category] = (await sql`
      INSERT INTO "Category" ("nameEn","nameRu","nameAz","restaurantId")
      VALUES ('Mains','Mains','Mains',${restaurantId}) RETURNING "id"
    `) as Array<{ id: number }>;

    await sql`
      INSERT INTO "Dish" (
        "nameEn","nameRu","nameAz","descriptionEn","descriptionRu","descriptionAz",
        "price","imageUrl","categoryId","restaurantId","updatedAt"
      )
      VALUES ('Plov','Plov','Plov','d','d','d', 12.5, '/p.jpg', ${Number(category.id)}, ${restaurantId}, NOW())
    `;

    console.log("\nbuilding");
    const built = await buildMenuSnapshot(slug);
    check("a real menu produces a snapshot", built !== null);
    check("savedAt is an ISO string", typeof built?.savedAt === "string" && !Number.isNaN(Date.parse(built.savedAt)));
    check("the menu is included", built?.categories.length === 1);
    check("the dish is included", built?.categories[0]?.dishes.length === 1);
    check("price survives", built?.categories[0]?.dishes[0]?.price === 12.5);
    check("trialEndsAt is serialised as a string", typeof built?.restaurant.trialEndsAt === "string");
    check("subscription status is carried", built?.restaurant.status === "trial");

    check("an unknown slug produces nothing", (await buildMenuSnapshot("zz-nope")) === null);
    check("a restaurant with no dishes produces nothing", (await buildMenuSnapshot(emptySlug)) === null);

    console.log("\nround trip through JSON, as R2 stores it");
    const parsed = parseMenuSnapshot(roundTrip(built));
    check("it parses back", parsed !== null);
    check("trialEndsAt becomes a Date again", parsed?.restaurant.trialEndsAt instanceof Date);
    check("the menu survives intact", parsed?.categories[0]?.dishes[0]?.price === 12.5);
    check("restaurant id survives", parsed?.restaurant.id === restaurantId);
  } finally {
    for (const id of ids) {
      await sql`DELETE FROM "Restaurant" WHERE "id" = ${id}`;
    }
    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count FROM "Restaurant" WHERE "slug" LIKE 'zz-snap%'
    `) as Array<{ count: number }>;
    console.log(`\nfixtures removed (rows left: ${count})`);
  }

  console.log("\nstaleness — the rule that keeps wrong prices off the table");
  const base = {
    restaurant: { id: 1, name: "N", slug: "s", logoUrl: null, settings: null, status: "active", trialEndsAt: null },
    categories: [],
  };
  const at = (msAgo: number) => parseMenuSnapshot({ ...base, savedAt: new Date(Date.now() - msAgo).toISOString() });

  check("a fresh snapshot is accepted", at(60_000) !== null);
  check("one day old is accepted", at(24 * 60 * 60 * 1000) !== null);
  check("just inside the limit is accepted", at(MAX_SNAPSHOT_AGE_MS - 60_000) !== null);
  check("just past the limit is refused", at(MAX_SNAPSHOT_AGE_MS + 60_000) === null);
  check("a month old is refused", at(30 * 24 * 60 * 60 * 1000) === null);

  console.log("\nrubbish input never throws");
  check("null", parseMenuSnapshot(null) === null);
  check("undefined", parseMenuSnapshot(undefined) === null);
  check("a string", parseMenuSnapshot("nope") === null);
  check("a number", parseMenuSnapshot(42) === null);
  check("empty object", parseMenuSnapshot({}) === null);
  check("missing savedAt", parseMenuSnapshot(base) === null);
  check("unparseable savedAt", parseMenuSnapshot({ ...base, savedAt: "not-a-date" }) === null);
  check(
    "categories missing",
    parseMenuSnapshot({ restaurant: base.restaurant, savedAt: new Date().toISOString() }) === null,
  );
  check(
    "categories of the wrong type",
    parseMenuSnapshot({ ...base, categories: "nope", savedAt: new Date().toISOString() }) === null,
  );
  check(
    "restaurant missing",
    parseMenuSnapshot({ categories: [], savedAt: new Date().toISOString() }) === null,
  );

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
