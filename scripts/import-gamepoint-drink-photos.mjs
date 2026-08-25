// Take the thirteen branded drinks made by hand in AI Studio into the menu.
//
// Everything else in the set comes from scripts/generate-gamepoint-photos.mjs,
// which cannot be used here: flux-1-schnell spells a logo the way it spells any
// other word it has only seen in pictures, and "Coca-Colla" on a menu the guest
// is holding is worse than an empty frame. These thirteen are generated in AI
// Studio instead, where the lettering comes out right, and land here as files
// named by dish id — 254.png, 909.jpg — which is what tells a photo its dish.
//
// AI Studio hands back a wide frame — around 1.83:1 — where the card wants
// 4:3, and the difference is taken off the sides rather than added as bars.
// It can be: the prompt puts the bottle in the middle of an empty black
// backdrop, so the outer quarter of each side is unlit black holding nothing.
// Cropping it away fills the card with the bottle instead of shrinking the
// bottle to fit the frame it arrived in.
//
// A frame taller than the card is the one case where that would cut into the
// subject — a tall bottle would lose its neck or its base — so those are fitted
// whole onto black instead. Nothing from AI Studio arrives that way today; the
// branch is there so a portrait screenshot does not quietly lose its subject.
//
// Usage:
//   node scripts/import-gamepoint-drink-photos.mjs [folder]
// Folder defaults to ~/Desktop/gamepoint-drinks.

import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

const SLUG = "gamepoint";
const OUT = path.join(process.cwd(), "public", "images", "dishes");
const SRC = process.argv[2] ?? path.join(os.homedir(), "Desktop", "gamepoint-drinks");
const CARD_W = 1200;
const CARD_H = 900;
const BLACK = { r: 5, g: 5, b: 5 };
// The thirteen the plan hands to AI Studio. Anything else in the folder is
// still imported — the list only decides what counts as missing at the end.
const EXPECTED = [254, 255, 264, 265, 266, 267, 268, 269, 270, 909, 910, 911, 912];

const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

// Wider than the card, or near enough to it, the crop only takes black off the
// sides and the subject ends up filling the frame. Taller than the card, the
// crop would take the subject itself, so the image is fitted whole instead.
//
// The crop is centred rather than sharp's "attention": the subject is centred
// by the prompt, and attention chases contrast, which on a black backdrop with
// a blue glow to one side is not the same thing as the bottle.
async function toCard(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const taller = width / height < CARD_W / CARD_H;

  return taller
    ? sharp(buffer)
        .resize(CARD_W, CARD_H, { fit: "contain", background: BLACK })
        .flatten({ background: BLACK })
        .jpeg({ quality: 90 })
        .toBuffer()
    : sharp(buffer).resize(CARD_W, CARD_H, { fit: "cover", position: "center" }).jpeg({ quality: 90 }).toBuffer();
}

const restaurant = await prisma.restaurant.findUnique({ where: { slug: SLUG }, select: { id: true } });
if (!restaurant) {
  console.error(`Restaurant "${SLUG}" not found.`);
  process.exit(1);
}

let entries;
try {
  entries = await fs.readdir(SRC);
} catch {
  console.error(`No folder at ${SRC}. Put the AI Studio images there, named by dish id.`);
  process.exit(1);
}

const dishes = await prisma.dish.findMany({
  where: { restaurantId: restaurant.id },
  select: { id: true, nameAz: true },
});
const byId = new Map(dishes.map((dish) => [dish.id, dish]));

const done = [];
const failed = [];

for (const entry of entries.sort()) {
  if (!/\.(png|jpe?g|webp)$/i.test(entry)) continue;
  const id = Number(path.basename(entry).replace(/\.[^.]+$/, "").trim());
  if (!Number.isInteger(id)) {
    failed.push(`${entry}: name is not a dish id`);
    continue;
  }
  const dish = byId.get(id);
  if (!dish) {
    failed.push(`${entry}: no dish ${id} at ${SLUG}`);
    continue;
  }

  try {
    const buffer = await toCard(await fs.readFile(path.join(SRC, entry)));
    await fs.writeFile(path.join(OUT, `dish-${id}.jpg`), buffer);
    await prisma.dish.update({ where: { id }, data: { imageUrl: `/images/dishes/dish-${id}.jpg` } });
    done.push(id);
    console.log(`  ${id}  ${dish.nameAz}`);
  } catch (error) {
    failed.push(`${entry}: ${String(error.message).slice(0, 70)}`);
  }
}

console.log(`\nImported ${done.length} drink photos.`);

const missing = EXPECTED.filter((id) => !done.includes(id));
if (missing.length > 0) console.log(`  still to come: ${missing.join(", ")}`);
if (failed.length > 0) {
  console.log(`  ${failed.length} skipped:`);
  for (const line of failed) console.log(`    ${line}`);
}

await prisma.$disconnect();
