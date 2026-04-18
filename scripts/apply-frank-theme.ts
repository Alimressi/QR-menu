import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const frankTheme = {
  brandName: "Frank by Basta",
  brandSubtitle: "Urban grill and comfort food with signature vibe.",
  primaryColor: "#c73a2d",
  accentTextColor: "#fff3e5",
  backgroundFrom: "#111111",
  backgroundTo: "#1f1a18",
  surfaceColor: "#1c1715",
  textColor: "#f5e9db",
  mutedTextColor: "#c5ac93",
  borderColor: "#5c322b",
  buttonRadius: "14px",
  cardRadius: "18px",
  tableCount: 10,
  panelColor: "#171312",
  overlayColor: "#090909",
  controlSurfaceColor: "#2a201d",
  activeChipBackground: "#c73a2d",
  activeChipTextColor: "#fff3e5",
  inactiveChipBackground: "#2a201d",
  inactiveChipTextColor: "#dbc4ae",
  dividerColor: "#5c322b",
  successColor: "#2ea66a",
  errorColor: "#d9534f",
  categoryTitleColor: "#ffd9b5",
  qtyButtonBackground: "#2a201d",
  qtyButtonTextColor: "#f5e9db",
  qtyButtonBorderColor: "#6b3c33",
  currencyMode: "symbol",
} as const;

async function main() {
  const existing = await prisma.restaurant.findUnique({
    where: { slug: "frank-by-basta" },
    select: { id: true, settings: true },
  });

  if (!existing) {
    await prisma.restaurant.create({
      data: {
        name: "Frank by Basta",
        slug: "frank-by-basta",
        logoUrl: null,
        settings: JSON.stringify(frankTheme),
      },
    });

    console.log("Created restaurant 'frank-by-basta' and applied design settings.");
    return;
  }

  let oldSettings: Record<string, unknown> = {};
  if (existing.settings) {
    try {
      oldSettings = JSON.parse(existing.settings) as Record<string, unknown>;
    } catch {
      oldSettings = {};
    }
  }

  await prisma.restaurant.update({
    where: { id: existing.id },
    data: {
      settings: JSON.stringify({
        ...oldSettings,
        ...frankTheme,
      }),
    },
  });

  console.log("Applied Frank by Basta design settings successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
