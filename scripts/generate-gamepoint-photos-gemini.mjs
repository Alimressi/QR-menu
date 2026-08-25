// Generate GamePoint's dish photos with Google's Gemini image model.
//
// Replaces the Workers AI path for one reason: brands. flux-1-schnell renders
// "Coca-Cola" as lettering that is subtly wrong, which is worse on a menu than
// no label at all; Gemini draws the bottle a guest would recognise. A venue
// showing the drinks it actually sells is ordinary practice.
//
// Needs GEMINI_API_KEY in .env — get one free at aistudio.google.com.
//
// Free tier is rate limited both per minute and per day, and the limits are not
// published: check https://aistudio.google.com/rate-limit for the real numbers.
// This paces itself and waits out a 429 rather than failing the run, so a slow
// allowance costs time instead of the whole set.
//
// Usage:
//   node scripts/generate-gamepoint-photos-gemini.mjs            # all 92
//   node scripts/generate-gamepoint-photos-gemini.mjs 246,302,914  # a few

import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { PROMPTS, STYLE } from "./gamepoint-photo-prompts.mjs";

const SLUG = "gamepoint";
const OUT = path.join(process.cwd(), "public", "images", "dishes");
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-image";
const GAP_MS = 6000; // keeps well inside a per-minute allowance
const MAX_WAIT_MS = 45 * 60 * 1000; // give a spent minute-quota time to come back

const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const KEY = env.match(/^GEMINI_API_KEY=(.+)$/m)?.[1].trim();

if (!KEY) {
  console.error("Missing GEMINI_API_KEY in .env — create one at https://aistudio.google.com");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}, ${STYLE}` }] }] }),
  });

  const body = await response.json().catch(() => ({}));

  if (response.status === 429) {
    // The retryDelay Google sends back is the honest wait; default if absent.
    const retry = body?.error?.details?.find((d) => String(d["@type"]).includes("RetryInfo"))?.retryDelay;
    const seconds = retry ? Number.parseInt(retry, 10) || 60 : 60;
    return { rateLimited: true, waitMs: Math.min(seconds * 1000 + 2000, 120000) };
  }

  if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(body).slice(0, 120)}`);

  const parts = body?.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((part) => part.inlineData)?.inlineData?.data;

  // A refusal or a text-only answer comes back without image data; say what it
  // said rather than writing an empty file.
  if (!image) throw new Error(`no image: ${parts.map((p) => p.text ?? "").join(" ").slice(0, 100) || "empty"}`);

  return { buffer: Buffer.from(image, "base64") };
}

// The card shows 4:3; the model returns a square. Cropping here means the card
// is never the one throwing framing away.
const toCard = (buffer) =>
  sharp(buffer).resize(1200, 900, { fit: "cover", position: "attention" }).jpeg({ quality: 88 }).toBuffer();

const only = new Set(
  (process.argv[2] ?? "")
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0),
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

await fs.mkdir(OUT, { recursive: true });

let done = 0;
const failed = [];

for (const dish of dishes) {
  if (only.size > 0 && !only.has(dish.id)) continue;

  const prompt = PROMPTS[dish.id];
  if (!prompt) {
    failed.push(`${dish.id} ${dish.nameAz}: no prompt`);
    continue;
  }

  let waited = 0;
  let saved = false;

  while (!saved) {
    try {
      const result = await ask(prompt);

      if (result.rateLimited) {
        waited += result.waitMs;
        if (waited > MAX_WAIT_MS) {
          failed.push(`${dish.id} ${dish.nameAz}: rate limited for ${Math.round(waited / 60000)} min`);
          break;
        }
        process.stdout.write(`\r  ${done}/${dishes.length} waiting ${Math.round(result.waitMs / 1000)}s for quota…      `);
        await sleep(result.waitMs);
        continue;
      }

      await fs.writeFile(path.join(OUT, `dish-${dish.id}.jpg`), await toCard(result.buffer));
      await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: `/images/dishes/dish-${dish.id}.jpg` } });
      done += 1;
      saved = true;
      process.stdout.write(`\r  ${done}  ${dish.nameAz.slice(0, 32).padEnd(32)}`);
    } catch (error) {
      failed.push(`${dish.id} ${dish.nameAz}: ${error.message.slice(0, 90)}`);
      break;
    }
  }

  await sleep(GAP_MS);
}

console.log(`\n\nGenerated ${done} photos with ${MODEL}.`);
if (failed.length > 0) {
  console.log(`  ${failed.length} left on their previous image:`);
  for (const line of failed) console.log(`    ${line}`);
}
await prisma.$disconnect();
