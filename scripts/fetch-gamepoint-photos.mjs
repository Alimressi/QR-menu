// Populate GamePoint dish photos from Pexels.
//
// Usage:
//   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/fetch-gamepoint-photos.mjs
//   (or: node scripts/fetch-gamepoint-photos.mjs — it reads .env itself)
//
// Pexels is the source because its licence covers commercial use without
// attribution, which a restaurant's menu needs; a photo pulled out of an image
// search does not come with that.
//
// The dish names are Azerbaijani and several are brand names, so searching on
// them directly returns nothing useful ("Sacaqlı Pendir", "Qızardılmış Gürza").
// Each dish therefore carries a hand-written English query below. Dishes whose
// name did not say plainly what the dish is are listed in UNSURE and flagged in
// the review file for the restaurant to confirm.
//
// Branded drinks and bars — Coca-Cola, Red Bull, Xirdalan, Carlsberg, Snickers —
// get a photo of the kind of drink, not of the brand. Stock libraries do not
// carry brand photography, and using it on a menu would be a trademark problem
// rather than a licensing one.
//
// Downloads to public/images/dishes/dish-<id>.jpg (static assets, served
// reliably on Cloudflare) and sets dish.imageUrl. Resumable: re-running skips
// dishes already done, so a Pexels rate limit (200 req/h) just means running it
// again later.

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const SLUG = "gamepoint";
const OUT_DIR = path.join(process.cwd(), "public", "images", "dishes");
const REVIEW_LOG = path.join(process.cwd(), "gamepoint-photos-review.md");
const DELAY_MS = 300;

const QUERIES = {
  // Qəlyanaltılar
  225: "popcorn bowl",
  226: "salty crackers snack bowl",
  227: "french fries",
  228: "chicken nuggets",
  229: "roasted peanuts bowl",
  230: "toasted bread cubes bowl",
  231: "potato chips bowl",
  232: "country style potato wedges",
  233: "dumpling soup dushbara",
  234: "sliced cheese board",
  235: "fried dumplings gyoza",
  236: "basturma cured meat slices",
  237: "grilled sausages plate",
  // Sendviç / Burger
  238: "sausage cheese toast sandwich",
  239: "sausage toast sandwich",
  240: "ham sandwich",
  241: "chicken nugget burger",
  242: "bbq chicken burger",
  243: "chicken wrap roll",
  244: "shawarma doner wrap",
  245: "hot dog",
  246: "cheeseburger",
  // Qəlyanlar
  247: "hookah close up smoke",
  248: "hookah apple shisha",
  249: "hookah grapefruit shisha",
  // Pivə
  250: "lager beer glass",
  251: "unfiltered beer glass",
  252: "non alcoholic beer bottle",
  253: "draft beer pouring",
  254: "pilsner beer glass",
  255: "wheat beer glass",
  // Kombolar
  256: "chicken wrap fries cola meal",
  257: "burger fries cola combo meal",
  258: "hookah lounge table with tea",
  259: "chicken nuggets fries cola",
  260: "shawarma fries cola meal",
  261: "chicken nuggets fries drink",
  262: "bbq burger fries drink meal",
  263: "cheeseburger fries cola meal",
  // Soyuq İçkilər
  264: "cola soda can",
  265: "glass of cola with ice",
  266: "cola bottle on table",
  267: "soda bottle one liter",
  268: "iced tea can",
  269: "iced lemon tea in bottle",
  270: "energy drink can",
  271: "sparkling water bottle",
  272: "blank aluminium drink can dark background",
  273: "blank aluminium can blue background",
  274: "energy drink can white",
  275: "turkish ayran",
  276: "mineral water bottle",
  277: "homemade lemonade jar",
  // İsti İçkilər
  278: "black tea teapot",
  279: "cup of tea",
  280: "americano coffee cup",
  281: "latte coffee with milk",
  282: "hot chocolate glass mug",
  283: "cocoa with marshmallows",
  // Smoothie
  284: "milkshake glass",
  285: "banana caramel milkshake",
  286: "berry smoothie glass",
  287: "strawberry smoothie glass",
  // Mürəbbə
  288: "chocolate caramel peanut ice cream",
  289: "coconut chocolate dessert",
  290: "white cherry dessert bowl",
  291: "strawberry dessert bowl",
  292: "vanilla ice cream scoops",
  // Şirniyyat
  293: "chocolate bar pieces",
  294: "chocolate caramel peanut bar",
  295: "honey cake slice",
  296: "profiteroles dessert",
  297: "roasted chickpeas and nuts mix",
  298: "ice cream scoop cone",
  299: "cookies plate",
  // Pizzalar
  905: "margherita pizza",
  906: "chicken pizza",
  907: "sausage pepperoni pizza",
  908: "mixed toppings pizza",
  // Spirtli İçkilər
  909: "whiskey bottle and glass on table",
  910: "herbal liqueur bottle dark",
  911: "tequila bottle with lime and salt",
  912: "whiskey bottle on bar",
  913: "red wine bottle and glass",
  // VIP Setlər
  914: "whiskey bottle with fruit platter",
  915: "liqueur bottle with fruit plate",
  916: "tequila bottle with fruit platter",
  917: "wine bottle with fruit plate",
  918: "whiskey bottle hookah lounge table",
  // Setlər
  300: "hookah lounge interior table",
  301: "shawarma fries cola set",
  302: "burger nuggets fries cola set",
};

