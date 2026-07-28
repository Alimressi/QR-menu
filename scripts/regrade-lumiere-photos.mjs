// Make the Lumière photo set feel like one shoot:
//  1) re-fetch every dish on a single surface aesthetic ("marble / white table"),
//     keeping the most relevant reasonably-light result;
//  2) normalise exposure across the whole set (same average brightness) plus a
//     gentle editorial grade, so the lighting reads as one location.
import sharp from "sharp";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const KEY = env.match(/^PEXELS_API_KEY=(.+)$/m)[1].trim();
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const OUT = path.join(process.cwd(), "public", "images", "dishes");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// dish name -> a search term; every query ends in "marble" for one surface look.
const TERMS = {
  "Avocado Toast": "avocado toast marble",
  "Eggs Benedict": "eggs benedict marble",
  "Buttermilk Pancakes": "pancakes stack marble",
  "Granola Bowl": "granola yogurt bowl marble",
  "Caesar Salad": "caesar salad marble",
  "Burrata & Tomato": "burrata cheese marble",
  "Quinoa Power Bowl": "quinoa bowl marble",
  "Greek Salad": "greek salad marble",
  "Grilled Salmon": "grilled salmon fillet marble",
  "Truffle Tagliatelle": "pasta plate marble",
  "Wagyu Burger": "burger marble board",
  "Roast Chicken": "roast chicken marble",
  "Vanilla Cheesecake": "cheesecake slice marble",
  "Tiramisu": "tiramisu marble",
  "Chocolate Fondant": "chocolate lava cake marble",
  "Berry Pavlova": "pavlova dessert marble",
  "Cappuccino": "cappuccino coffee marble",
  "Fresh Orange Juice": "orange juice glass marble",
  "Iced Latte": "iced latte glass marble",
  "Homemade Lemonade": "lemonade glass marble",
};

function rgb(hex) {
  const m = /#?([0-9a-f]{6})/i.exec(hex || "#000000");
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex) {
  const [R, G, B] = rgb(hex);
  return 0.299 * R + 0.587 * G + 0.114 * B;
}
// bright AND neutral (low saturation) => white/grey/marble, not a coloured plate/backdrop
function neutralScore(hex) {
  const [R, G, B] = rgb(hex);
  const l = 0.299 * R + 0.587 * G + 0.114 * B;
  const sat = Math.max(R, G, B) - Math.min(R, G, B);
  return l - 1.9 * sat;
}
async function search(q) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&orientation=landscape`, { headers: { Authorization: KEY } });
  return r.ok ? (await r.json()).photos || [] : [];
}
// keep relevance (top results are the right dish) but pick the most neutral-light one
function pick(photos) {
  if (!photos.length) return null;
  return photos.slice(0, 8).sort((a, b) => neutralScore(b.avg_color) - neutralScore(a.avg_color))[0];
}

const TARGET = 188; // aim every photo at the same airy average brightness

async function grade(buf) {
  const stats = await sharp(buf).stats();
  const mean = 0.299 * stats.channels[0].mean + 0.587 * stats.channels[1].mean + 0.114 * stats.channels[2].mean;
  let factor = TARGET / Math.max(1, mean);
  factor = Math.max(0.9, Math.min(1.16, factor));
  return sharp(buf)
    .resize(1200, 800, { fit: "cover", position: "attention" })
    .modulate({ brightness: factor, saturation: 0.93 })
    .linear(1.04, -5) // whisper of contrast
    .jpeg({ quality: 86 })
    .toBuffer();
}

const r = await prisma.restaurant.findUnique({ where: { slug: "lumiere" }, select: { id: true } });
const dishes = await prisma.dish.findMany({ where: { restaurantId: r.id }, select: { id: true, nameEn: true } });

let done = 0;
for (const d of dishes) {
  const term = TERMS[d.nameEn] || `${d.nameEn} marble`;
  const photo = pick(await search(term));
  if (photo) {
    const raw = Buffer.from(await (await fetch(photo.src.large2x || photo.src.large || photo.src.original)).arrayBuffer());
    const out = await grade(raw);
    await fs.writeFile(path.join(OUT, `dish-${d.id}.jpg`), out);
    done++;
    process.stdout.write(`\r  ${done}/${dishes.length}  ${d.nameEn.padEnd(22)} (lum ${Math.round(lum(photo.avg_color))})   `);
  }
  await sleep(250);
}
console.log(`\n\nRe-graded ${done} Lumière photos onto a unified marble look.`);
await prisma.$disconnect();
