// Generate GamePoint's dish photos with the restaurant's own Workers AI.
//
// Searching stock libraries had a ceiling and we hit it: a stock photo is
// someone else's burger, and across 92 dishes the set never stopped looking
// like 92 different afternoons. Generating them puts the style in the prompt
// instead — one surface, one light, one depth of field — so they match by
// construction rather than by grading afterwards.
//
// Rights are clean: the image is made, not taken from anyone. Cloudflare's
// terms allow commercial use of what the model returns. Nothing is generated
// with a brand on it — see the note in gamepoint-photo-prompts.mjs.
//
// The model runs on the account's AI binding, reached through a throwaway
// worker on localhost (wrangler dev --remote), because there is no Workers AI
// CLI and the app's own binding is only reachable from a deployed request.
//
// Usage:
//   npx wrangler dev --remote --port 8799 --config <scratch>/wrangler.jsonc
//   node scripts/generate-gamepoint-photos.mjs [id,id,...]

import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { PROMPTS, STYLE } from "./gamepoint-photo-prompts.mjs";

const SLUG = "gamepoint";
const OUT = path.join(process.cwd(), "public", "images", "dishes");
const ENDPOINT = process.env.AI_ENDPOINT ?? "http://localhost:8799";
// ~58 neurons an image against Lucid Origin's ~2,590, for a difference the
// card does not show at 133px wide. The whole set fits the free daily
// allowance with room to spare; the prettier model would need a paid plan.
const MODEL = "@cf/black-forest-labs/flux-1-schnell";
// The model's only quality dial: 4 by default, 8 at most, and roughly linear in
// what it costs. At 4 the set came back with a cheeseburger missing its top
// bun, so the extra steps are worth the neurons — 8 across 92 dishes is about
// 10,600, over the daily 10,000, which is why the set is generated in two
// sittings rather than one. Override with STEPS=4 to fit more in a day.
const STEPS = Number(process.env.STEPS ?? 8);

const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

async function generate(prompt) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt: `Professional food photography of ${prompt}, ${STYLE}`,
      model: MODEL,
      steps: STEPS,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    // Out of allowance is worth waiting out rather than failing 92 times.
    if (body.includes("4006")) throw Object.assign(new Error("out of neurons"), { quota: true });
    throw new Error(`${response.status} ${body.slice(0, 80)}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await sharp(buffer).metadata(); // fail here rather than on disk
  return buffer;
}

// The card shows 4:3, and the model returns a square. Cropping to the card's
// own shape here means the card is never the one throwing away the framing.
async function toCard(buffer) {
  return sharp(buffer).resize(1200, 900, { fit: "cover", position: "attention" }).jpeg({ quality: 86 }).toBuffer();
}

const only = new Set(
  (process.argv[2] ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0),
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
const failed = [];

for (const dish of dishes) {
  if (only.size > 0 && !only.has(dish.id)) continue;

  const prompt = PROMPTS[dish.id];
  if (!prompt) {
    failed.push(`${dish.id} ${dish.nameAz}: no prompt written`);
    continue;
  }

  try {
    // One retry: the model occasionally answers with an error body, and a
    // second ask usually succeeds. Losing a dish to a blip is not worth it.
    let buffer;
    try {
      buffer = await generate(prompt);
    } catch (error) {
      if (error.quota) throw error;
      buffer = await generate(prompt);
    }

    await fs.writeFile(path.join(OUT, `dish-${dish.id}.jpg`), await toCard(buffer));
    await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: `/images/dishes/dish-${dish.id}.jpg` } });
    done += 1;
    process.stdout.write(`\r  ${done}  ${dish.nameAz.slice(0, 30).padEnd(30)}`);
  } catch (error) {
    if (error.quota) {
      console.log(`\n\nOut of neurons after ${done}. The rest keep their current photo; re-run tomorrow.`);
      break;
    }
    failed.push(`${dish.id} ${dish.nameAz}: ${error.message.slice(0, 70)}`);
  }
}

console.log(`\n\nGenerated ${done} photos.`);
if (failed.length > 0) {
  console.log(`  ${failed.length} left on their previous image:`);
  for (const line of failed) console.log(`    ${line}`);
}
await prisma.$disconnect();
