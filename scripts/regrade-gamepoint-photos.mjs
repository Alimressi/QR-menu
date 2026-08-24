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

// Near the set's own brightness, and nothing else.
//
// This used to subtract the photo's colourfulness too, on the theory that a
// neutral surround sits better beside the next card. What it actually did was
// prefer grey photographs: two thirds of the set came back under a third of
// normal saturation, and a dozen were black and white. A set looks shot
// together because the exposure agrees, not because the colour is gone —
// food with the colour drained out looks inedible, which is the opposite of
// the point.
function surfaceScore(hex) {
  return -Math.abs(luminance(hex) - TARGET);
}

// Two libraries rather than one. Pexels has the better food photography;
// Openverse indexes many providers at once (Flickr, Wikimedia and others) and
// covers the branded bottles and cans that a stock library does not.
//
// Openverse is filtered to cc0 and public-domain only. Its other licences are
// CC-BY variants, which oblige the restaurant to print a credit beside every
// photo — not something a menu can carry.
//
// Not Google Images: that is an index of other people's copyrighted work, and
// putting it on a menu that sells things makes the restaurant the infringer.
async function searchPexels(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;
  const response = await fetch(url, { headers: { Authorization: KEY } });
  if (response.status === 429) return { rateLimited: true, candidates: [] };
  if (!response.ok) return { candidates: [] };
  const data = await response.json();
  return {
    candidates: (data.photos || []).map((photo) => ({
      source: (photo.src.large2x || photo.src.large || photo.src.original).split("?")[0],
      full: photo.src.large2x || photo.src.large || photo.src.original,
      preview: photo.src.medium || photo.src.small,
      provider: "pexels",
      licence: "Pexels licence",
    })),
  };
}

// Openverse's public-domain pool is small, and it matches on the whole phrase:
// "coca cola can cold drink" finds nothing while "coca cola can" finds 148. It
// gets the first three words of the query and never the surface term.
function shorten(query) {
  return query.split(/\s+/).slice(0, 3).join(" ");
}

