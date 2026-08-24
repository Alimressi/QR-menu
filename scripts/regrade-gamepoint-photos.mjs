// Make the GamePoint photo set look like one shoot.
//
// Fetched dish by dish, the set was a patchwork: a white studio background next
// to a sunlit terrace next to a dark bar. On a card 133px wide the subject
// barely reads, so what a guest actually sees scrolling the menu is 92
// mismatched backgrounds.
//
// Two passes, the same shape as scripts/regrade-lumiere-photos.mjs:
//  1) re-search every dish with the same surface term appended, and among the
//     top (still relevant) results keep the darkest, least colourful one;
//  2) grade the whole set to one average brightness with a light cool cast, so
//     the lighting reads as one room.
//
// Lumière aims bright — white marble, an airy café. GamePoint is a gaming club
// with a near-black menu and an electric blue accent, so this aims the other
// way: dark surfaces, slightly desaturated, slightly cool.
//
// Usage: node scripts/regrade-gamepoint-photos.mjs [id,id,...] [cached]

import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { QUERIES } from "./gamepoint-photo-queries.mjs";

const SLUG = "gamepoint";
const OUT = path.join(process.cwd(), "public", "images", "dishes");
const SURFACE = "on dark background";
const TARGET = 104; // one average brightness for the whole set
const DELAY_MS = 250;

const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const KEY = env.match(/^PEXELS_API_KEY=(.+)$/m)[1].trim();

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function channels(hex) {
  const match = /#?([0-9a-f]{6})/i.exec(hex || "#000000");
  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(hex) {
  const [r, g, b] = channels(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Near the set's own brightness, and uncoloured with it: a dark grey surround
// rather than a saturated backdrop that would clash with the next card along.
//
// Scoring pure darkness instead pulled the whole set to a mean luminance of 41
// — every card a black rectangle with something dim in it. What makes a set
// look shot together is that the photos agree, not that they are dark.
function surfaceScore(hex) {
  const [r, g, b] = channels(hex);
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  return -Math.abs(luminance(hex) - TARGET) - 1.2 * saturation;
}

async function search(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;
  const response = await fetch(url, { headers: { Authorization: KEY } });
  if (response.status === 429) return { rateLimited: true, photos: [] };
  if (!response.ok) return { photos: [] };
  return { photos: (await response.json()).photos || [] };
}

// Relevance first — the top results are the right dish — then the one closest
// to the set's brightness. Reaching past the top eight starts returning
// something else entirely.
//
// `taken` keeps one photo from landing on several dishes. Neighbouring items
// search for nearly the same thing ("burger fries cola" four ways), so without
// it four combos came back as the same picture and the menu looked broken.
function pick(photos, taken) {
  const usable = photos.slice(0, 8).filter((photo) => !taken.has(sourceOf(photo)));
  const pool = usable.length > 0 ? usable : photos.filter((photo) => !taken.has(sourceOf(photo)));
  if (pool.length === 0) return null;
  return pool.sort((a, b) => surfaceScore(b.avg_color) - surfaceScore(a.avg_color))[0];
}

function sourceOf(photo) {
  return (photo.src.large2x || photo.src.large || photo.src.original).split("?")[0];
}

async function grade(buffer) {
  const stats = await sharp(buffer).stats();
  const mean =
    0.299 * stats.channels[0].mean + 0.587 * stats.channels[1].mean + 0.114 * stats.channels[2].mean;

  // Clamped: pushing a bright studio shot all the way down to the target turns
  // it to mud, and lifting a night shot that far raises nothing but noise.
  const brightness = Math.max(0.75, Math.min(1.45, TARGET / Math.max(1, mean)));

  return sharp(buffer)
    .resize(1200, 800, { fit: "cover", position: "attention" })
    .modulate({ brightness, saturation: 0.9 })
    // Per channel, so blue lifts a touch more than red: a cool cast without
    // sharp's .tint(), which drains the colour out and returns a monochrome
    // image in the tint's hue. Food photographed in black and white is not what
    // "one shoot" means.
    .linear([1.03, 1.05, 1.09], [-4, -4, -2])
    .jpeg({ quality: 86 })
    .toBuffer();
}

// Each run records which photo it chose, so tuning the grade afterwards costs
// no Pexels searches — pass "cached" to re-download exactly the same set.
const PICKS = path.join(process.cwd(), "gamepoint-photo-picks.json");
const useCache = process.argv.includes("cached");
const picks = await fs.readFile(PICKS, "utf8").then(JSON.parse).catch(() => ({}));

const only = new Set(
  (process.argv[2] ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0),
);

// Sources spoken for by dishes this run will not touch, so a partial re-pick
// cannot land on a photo another card is already showing. Removing a redone
// dish's own url instead would unblock a photo it shares with a dish staying
// put — which is exactly how the duplicates survived the first attempt.
const taken = new Set(
  Object.entries(picks)
    .filter(([id]) => only.size > 0 && !only.has(Number(id)))
    .map(([, url]) => url.split("?")[0]),
);

const restaurant = await prisma.restaurant.findUnique({ where: { slug: SLUG }, select: { id: true } });
if (!restaurant) {
  console.error(`Restaurant "${SLUG}" not found.`);
  process.exit(1);
}

const dishes = await prisma.dish.findMany({
  where: { restaurantId: restaurant.id },
  select: { id: true, nameAz: true },
  orderBy: { id: "asc" },
});

let done = 0;
let kept = 0;
const before = [];
const after = [];

for (const dish of dishes) {
  if (only.size > 0 && !only.has(dish.id)) continue;

  const base = QUERIES[dish.id];
  if (!base) continue;

  const cached = useCache ? picks[dish.id] : null;
  let photo = null;

  if (!cached) {
    const result = await search(`${base} ${SURFACE}`);
    if (result.rateLimited) {
      await fs.writeFile(PICKS, JSON.stringify(picks, null, 1));
      console.log(`\nRate limit hit after ${done}. Re-run later to finish; picks so far are saved.`);
      break;
    }
    photo = pick(result.photos, taken);
  }

  const file = path.join(OUT, `dish-${dish.id}.jpg`);

  // No dark result worth having? Keep the photo already there and just grade it,
  // so the set still comes out level even where the search had nothing to offer.
  const source = cached ?? (photo ? photo.src.large2x || photo.src.large || photo.src.original : null);

  let raw;
  if (source) {
    raw = Buffer.from(await (await fetch(source)).arrayBuffer());
    picks[dish.id] = source;
    taken.add(source.split("?")[0]);
  } else {
    raw = await fs.readFile(file);
    kept += 1;
  }

  const graded = await grade(raw);
  const statsBefore = await sharp(raw).stats();
  const statsAfter = await sharp(graded).stats();
  const lum = (s) => 0.299 * s.channels[0].mean + 0.587 * s.channels[1].mean + 0.114 * s.channels[2].mean;
  before.push(lum(statsBefore));
  after.push(lum(statsAfter));

  await fs.writeFile(file, graded);
  await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: `/images/dishes/dish-${dish.id}.jpg` } });

  done += 1;
  process.stdout.write(`\r  ${done}  ${dish.nameAz.slice(0, 28).padEnd(28)}`);
  if (!cached) await sleep(DELAY_MS);
}

const spread = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return `mean ${mean.toFixed(0)}, spread ±${sd.toFixed(0)}`;
};

await fs.writeFile(PICKS, JSON.stringify(picks, null, 1));

console.log(`\n\nRe-graded ${done} photos (${kept} kept their existing image).`);
console.log(`  brightness before: ${spread(before)}`);
console.log(`  brightness after:  ${spread(after)}`);
await prisma.$disconnect();
