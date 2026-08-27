// Copy a restaurant — menu, categories, theme, photos — under a new name.
//
// Two venues under one brand want the same menu with small differences: a
// section one of them does not serve, a set that runs an hour longer. Building
// the second by hand means re-entering ninety dishes and re-picking every
// colour, and the two drift apart the first time one is edited.
//
// Photos are shared rather than copied: both restaurants point at the same
// files in public/images/dishes. They are the same dishes photographed once,
// and duplicating 92 files to say so would only mean two copies to keep in
// step. Changing a photo changes it for both, which is the intent; if a venue
// ever needs its own, give it its own imageUrl then.
//
// Usage:
//   node scripts/clone-restaurant.mjs --from gamepoint-pro --slug gamepoint --name "GamePoint" \
//        [--skip-category "Spirtli İçkilər"] [--replace "2 saat=3 saat" --replace-in "Setlər"]
//
// --replace rewrites dish descriptions, and --replace-in limits it to one
// category, because "2 saat" appears in sets that are otherwise identical.

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function argAll(name) {
  return process.argv.reduce((found, value, index) => {
    if (value === `--${name}`) found.push(process.argv[index + 1]);
    return found;
  }, []);
}

const fromSlug = arg("from");
const newSlug = arg("slug");
const newName = arg("name");
const skipCategories = new Set(argAll("skip-category"));
const replaceIn = arg("replace-in");
const replacements = argAll("replace").map((pair) => {
  const at = pair.indexOf("=");
  return { from: pair.slice(0, at), to: pair.slice(at + 1) };
});

if (!fromSlug || !newSlug || !newName) {
  console.error("Need --from <slug> --slug <new slug> --name <new name>.");
  process.exit(1);
}

const env = await fs.readFile(".env", "utf8");
process.env.DATABASE_URL = env.match(/^DATABASE_URL=(.+)$/m)[1].trim();
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const source = await prisma.restaurant.findUnique({ where: { slug: fromSlug } });
if (!source) {
  console.error(`No restaurant "${fromSlug}".`);
  process.exit(1);
}
if (await prisma.restaurant.findUnique({ where: { slug: newSlug }, select: { id: true } })) {
  console.error(`Slug "${newSlug}" is taken.`);
  process.exit(1);
}

// Applied to a dish's three description columns, not its name: the name is what
// the guest orders by and is the same dish in both venues.
function rewrite(text, categoryName) {
  if (typeof text !== "string" || text.length === 0) return text;
  if (replaceIn && categoryName !== replaceIn) return text;
  return replacements.reduce((value, { from, to }) => value.split(from).join(to), text);
}

const clone = await prisma.restaurant.create({
  data: {
    name: newName,
    slug: newSlug,
    logoUrl: source.logoUrl,
    settings: source.settings,
    status: source.status,
    trialEndsAt: source.trialEndsAt,
  },
});

const categories = await prisma.category.findMany({
  where: { restaurantId: source.id },
  orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
});

let dishCount = 0;
const skipped = [];

for (const category of categories) {
  if (skipCategories.has(category.nameAz)) {
    const count = await prisma.dish.count({ where: { restaurantId: source.id, categoryId: category.id } });
    skipped.push(`${category.nameAz} (${count} dishes)`);
    continue;
  }

  const copy = await prisma.category.create({
    data: {
      nameEn: category.nameEn,
      nameRu: category.nameRu,
      nameAz: category.nameAz,
      sortOrder: category.sortOrder,
      restaurantId: clone.id,
    },
  });

  const dishes = await prisma.dish.findMany({
    where: { restaurantId: source.id, categoryId: category.id },
    orderBy: { id: "asc" },
  });

  for (const dish of dishes) {
    await prisma.dish.create({
      data: {
        nameEn: dish.nameEn,
        nameRu: dish.nameRu,
        nameAz: dish.nameAz,
        descriptionEn: rewrite(dish.descriptionEn, category.nameAz),
        descriptionRu: rewrite(dish.descriptionRu, category.nameAz),
        descriptionAz: rewrite(dish.descriptionAz, category.nameAz),
        price: dish.price,
        imageUrl: dish.imageUrl,
        imagePositionX: dish.imagePositionX,
        imagePositionY: dish.imagePositionY,
        soldOut: dish.soldOut,
        // Carried over, not defaulted to now. The menu lists dishes by
        // createdAt DESC, so this column is the running order — the imports
        // stagger it a second apart to put the cheap sets first. Inserting a
        // clone in one pass makes its own timestamps ascend with the loop, and
        // DESC then reads the whole menu backwards: GamePoint opened with its
        // 70 AZN set above its 32.
        createdAt: dish.createdAt,
        categoryId: copy.id,
        restaurantId: clone.id,
      },
    });
    dishCount += 1;
  }
}

console.log(`Cloned ${source.name} -> ${clone.name} (/${clone.slug})`);
console.log(`  ${categories.length - skipped.length} categories, ${dishCount} dishes`);
if (skipped.length > 0) console.log(`  left out: ${skipped.join(", ")}`);
if (replacements.length > 0) {
  const where = replaceIn ? ` in ${replaceIn}` : "";
  console.log(`  rewrote${where}: ${replacements.map((r) => `${r.from} -> ${r.to}`).join(", ")}`);
}

await prisma.$disconnect();
