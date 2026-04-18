import prisma from "./prisma";

export async function getRestaurantBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });
  return restaurant;
}

export async function getRestaurantSettings(slug: string) {
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant?.settings) {
    return getDefaultRestaurantSettings();
  }
  try {
    return {
      ...getDefaultRestaurantSettings(),
      ...JSON.parse(restaurant.settings),
    };
  } catch {
    return getDefaultRestaurantSettings();
  }
}

export type RestaurantSettings = {
  serviceMode: "lite" | "pro";
  brandName: string;
  brandSubtitle: string;
  primaryColor: string;
  accentTextColor: string;
  backgroundFrom: string;
  backgroundTo: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  buttonRadius: string;
  cardRadius: string;
  tableCount: number;
  panelColor: string;
  overlayColor: string;
  controlSurfaceColor: string;
  activeChipBackground: string;
  activeChipTextColor: string;
  inactiveChipBackground: string;
  inactiveChipTextColor: string;
  dividerColor: string;
  successColor: string;
  errorColor: string;
  categoryTitleColor: string;
  qtyButtonBackground: string;
  qtyButtonTextColor: string;
  qtyButtonBorderColor: string;
  currencyMode: "manat" | "azn" | "symbol";
};

export function getRestaurantServiceModeFromSettings(rawSettings: string | null | undefined) {
  try {
    const parsed = rawSettings ? (JSON.parse(rawSettings) as { serviceMode?: unknown }) : {};
    return parsed.serviceMode === "lite" ? "lite" : "pro";
  } catch {
    return "pro";
  }
}

export function getRestaurantTableCountFromSettings(rawSettings: string | null | undefined) {
  try {
    const parsed = rawSettings ? (JSON.parse(rawSettings) as { tableCount?: unknown }) : {};
    const value = Number(parsed.tableCount);

    if (!Number.isInteger(value) || value < 1) {
      return 5;
    }

    return Math.min(value, 200);
  } catch {
    return 5;
  }
}

function getDefaultRestaurantSettings(): RestaurantSettings {
  return {
    serviceMode: "pro",
    brandName: "Nine Lives",
    brandSubtitle: "Craft cocktails. Fine dishes. Timeless atmosphere.",
    primaryColor: "#b8944f",
    accentTextColor: "#120e08",
    backgroundFrom: "#0a0a0a",
    backgroundTo: "#0d0d0d",
    surfaceColor: "rgba(18, 18, 18, 0.86)",
    textColor: "#f0e8d0",
    mutedTextColor: "#c9b28d",
    borderColor: "rgba(201, 169, 98, 0.35)",
    buttonRadius: "14px",
    cardRadius: "20px",
    tableCount: 5,
    panelColor: "#161616",
    overlayColor: "rgba(0, 0, 0, 0.55)",
    controlSurfaceColor: "#2a2a2a",
    activeChipBackground: "#b8944f",
    activeChipTextColor: "#120e08",
    inactiveChipBackground: "#1f1f1f",
    inactiveChipTextColor: "#f0e8d0",
    dividerColor: "rgba(201, 169, 98, 0.35)",
    successColor: "#34d399",
    errorColor: "#f87171",
    categoryTitleColor: "#f0e8d0",
    qtyButtonBackground: "#2a2a2a",
    qtyButtonTextColor: "#f0e8d0",
    qtyButtonBorderColor: "rgba(201, 169, 98, 0.35)",
    currencyMode: "manat",
  };
}
