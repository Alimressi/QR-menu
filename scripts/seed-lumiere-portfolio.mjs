// Seed the "Lumière" portfolio restaurant: a light, editorial demo menu.
// Creates the restaurant (light theme, lite mode), 5 categories, 20 dishes,
// and fetches a cohesive set of bright/light food photos from Pexels.
//
// Re-runnable: deletes an existing "lumiere" restaurant first, then recreates.
// Usage: node scripts/seed-lumiere-portfolio.mjs   (needs PEXELS_API_KEY in .env)

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";

const envRaw = await fs.readFile(".env", "utf8");
const readEnv = (k) => (envRaw.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
process.env.DATABASE_URL = readEnv("DATABASE_URL");
const PEXELS_KEY = readEnv("PEXELS_API_KEY");
if (!PEXELS_KEY) { console.error("Missing PEXELS_API_KEY in .env"); process.exit(1); }

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const OUT_DIR = path.join(process.cwd(), "public", "images", "dishes");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const design = {
  serviceMode: "lite",
  basePrimaryColor: "#33302a",
  baseSecondaryColor: "#b89b6a",
  baseNeutralColor: "#f4f1ea",
  brandName: "Lumière",
  brandSubtitle: "Seasonal European kitchen · all-day dining",
  primaryColor: "#33302a",
  accentTextColor: "#faf8f3",
  backgroundFrom: "#ffffff",
  backgroundTo: "#f3efe7",
  surfaceColor: "#ffffff",
  textColor: "#26231d",
  mutedTextColor: "#8a8579",
  borderColor: "#e9e3d6",
  buttonRadius: "12px",
  cardRadius: "18px",
  tableCount: "12",
  panelColor: "#ffffff",
  overlayColor: "#2a2724",
  controlSurfaceColor: "#f4f1ea",
  activeChipBackground: "#33302a",
  activeChipTextColor: "#faf8f3",
  inactiveChipBackground: "#f4f1ea",
  inactiveChipTextColor: "#5c574c",
  dividerColor: "#ece7db",
  successColor: "#4a7c59",
  errorColor: "#c0563f",
  categoryTitleColor: "#26231d",
  qtyButtonBackground: "#f4f1ea",
  qtyButtonTextColor: "#33302a",
  qtyButtonBorderColor: "#e3ddcd",
  currencyMode: "manat",
};

// [categoryEn, categoryRu, categoryAz, [ [nameEn,nameRu,nameAz, descEn,descRu,descAz, price, query], ... ]]
const MENU = [
  ["Breakfast & Brunch", "Завтрак и бранч", "Səhər yeməyi", [
    ["Avocado Toast", "Тост с авокадо", "Avokado tost", "Sourdough, smashed avocado, poached egg, chili flakes", "Хлеб на закваске, авокадо, яйцо пашот, чили", "Turş xəmir, avokado, yumurta, çili", 11, "avocado toast poached egg marble"],
    ["Eggs Benedict", "Яйца Бенедикт", "Benedikt yumurta", "Poached eggs, ham, hollandaise, English muffin", "Яйца пашот, ветчина, голландский соус, маффин", "Yumurta, vetçina, hollandez sousu", 13, "eggs benedict white plate"],
    ["Buttermilk Pancakes", "Панкейки", "Pancake", "Maple syrup, butter, fresh berries", "Кленовый сироп, масло, свежие ягоды", "Ağcaqayın siropu, kərə yağı, giləmeyvə", 10, "pancakes berries maple marble"],
    ["Granola Bowl", "Гранола-боул", "Qranola bowl", "Greek yogurt, honey granola, seasonal fruit", "Греческий йогурт, гранола, сезонные фрукты", "Yunan qatığı, qranola, mövsümi meyvə", 9, "granola yogurt bowl marble"],
  ]],
  ["Salads & Bowls", "Салаты и боулы", "Salatlar", [
    ["Caesar Salad", "Салат Цезарь", "Sezar salatı", "Romaine, parmesan, croutons, classic dressing", "Романо, пармезан, крутоны, соус Цезарь", "Romaine, parmezan, krutonlar", 12, "caesar salad white plate"],
    ["Burrata & Tomato", "Буррата с томатами", "Burrata", "Creamy burrata, heirloom tomatoes, basil oil", "Сливочная буррата, томаты, базиликовое масло", "Burrata, pomidor, reyhan yağı", 14, "burrata tomato salad marble"],
    ["Quinoa Power Bowl", "Боул с киноа", "Kinoa bowl", "Quinoa, avocado, chickpeas, tahini dressing", "Киноа, авокадо, нут, соус тахини", "Kinoa, avokado, noxud, tahini", 12, "quinoa bowl avocado white"],
    ["Greek Salad", "Греческий салат", "Yunan salatı", "Cucumber, feta, kalamata olives, red onion", "Огурец, фета, оливки, красный лук", "Xiyar, feta, zeytun, soğan", 11, "greek salad white plate marble"],
  ]],
  ["Main Courses", "Основные блюда", "Əsas yeməklər", [
    ["Grilled Salmon", "Лосось на гриле", "Qızardılmış qızılbalıq", "Fillet, asparagus, lemon butter sauce", "Филе, спаржа, лимонно-масляный соус", "Balıq filesi, qulançar, limon sousu", 24, "grilled salmon asparagus white plate"],
    ["Truffle Tagliatelle", "Тальятелле с трюфелем", "Trüflü makaron", "Fresh pasta, wild mushrooms, black truffle", "Свежая паста, лесные грибы, трюфель", "Təzə makaron, göbələk, trüfel", 19, "truffle pasta white plate"],
    ["Wagyu Burger", "Бургер Вагю", "Vagyu burger", "Beef patty, aged cheddar, caramelized onion", "Котлета из говядины, чеддер, лук", "Mal əti, çedder, soğan", 18, "gourmet burger marble"],
    ["Roast Chicken", "Запечённая курица", "Bişmiş toyuq", "Half chicken, garden herbs, roast potatoes", "Половина курицы, травы, картофель", "Toyuq, göyərti, kartof", 20, "roast chicken white plate"],
  ]],
  ["Desserts", "Десерты", "Desertlər", [
    ["Vanilla Cheesecake", "Ванильный чизкейк", "Vanil çizkek", "New York style, berry compote", "Нью-Йорк, ягодный компот", "Nyu-York üslubu, giləmeyvə", 9, "cheesecake berry white plate"],
    ["Tiramisu", "Тирамису", "Tiramisu", "Mascarpone, espresso, cocoa dust", "Маскарпоне, эспрессо, какао", "Maskarpone, espresso, kakao", 8, "tiramisu white plate marble"],
    ["Chocolate Fondant", "Шоколадный фондан", "Şokolad fondan", "Molten centre, vanilla ice cream", "Жидкий центр, ванильное мороженое", "Axan mərkəz, vanil dondurma", 10, "chocolate lava cake white plate"],
    ["Berry Pavlova", "Павлова", "Pavlova", "Crisp meringue, cream, fresh berries", "Меренга, крем, свежие ягоды", "Beze, krem, giləmeyvə", 9, "pavlova dessert berries white"],
  ]],
  ["Drinks", "Напитки", "İçkilər", [
    ["Cappuccino", "Капучино", "Kapuçino", "Double shot, silky steamed milk", "Двойной эспрессо, молочная пена", "İkiqat espresso, süd köpüyü", 5, "cappuccino marble white"],
    ["Fresh Orange Juice", "Свежий апельсиновый сок", "Portağal şirəsi", "Cold-pressed, 100% oranges", "Холодный отжим, 100% апельсины", "Soyuq sıxılmış, 100% portağal", 6, "fresh orange juice glass marble"],
    ["Iced Latte", "Айс латте", "Buzlu latte", "Espresso, cold milk, ice", "Эспрессо, холодное молоко, лёд", "Espresso, soyuq süd, buz", 6, "iced latte glass marble"],
    ["Homemade Lemonade", "Домашний лимонад", "Ev limonadı", "Lemon, mint, sparkling water", "Лимон, мята, газированная вода", "Limon, nanə, qazlı su", 5, "lemonade mint glass marble"],
  ]],
];

function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

async function search(query, perPage = 10) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (!res.ok) return [];
  return (await res.json()).photos || [];
}

