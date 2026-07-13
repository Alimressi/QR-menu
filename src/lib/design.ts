// Shared restaurant theming contract used by the public menu and admin dashboards.
// This is the *render* subset of a restaurant's design settings — the super-admin
// editor works with a richer superset (brand name, table count, quantity buttons…)
// but every consumer that only paints the UI relies on these fields.

export type CurrencyMode = "manat" | "azn" | "symbol";

export type RestaurantDesign = {
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
  panelColor: string;
  controlSurfaceColor: string;
  activeChipBackground: string;
  activeChipTextColor: string;
  inactiveChipBackground: string;
  inactiveChipTextColor: string;
  dividerColor: string;
  successColor: string;
  errorColor: string;
  currencyMode: CurrencyMode;
};

export const defaultDesign: RestaurantDesign = {
  primaryColor: "#b8944f",
  accentTextColor: "#120e08",
  backgroundFrom: "#0a0a0a",
  backgroundTo: "#0d0d0d",
  surfaceColor: "rgba(18,18,18,0.86)",
  textColor: "#f0e8d0",
  mutedTextColor: "#c9b28d",
  borderColor: "rgba(201,169,98,0.35)",
  buttonRadius: "14px",
  cardRadius: "20px",
  panelColor: "#161616",
  controlSurfaceColor: "#2a2a2a",
  activeChipBackground: "#b8944f",
  activeChipTextColor: "#120e08",
  inactiveChipBackground: "#1f1f1f",
  inactiveChipTextColor: "#f0e8d0",
  dividerColor: "rgba(201,169,98,0.35)",
  successColor: "#34d399",
  errorColor: "#f87171",
  currencyMode: "manat",
};

export function normalizeRadius(value: string | undefined, fallbackPx: string) {
  if (!value) {
    return fallbackPx;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallbackPx;
  }

  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackPx;
  }

  return `${parsed}px`;
}

export function parseRestaurantDesign(rawSettings: unknown): RestaurantDesign {
  let parsed: Record<string, unknown> = {};

  if (typeof rawSettings === "string") {
    try {
      parsed = JSON.parse(rawSettings) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (rawSettings && typeof rawSettings === "object") {
    parsed = rawSettings as Record<string, unknown>;
  }

  return {
    ...defaultDesign,
    ...parsed,
    buttonRadius: normalizeRadius(typeof parsed.buttonRadius === "string" ? parsed.buttonRadius : undefined, "14px"),
    cardRadius: normalizeRadius(typeof parsed.cardRadius === "string" ? parsed.cardRadius : undefined, "20px"),
    currencyMode:
      parsed.currencyMode === "azn" || parsed.currencyMode === "symbol" || parsed.currencyMode === "manat"
        ? parsed.currencyMode
        : defaultDesign.currencyMode,
  };
}

export function formatCurrency(value: number, mode: CurrencyMode) {
  if (mode === "azn") {
    return `AZN ${value.toFixed(2)}`;
  }

  if (mode === "symbol") {
    return `₼ ${value.toFixed(2)}`;
  }

  return `${value.toFixed(2)} manat`;
}
