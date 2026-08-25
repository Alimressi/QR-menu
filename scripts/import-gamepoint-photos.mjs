// Take the photographs made by hand in AI Studio into the menu.
//
// This started as a way in for the thirteen branded drinks, the ones
// flux-1-schnell could not letter — it returns "Coca-Colla" in drifting type,
// and that on a menu the guest is holding is worse than an empty frame. The
// trial then put flux against the same three dishes twice, at four steps and at
// eight, and the gap to AI Studio stayed wide: at four steps a cheeseburger
// came back with no top bun, at eight the burger was right but a VIP set drifted
// onto a pale grey backdrop, and neither pass could count to four bottles. So
// the whole set goes through AI Studio now, and this is the door for all of it.
//
// Photos land here as files named by dish id — 254.jpeg, 225.jpeg — which is
// what tells a photo its dish.
//
// AI Studio hands back a wide frame — around 1.83:1 — where the card wants
// 4:3, and the difference is taken off the sides rather than added as bars.
// It can be: the prompt puts the bottle in the middle of an empty black
// backdrop, so the outer quarter of each side is unlit black holding nothing.
// Cropping it away fills the card with the bottle instead of shrinking the
// bottle to fit the frame it arrived in.
//
// Usage:
//   node scripts/import-gamepoint-photos.mjs [folder]
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
const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

// Everything is cropped to the card, never fitted onto black. Fitting was the
// safer rule and it looked it: the one portrait frame in the set came back with
// pillars down both sides and its bowl half the size of every neighbour's. On a
// 133px card a smaller subject costs more than a tighter crop does.
//
// A frame wider than the card is cropped from the centre, because the prompt
// puts the subject in the middle and what the sides hold is unlit backdrop. A
// frame taller than the card has no such guarantee — the subject can sit low,
// as the pistachios do — so those are cropped on sharp's "attention", which
// looks for where the detail is instead of assuming the middle.
async function toCard(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const taller = width / height < CARD_W / CARD_H;

  return sharp(buffer)
    .resize(CARD_W, CARD_H, { fit: "cover", position: taller ? sharp.strategy.attention : "center" })
    .jpeg({ quality: 90 })
    .toBuffer();
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

console.log(`\nImported ${done.length} photos.`);

// What is left is asked of the menu rather than kept in a list here. The list
// was right while only the drinks came this way; now that every dish does, a
// hand-kept copy of the menu is one more thing to forget to update.
const remaining = await prisma.dish.count({
  where: { restaurantId: restaurant.id, imageUrl: "" },
});
const total = await prisma.dish.count({ where: { restaurantId: restaurant.id } });
console.log(`  ${total - remaining} of ${total} dishes now have one, ${remaining} to go.`);
if (failed.length > 0) {
  console.log(`  ${failed.length} skipped:`);
  for (const line of failed) console.log(`    ${line}`);
}

await prisma.$disconnect();