async function fetchBrightPhoto(query, fallback) {
  let photos = await search(query);
  if (!photos.length) photos = await search(fallback);
  if (!photos.length) return null;
  // Prefer the brightest (lightest background) photo for a cohesive light set.
  return photos.slice().sort((a, b) => luminance(b.avg_color) - luminance(a.avg_color))[0];
}

async function download(photo, dishId) {
  const imgUrl = photo.src.landscape || photo.src.large || photo.src.original;
  const buf = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());
  await fs.writeFile(path.join(OUT_DIR, `dish-${dishId}.jpg`), buf);
}

// --- create ---
await fs.mkdir(OUT_DIR, { recursive: true });

const existing = await prisma.restaurant.findUnique({ where: { slug: "lumiere" }, select: { id: true } });
if (existing) {
  console.log("Removing existing 'lumiere' restaurant to reseed…");
  await prisma.restaurant.delete({ where: { id: existing.id } });
}

const settings = {
  ...design,
  adminLogin: "lumiere",
  adminPasswordHash: await bcrypt.hash("lumiere2026", 10),
};

const restaurant = await prisma.restaurant.create({
  data: { name: "Lumière", slug: "lumiere", settings: JSON.stringify(settings) },
});
console.log("Created restaurant Lumière #", restaurant.id);

let dishCount = 0;
for (const [catEn, catRu, catAz, dishes] of MENU) {
  const category = await prisma.category.create({
    data: { nameEn: catEn, nameRu: catRu, nameAz: catAz, restaurantId: restaurant.id },
  });
  for (const [nEn, nRu, nAz, dEn, dRu, dAz, price, query] of dishes) {
    const dish = await prisma.dish.create({
      data: {
        nameEn: nEn, nameRu: nRu, nameAz: nAz,
        descriptionEn: dEn, descriptionRu: dRu, descriptionAz: dAz,
        price, imageUrl: "/images/dish-1.svg",
        categoryId: category.id, restaurantId: restaurant.id,
      },
    });
    const photo = await fetchBrightPhoto(query, nEn);
    if (photo) {
      await download(photo, dish.id);
      await prisma.dish.update({ where: { id: dish.id }, data: { imageUrl: `/images/dishes/dish-${dish.id}.jpg` } });
    }
    dishCount++;
    process.stdout.write(`\r  ${dishCount}/20  ${nEn.padEnd(24)}`);
    await sleep(250);
  }
}

console.log(`\n\nDone. Lumière: ${MENU.length} categories, ${dishCount} dishes.`);
console.log("Admin: /lumiere/admin  login: lumiere  password: lumiere2026");
await prisma.$disconnect();
