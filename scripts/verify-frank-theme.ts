import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: "frank-by-basta" },
    select: { name: true, slug: true, settings: true },
  });

  if (!restaurant) {
    console.log("frank-by-basta not found");
    return;
  }

  const settings = restaurant.settings ? (JSON.parse(restaurant.settings) as Record<string, unknown>) : {};

  console.log(
    JSON.stringify(
      {
        name: restaurant.name,
        slug: restaurant.slug,
        primaryColor: settings.primaryColor,
        backgroundFrom: settings.backgroundFrom,
        backgroundTo: settings.backgroundTo,
        surfaceColor: settings.surfaceColor,
        panelColor: settings.panelColor,
        qtyButtonBackground: settings.qtyButtonBackground,
        qtyButtonTextColor: settings.qtyButtonTextColor,
        qtyButtonBorderColor: settings.qtyButtonBorderColor,
        currencyMode: settings.currencyMode,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
