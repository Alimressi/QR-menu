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
import { QUERIES, UNSURE, BRANDED } from "./gamepoint-photo-queries.mjs";

const SLUG = "gamepoint";
const OUT_DIR = path.join(process.cwd(), "public", "images", "dishes");
const REVIEW_LOG = path.join(process.cwd(), "gamepoint-photos-review.md");
const DELAY_MS = 300;

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
