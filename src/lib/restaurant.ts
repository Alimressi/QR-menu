import prisma from "./prisma";
import { isRestaurantServable } from "./subscription";

/**
 * Guard for the public, unauthenticated endpoints that feed the guest menu.
 *
 * A suspended tenant must not have its dishes readable or orderable, otherwise
 * the notice on the menu page is cosmetic — the data is still one API call away.
 * An unknown restaurant is not servable either.
 */
export async function isRestaurantServableById(restaurantId: number): Promise<boolean> {
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return false;
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { status: true, trialEndsAt: true },
    });

    return restaurant !== null && isRestaurantServable(restaurant);
  } catch {
    // Prisma cold-starts flakily on Workers. A failed lookup must not be read as
    // "unpaid" — that would take a paying restaurant's menu down over a blip.
    // Serve, and let the next request decide.
    return true;
  }
}

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
  // When false, the guest menu drops all dish photos and renders a compact
  // text-only list (name · description · price). Defaults to true (photos on).
  photosEnabled: boolean;
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

// Keys inside the settings JSON that must NEVER reach the browser or any public
// API response. Admin credentials are stored alongside theme values in the same
// blob, so anything served publicly has to be stripped of these first.
const SENSITIVE_SETTINGS_KEYS = ["adminLogin", "adminPassword", "adminPasswordHash"] as const;

// Parse the raw settings JSON and return a plain object with credential fields
// removed — safe to serialize into HTML/props or a public API response.
export function getPublicSettingsFromRaw(
  rawSettings: string | null | undefined,
): Record<string, unknown> | undefined {
  if (!rawSettings) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(rawSettings) as Record<string, unknown>;
    for (const key of SENSITIVE_SETTINGS_KEYS) {
      delete parsed[key];
    }
    return parsed;
  } catch {
    return undefined;
  }
}

// Same as above but returns a JSON string (or null), matching the shape callers
// that pass `settings` straight through to a JSON response expect.
export function stripSensitiveSettings(rawSettings: string | null | undefined): string | null {
  const cleaned = getPublicSettingsFromRaw(rawSettings);
  return cleaned ? JSON.stringify(cleaned) : null;
}

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

// Neutral light-grey starter theme for a brand-new restaurant. Deliberately not
// the Nine Lives gold — a blank canvas the super-admin then recolours. Existing
// restaurants are unaffected (they carry their own full settings).
export function getDefaultRestaurantSettings(): RestaurantSettings {
  return {
    serviceMode: "pro",
    photosEnabled: true,
    brandName: "",
    brandSubtitle: "",
    primaryColor: "#111827",
    accentTextColor: "#ffffff",
    backgroundFrom: "#ffffff",
    backgroundTo: "#f4f4f5",
    surfaceColor: "#ffffff",
    textColor: "#1f2937",
    mutedTextColor: "#6b7280",
    borderColor: "#e5e7eb",
    buttonRadius: "14px",
    cardRadius: "20px",
    tableCount: 5,
    panelColor: "#ffffff",
    overlayColor: "rgba(0, 0, 0, 0.5)",
    controlSurfaceColor: "#f3f4f6",
    activeChipBackground: "#111827",
    activeChipTextColor: "#ffffff",
    inactiveChipBackground: "#f3f4f6",
    inactiveChipTextColor: "#374151",
    dividerColor: "#e5e7eb",
    successColor: "#16a34a",
    errorColor: "#dc2626",
    categoryTitleColor: "#111827",
    qtyButtonBackground: "#f3f4f6",
    qtyButtonTextColor: "#111827",
    qtyButtonBorderColor: "#e5e7eb",
    currencyMode: "manat",
  };
}