// Names that did not say plainly what the dish is — the query below is a guess.
const UNSURE = new Set([226, 288, 289, 290, 291, 299]);

const envRaw = await fs.readFile(".env", "utf8").catch(() => "");
const readEnv = (key) => (envRaw.match(new RegExp(`^${key}=(.+)$`, "m")) || [])[1]?.trim();

process.env.DATABASE_URL = readEnv("DATABASE_URL") || process.env.DATABASE_URL;
const PEXELS_KEY = readEnv("PEXELS_API_KEY") || process.env.PEXELS_API_KEY;

if (!PEXELS_KEY) {
  console.error("Missing PEXELS_API_KEY. Add it to .env (get one at https://www.pexels.com/api/).");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (res.status === 429) return { rateLimited: true, photos: [] };
  if (!res.ok) return { photos: [] };
  const data = await res.json();
  return { photos: data.photos || [] };
}

const restaurant = await prisma.restaurant.findUnique({ where: { slug: SLUG }, select: { id: true } });
if (!restaurant) {
  console.error(`Restaurant "${SLUG}" not found.`);
  process.exit(1);
}

const dishes = await prisma.dish.findMany({
  where: { restaurantId: restaurant.id },
  select: { id: true, nameAz: true, imageUrl: true },
  orderBy: { id: "asc" },
});

await fs.mkdir(OUT_DIR, { recursive: true });

const usedPhotoIds = new Set();
const review = [];
let updated = 0;
let skipped = 0;
let failed = 0;

function renderReview() {
  return [
    "# GamePoint dish photos — review",
    "",
    `Updated ${updated}, skipped ${skipped}, failed ${failed}. Source: Pexels (free for commercial use, no attribution required).`,
    "",
    'Lines marked "?" are dishes whose name did not say plainly what they are — the photo is a guess.',
    'Lines marked "brand" are branded products: the photo shows the kind of drink or bar, not the brand itself.',
    "",
    ...review,
  ].join("\n");
}

const BRANDED = new Set([264, 265, 266, 267, 268, 269, 270, 272, 273, 274, 276, 271, 250, 251, 252, 253, 254, 255, 288, 289, 294]);

// Pass a comma-separated list of dish ids to redo just those, whatever they
// already have — the way a wrong match gets replaced once its query is improved.
const forcedIds = new Set(
  (process.argv[2] ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0),
);

for (const dish of dishes) {
  if (forcedIds.size > 0 && !forcedIds.has(dish.id)) {
    continue;
  }

  const localPath = `/images/dishes/dish-${dish.id}.jpg`;
  const filePath = path.join(OUT_DIR, `dish-${dish.id}.jpg`);

  const alreadyDone =
    !forcedIds.has(dish.id) &&
    dish.imageUrl === localPath &&
    (await fs.access(filePath).then(() => true).catch(() => false));
  if (alreadyDone) {
    skipped++;
    continue;
  }

  const query = QUERIES[dish.id];
  if (!query) {
    failed++;
    review.push(`- ❌ **${dish.nameAz}** (id ${dish.id}) — no query written for this dish`);
    continue;
  }

  const result = await searchPexels(query);
  if (result.rateLimited) {
    await fs.writeFile(REVIEW_LOG, `${renderReview()}\n\n> Stopped early: Pexels hourly rate limit hit. Re-run to continue.\n`);
    console.log(`\nRate limit hit at ${updated + skipped + failed}/${dishes.length}. Re-run later; progress is saved.`);
    await prisma.$disconnect();
    process.exit(0);
  }

  const photo = result.photos.find((p) => !usedPhotoIds.has(p.id)) || result.photos[0];
  if (!photo) {
    failed++;
    review.push(`- ❌ **${dish.nameAz}** (id ${dish.id}) — nothing found for "${query}"`);
    await sleep(DELAY_MS);
    continue;
  }
  usedPhotoIds.add(photo.id);

  const imgUrl = photo.src.landscape || photo.src.large || photo.src.original;
  const imgRes = await fetch(imgUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  await fs.writeFile(filePath, buf);
  await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: localPath } });

  const marks = [UNSURE.has(dish.id) ? "?" : "", BRANDED.has(dish.id) ? "brand" : ""].filter(Boolean).join(" ");
  review.push(
    `- ${marks ? `**${marks}** ` : ""}${dish.nameAz} (id ${dish.id}) — "${query}" → [${photo.alt || "photo"}](${photo.url})`,
  );
  updated++;
  process.stdout.write(`\r  ${updated + skipped + failed}/${dishes.length}  ${dish.nameAz.slice(0, 32).padEnd(32)}`);
  await sleep(DELAY_MS);
}

await fs.writeFile(REVIEW_LOG, `${renderReview()}\n`);
console.log(`\n\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed.\nReview matches in gamepoint-photos-review.md`);
await prisma.$disconnect();
