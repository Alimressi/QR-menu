// Populate Nine Lives dish photos from Pexels.
//
// Usage:
//   1. Get a free API key at https://www.pexels.com/api/ (2-min signup).
//   2. Add it to .env:            PEXELS_API_KEY=xxxxxxxx
//   3. Run:                       node scripts/fetch-ninelives-photos.mjs
//
// - Downloads one photo per dish into public/images/dishes/dish-<id>.jpg
//   (static assets — served reliably on Cloudflare) and sets dish.imageUrl.
// - Resumable: re-running skips dishes already done, so if the Pexels hourly
//   rate limit (200 req/h) is hit, just run it again in an hour to finish.
// - Writes dish-photos-review.md so you can eyeball matches and swap the odd ones.

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const SLUG = "ninelives";
const OUT_DIR = path.join(process.cwd(), "public", "images", "dishes");
const REVIEW_LOG = path.join(process.cwd(), "dish-photos-review.md");
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

// Turn "TEN/11 Salad" -> "salad", "Chicken wings with BBQ sauce" -> "chicken wings with bbq sauce"
function cleanName(nameEn) {
  return nameEn
    .replace(/[\/\-_]+/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=6&orientation=landscape`;
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
  select: { id: true, nameEn: true, imageUrl: true },
  orderBy: { id: "asc" },
});

await fs.mkdir(OUT_DIR, { recursive: true });

const usedPhotoIds = new Set();
const review = [];
let updated = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < dishes.length; i++) {
  const dish = dishes[i];
  const localPath = `/images/dishes/dish-${dish.id}.jpg`;
  const filePath = path.join(OUT_DIR, `dish-${dish.id}.jpg`);

  // Resume: skip dishes already fetched.
  const alreadyDone = dish.imageUrl === localPath && (await fs.access(filePath).then(() => true).catch(() => false));
  if (alreadyDone) {
    skipped++;
    continue;
  }

  const queries = [
    `${cleanName(dish.nameEn)} food`,
    cleanName(dish.nameEn),
    `${cleanName(dish.nameEn).split(" ")[0]} dish`,
  ];

  let photos = [];
  let usedQuery = "";
  for (const q of queries) {
    let result = await searchPexels(q);
    if (result.rateLimited) {
      await prisma.$disconnect();
      await fs.writeFile(REVIEW_LOG, renderReview(review, updated, skipped, failed) + "\n\n> Stopped early: Pexels hourly rate limit hit. Re-run the script in ~1 hour to continue.\n");
      console.log(`\n\nRate limit hit at ${updated + skipped + failed}/${dishes.length}. Re-run in ~1h to finish (progress is saved).`);
      process.exit(0);
    }
    if (result.photos.length) {
      photos = result.photos;
      usedQuery = q;
      break;
    }
    await sleep(DELAY_MS);
  }

  const photo = photos.find((p) => !usedPhotoIds.has(p.id)) || photos[0];
  if (!photo) {
    failed++;
    review.push(`- ❌ **${dish.nameEn}** (id ${dish.id}) — no photo found`);
    await sleep(DELAY_MS);
    continue;
  }
  usedPhotoIds.add(photo.id);

  const imgUrl = photo.src.landscape || photo.src.large || photo.src.original;
  const imgRes = await fetch(imgUrl);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  await fs.writeFile(filePath, buf);
  await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: localPath } });

  const flag = usedQuery === queries[0] ? "" : " ⚠️ fallback match — review";
  review.push(`- ${dish.nameEn} (id ${dish.id}) → [${photo.alt || "photo"}](${photo.url})${flag}`);
  updated++;
  process.stdout.write(`\r  ${updated + skipped + failed}/${dishes.length}  ${dish.nameEn.slice(0, 32).padEnd(32)}`);
  await sleep(DELAY_MS);
}

function renderReview(lines, u, s, f) {
  return `# Nine Lives dish photos — review\n\nUpdated ${u}, skipped ${s}, failed ${f}. Lines flagged "⚠️" or "❌" are worth a manual look.\n\n${lines.join("\n")}`;
}

await fs.writeFile(REVIEW_LOG, renderReview(review, updated, skipped, failed) + "\n");
console.log(`\n\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed.\nReview matches in dish-photos-review.md`);
await prisma.$disconnect();
