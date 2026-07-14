import type { RestaurantDesignSettings } from "./types";

export function clampRgb(value: number) {
  return Math.min(255, Math.max(0, value));
}

export function toHex(value: number) {
  return clampRgb(value).toString(16).padStart(2, "0");
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace("#", "");
  const expanded = normalized.length === 3
    ? normalized
        .split("")
        .map((part) => `${part}${part}`)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return [0, 0, 0];
  }

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return [r, g, b];
}

export function mixHex(left: string, right: string, ratio: number) {
  const safeRatio = Math.min(1, Math.max(0, ratio));
  const [lr, lg, lb] = hexToRgb(left);
  const [rr, rg, rb] = hexToRgb(right);

  return rgbToHex(
    Math.round(lr + (rr - lr) * safeRatio),
    Math.round(lg + (rg - lg) * safeRatio),
    Math.round(lb + (rb - lb) * safeRatio),
  );
}

export function getReadableTextColor(background: string) {
  const [r, g, b] = hexToRgb(background);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#2c2218" : "#fff8ee";
}

export function generatePaletteFromThreeColors(
  basePrimaryColor: string,
  baseSecondaryColor: string,
  baseNeutralColor: string,
) {
  const primaryColor = basePrimaryColor;
  const accentTextColor = getReadableTextColor(primaryColor);
  const backgroundFrom = mixHex(baseNeutralColor, "#ffffff", 0.88);
  const backgroundTo = mixHex(baseNeutralColor, baseSecondaryColor, 0.28);
  const surfaceColor = mixHex(baseNeutralColor, "#ffffff", 0.93);
  const panelColor = mixHex(baseNeutralColor, "#ffffff", 0.82);
  const controlSurfaceColor = mixHex(baseNeutralColor, "#ffffff", 0.72);
  const textColor = mixHex(baseNeutralColor, "#20170f", 0.86);
  const mutedTextColor = mixHex(textColor, "#ffffff", 0.34);
  const borderColor = mixHex(baseNeutralColor, primaryColor, 0.32);
  const activeChipBackground = primaryColor;
  const activeChipTextColor = accentTextColor;
  const inactiveChipBackground = mixHex(baseNeutralColor, "#ffffff", 0.68);
  const inactiveChipTextColor = mixHex(textColor, "#ffffff", 0.22);
  const dividerColor = mixHex(borderColor, "#ffffff", 0.18);
  const successColor = mixHex("#1f8a55", primaryColor, 0.15);
  const errorColor = "#c45151";
  const categoryTitleColor = mixHex(textColor, primaryColor, 0.1);
  const qtyButtonBackground = controlSurfaceColor;
  const qtyButtonTextColor = textColor;
  const qtyButtonBorderColor = borderColor;
  const overlayColor = mixHex(baseNeutralColor, "#7f6441", 0.22);

  return {
    primaryColor,
    accentTextColor,
    backgroundFrom,
    backgroundTo,
    surfaceColor,
    textColor,
    mutedTextColor,
    borderColor,
    panelColor,
    overlayColor,
    controlSurfaceColor,
    activeChipBackground,
    activeChipTextColor,
    inactiveChipBackground,
    inactiveChipTextColor,
    dividerColor,
    successColor,
    errorColor,
    categoryTitleColor,
    qtyButtonBackground,
    qtyButtonTextColor,
    qtyButtonBorderColor,
  } satisfies Partial<RestaurantDesignSettings>;
}