async function searchOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(shorten(query))}&license=cc0,pdm&page_size=12&mature=false`;
  const response = await fetch(url, { headers: { "User-Agent": "qr-menu/1.0 (restaurant menu photo sourcing)" } });
  if (!response.ok) return { candidates: [] };
  const data = await response.json();
  return {
    candidates: (data.results || [])
      .filter((image) => image.url)
      .map((image) => ({
        source: image.url.split("?")[0],
        full: image.url,
        preview: image.thumbnail || image.url,
        provider: image.provider ?? "openverse",
        licence: (image.license ?? "cc0").toUpperCase(),
      })),
  };
}

// Measured on the pixels rather than guessed from a library's average colour,
// because a dark photo and a greyscale one both average to something
// colourless — and only one of the two is worth showing.
async function measure(buffer) {
  const { data } = await sharp(buffer).resize(48, 48, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let colour = 0;
  let light = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    colour += Math.max(r, g, b) - Math.min(r, g, b);
    light += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const pixels = data.length / 3;
  return { colour: colour / pixels, light: light / pixels };
}

const MIN_COLOUR = 35;

async function imageBuffer(url) {
  const response = await fetch(url, { headers: { "User-Agent": "qr-menu/1.0 (restaurant menu photo sourcing)" } });
  if (!response.ok) return null;
  if (!(response.headers.get("content-type") ?? "").startsWith("image/")) return null;
  return Buffer.from(await response.arrayBuffer());
}

// Score previews — cheap — and only download the winner at full size. Stock
// libraries are full of black-and-white and selective-colour shots, and a
// monochrome bottle of cola on a menu reads as a mistake, so anything under
// MIN_COLOUR is only a fallback.
async function choose(candidates, taken) {
  // Per source, not off the top of the pile: concatenating the two lists and
  // taking the first ten meant the ten were always Pexels', and the second
  // library never got as far as being judged.
  const fresh = ["pexels", "other"].flatMap((group) =>
    candidates
      .filter((candidate) => !taken.has(candidate.source))
      .filter((candidate) => (group === "pexels" ? candidate.provider === "pexels" : candidate.provider !== "pexels"))
      .slice(0, 6),
  );
  const scored = [];

  for (const candidate of fresh) {
    try {
      // Openverse proxies thumbnails, and for its Wikimedia entries that proxy
      // answers 424 with a JSON body. Scoring that as an image threw, and every
      // Wikimedia photo — the ones with the actual branded bottles on them —
      // was silently dropped before it could be judged.
      const preview = await imageBuffer(candidate.preview);
      const buffer = preview ?? (await imageBuffer(candidate.full));
      if (!buffer) continue;

      const { colour, light } = await measure(buffer);
      scored.push({ ...candidate, colour, penalty: Math.abs(light - TARGET) });
    } catch {
      // A dead link in the index is not worth failing the dish over.
    }
  }

  const colourful = scored.filter((candidate) => candidate.colour >= MIN_COLOUR);
  let pool = colourful.length > 0 ? colourful : scored;
  if (pool.length === 0) return null;

  // Pexels first, always. The wider index was tried ahead of it on the branded
  // drinks, on the theory that it holds photographs of the actual bottle. It
  // does — and it also holds a museum relief, a row of war medals and a pile of
  // sacks, which is what Red Bull, Çay Fincan and the 500ml cola came back as.
  // Its public-domain pool is small and mostly not food, and nothing here can
  // judge whether a picture is of the right thing. So it is the fallback: used
  // where the stock library returns nothing with colour in it, not preferred
  // over it.
  const ranked = pool.sort((a, b) => a.penalty - b.penalty);
  const stock = ranked.filter((candidate) => candidate.provider === "pexels");
  pool = stock.length > 0 ? stock : ranked;

  // A thumbnail that decoded is no promise the full file will: the wider index
  // carries formats sharp will not open, and the two dishes that hit one were
  // left on their old photo. Hand back the full image already in hand.
  for (const candidate of pool) {
    const full = await imageBuffer(candidate.full);
    if (!full) continue;
    try {
      await sharp(full).metadata();
      return { ...candidate, buffer: full };
    } catch {
      // Unreadable at full size — try the next one down.
    }
  }
  return null;
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
    .modulate({ brightness, saturation: 1.06 })
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
    .map(([, pick]) => (typeof pick === "string" ? pick.split("?")[0] : pick.source)),
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
let rateLimited = false;
let fromOpenverse = 0;
const before = [];
const after = [];
const failed = [];

for (const dish of dishes) {
  if (only.size > 0 && !only.has(dish.id)) continue;

  const base = QUERIES[dish.id];
  if (!base) continue;

  const file = path.join(OUT, `dish-${dish.id}.jpg`);

  // One unreachable image should cost one dish, not the run. A crash here used
  // to lose every pick made so far along with it.
  try {
  const cached = useCache ? picks[dish.id] : null;

  let winner = null;

  if (!cached) {
    // The surface term is what makes the set agree, but on a product shot it
    // can push past every colourful result. Ask again without it rather than
    // settle for a grey bottle.
    for (const query of [`${base} ${SURFACE}`, base]) {
      const pexels = await searchPexels(query);
      if (pexels.rateLimited) {
        await fs.writeFile(PICKS, JSON.stringify(picks, null, 1));
        console.log(`\nPexels rate limit hit after ${done}. Re-run later; picks so far are saved.`);
        rateLimited = true;
        break;
      }

      const openverse = await searchOpenverse(base);
      winner = await choose([...pexels.candidates, ...openverse.candidates], taken);
      if (winner && winner.colour >= MIN_COLOUR) break;
    }
    if (rateLimited) break;
  }

  let raw;
  if (cached) {
    raw = Buffer.from(await (await fetch(cached.full ?? cached)).arrayBuffer());
  } else if (winner) {
    raw = winner.buffer;
    picks[dish.id] = { full: winner.full, source: winner.source, provider: winner.provider, licence: winner.licence };
    taken.add(winner.source);
    fromOpenverse += winner.provider === "pexels" ? 0 : 1;
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
  await sleep(DELAY_MS);
  } catch (error) {
    failed.push(`${dish.id} ${dish.nameAz}: ${error.message.slice(0, 60)}`);
  }
}

const spread = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return `mean ${mean.toFixed(0)}, spread ±${sd.toFixed(0)}`;
};

await fs.writeFile(PICKS, JSON.stringify(picks, null, 1));

console.log(`\n\nRe-graded ${done} photos (${kept} kept their existing image, ${fromOpenverse} sourced outside Pexels).`);
console.log(`  brightness before: ${spread(before)}`);
console.log(`  brightness after:  ${spread(after)}`);
if (failed.length > 0) {
  console.log(`  ${failed.length} left alone after an error:`);
  for (const line of failed) console.log(`    ${line}`);
}
await prisma.$disconnect();
