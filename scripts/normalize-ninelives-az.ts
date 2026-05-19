import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type ReplacementRule = {
  pattern: RegExp;
  replacement: string;
};

const replacements: ReplacementRule[] = [
  { pattern: /\bKarides\b/g, replacement: "Krevet" },
  { pattern: /\bkarides\b/g, replacement: "krevet" },
  { pattern: /\bSomon\b/g, replacement: "Q\u0131z\u0131lbal\u0131q" },
  { pattern: /\bsomon\b/g, replacement: "q\u0131z\u0131lbal\u0131q" },
  { pattern: /\bShrimps\b/g, replacement: "Krevet" },
  { pattern: /\bshrimps\b/g, replacement: "krevet" },
  { pattern: /\bShrimp\b/g, replacement: "Krevet" },
  { pattern: /\bshrimp\b/g, replacement: "krevet" },
  { pattern: /\bSalmon\b/g, replacement: "Q\u0131z\u0131lbal\u0131q" },
  { pattern: /\bsalmon\b/g, replacement: "q\u0131z\u0131lbal\u0131q" },
];

function normalizeAzText(value: string): string {
  let next = value;

  for (const rule of replacements) {
    next = next.replace(rule.pattern, rule.replacement);
  }

  return next.replace(/\s{2,}/g, " ").trim();
}

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: "ninelives" },
    select: { id: true },
  });

  if (!restaurant) {
    throw new Error("Restaurant with slug ninelives was not found.");
  }

  const dishes = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id },
    select: { id: true, descriptionAz: true },
  });

  const options = await prisma.dishOption.findMany({
    where: { dish: { restaurantId: restaurant.id } },
    select: { id: true, nameAz: true },
  });

  let updatedDishDescriptions = 0;
  for (const dish of dishes) {
    const current = String(dish.descriptionAz || "");
    const normalized = normalizeAzText(current);

    if (normalized !== current) {
      await prisma.dish.update({
        where: { id: dish.id },
        data: { descriptionAz: normalized },
      });
      updatedDishDescriptions += 1;
    }
  }

  let updatedOptionNames = 0;
  for (const option of options) {
    const current = String(option.nameAz || "");
    const normalized = normalizeAzText(current);

    if (normalized !== current) {
      await prisma.dishOption.update({
        where: { id: option.id },
        data: { nameAz: normalized },
      });
      updatedOptionNames += 1;
    }
  }

  console.log(
    `[normalize-az] Updated dish descriptions: ${updatedDishDescriptions}, option names: ${updatedOptionNames}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
