// Re-fetch photos for Nine Lives DRINK categories with type-based queries.
// Brand names (Grey Goose, Bombay, Chabiant, Piano…) mislead image search, so
// for spirit/wine categories we query the drink TYPE and give each dish a
// distinct photo from that pool. Food categories are left untouched.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

const envRaw = await fs.readFile(".env", "utf8");
const readEnv = (k) => (envRaw.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
process.env.DATABASE_URL = readEnv("DATABASE_URL");
const PEXELS_KEY = readEnv("PEXELS_API_KEY");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const OUT_DIR = path.join(process.cwd(), "public", "images", "dishes");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Categories where the dish name is a brand → query a fixed drink-type term.
const FIXED = {
  Whiskey: "whiskey glass", Gin: "gin cocktail glass", Vodka: "vodka cocktail",
  Rum: "rum cocktail glass", Tequila: "tequila glass",
  "Classic Wines": "red wine glass", "Local Red Wines": "red wine glass", Wines: "red wine glass",
  "Local White Wine": "white wine glass", "Local Rose Wine": "rose wine glass",
  "Sparkling Wines": "champagne glass pour", Liqueurs: "liqueur glass drink",
  Aperitive: "aperitif cocktail", "Classic Cocktails": "cocktail glass drink",
  "Signature Cocktails": "cocktail glass drink", Beer: "beer glass pour",
  "Shot Section": "shot glasses bar", Sour: "whiskey sour cocktail",
  "Hot Alcohol": "irish coffee cocktail", "Ice Coffee": "iced coffee glass",
};
// Categories where the dish name IS a real drink type → keep name + a hint term.
const NAMED = {
  Coffee: (n) => `${n} coffee cup`,
  "Soft Drinks": (n) => `${n} drink`,
  Lemonades: (n) => `${n} lemonade drink`,
};
// One-off fixes for food dishes named after cities.
const FOOD_OVERRIDE = { 51: "california roll sushi", 52: "philadelphia sushi roll" };

async function search(query, perPage) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) return [];
  return (await res.json()).photos || [];
}

async function download(photo, dishId) {
  const imgUrl = photo.src.landscape || photo.src.large || photo.src.original;
  const buf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
  await fs.writeFile(path.join(OUT_DIR, `dish-${dishId}.jpg`), buf);
}

const r = await prisma.restaurant.findUnique({ where: { slug: "ninelives" }, select: { id: true } });
const cats = await prisma.category.findMany({ where: { restaurantId: r.id }, select: { id: true, nameEn: true } });
const catById = Object.fromEntries(cats.map((c) => [c.id, c.nameEn]));
const dishes = await prisma.dish.findMany({ where: { restaurantId: r.id }, select: { id: true, nameEn: true, categoryId: true } });

let done = 0;

// FIXED categories: one search per category, distribute distinct photos.
for (const [catName, query] of Object.entries(FIXED)) {
  const catDishes = dishes.filter((d) => catById[d.categoryId] === catName);
  if (!catDishes.length) continue;
  const pool = await search(query, Math.min(80, catDishes.length * 2 + 10));
  if (!pool.length) { console.log(`  ! no results for "${query}" (${catName})`); continue; }
  for (let i = 0; i < catDishes.length; i++) {
    await download(pool[i % pool.length], catDishes[i].id);
    done++;
  }
  process.stdout.write(`\r  ${done} done  (${catName})                    `);
  await sleep(250);
}

// NAMED categories: per-dish search keeps drink-type specificity.
for (const [catName, makeQuery] of Object.entries(NAMED)) {
  const catDishes = dishes.filter((d) => catById[d.categoryId] === catName);
  const used = new Set();
  for (const d of catDishes) {
    const photos = await search(makeQuery(d.nameEn), 6);
    const photo = photos.find((p) => !used.has(p.id)) || photos[0];
    if (photo) { used.add(photo.id); await download(photo, d.id); done++; }
    process.stdout.write(`\r  ${done} done  (${catName}: ${d.nameEn.slice(0, 20)})            `);
    await sleep(250);
  }
}

// Food overrides.
for (const [id, query] of Object.entries(FOOD_OVERRIDE)) {
  const photos = await search(query, 4);
  if (photos[0]) { await download(photos[0], Number(id)); done++; }
  await sleep(250);
}

console.log(`\n\nRe-fetched ${done} drink/override photos.`);
await prisma.$disconnect();
