"use client";

import { CategoryWithDishes, Dish } from "@/types";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type SuperAdminLanguage = "en" | "ru" | "az";
type RestaurantServiceMode = "lite" | "pro";

type Restaurant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: string | null;
  createdAt: string;
  _count?: {
    categories: number;
    dishes: number;
    orders: number;
  };
};

type DishForm = {
  nameEn: string;
  nameRu: string;
  nameAz: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  imagePositionX: string;
  imagePositionY: string;
};

type RestaurantDesignSettings = {
  basePrimaryColor: string;
  baseSecondaryColor: string;
  baseNeutralColor: string;
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
  tableCount: string;
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

type ColorField =
  | "primaryColor"
  | "accentTextColor"
  | "backgroundFrom"
  | "backgroundTo"
  | "surfaceColor"
  | "textColor"
  | "mutedTextColor"
  | "borderColor"
  | "panelColor"
  | "overlayColor"
  | "controlSurfaceColor"
  | "activeChipBackground"
  | "activeChipTextColor"
  | "inactiveChipBackground"
  | "inactiveChipTextColor"
  | "dividerColor"
  | "successColor"
  | "errorColor"
  | "categoryTitleColor"
  | "qtyButtonBackground"
  | "qtyButtonTextColor"
  | "qtyButtonBorderColor";

const emptyDishForm: DishForm = {
  nameEn: "",
  nameRu: "",
  nameAz: "",
  descriptionEn: "",
  descriptionRu: "",
  descriptionAz: "",
  price: "",
  imageUrl: "",
  categoryId: "",
  imagePositionX: "50",
  imagePositionY: "50",
};

const defaultDesign: RestaurantDesignSettings = {
  basePrimaryColor: "#b8944f",
  baseSecondaryColor: "#d6b37a",
  baseNeutralColor: "#e8dcc7",
  brandName: "Nine Lives",
  brandSubtitle: "Craft cocktails. Fine dishes. Timeless atmosphere.",
  primaryColor: "#b8944f",
  accentTextColor: "#120e08",
  backgroundFrom: "#0a0a0a",
  backgroundTo: "#0d0d0d",
  surfaceColor: "#1b1b1b",
  textColor: "#f0e8d0",
  mutedTextColor: "#c9b28d",
  borderColor: "#6f5f46",
  buttonRadius: "14",
  cardRadius: "20",
  tableCount: "5",
  panelColor: "#161616",
  overlayColor: "#000000",
  controlSurfaceColor: "#2a2a2a",
  activeChipBackground: "#b8944f",
  activeChipTextColor: "#120e08",
  inactiveChipBackground: "#1f1f1f",
  inactiveChipTextColor: "#f0e8d0",
  dividerColor: "#6f5f46",
  successColor: "#34d399",
  errorColor: "#f87171",
  categoryTitleColor: "#f0e8d0",
  qtyButtonBackground: "#2a2a2a",
  qtyButtonTextColor: "#f0e8d0",
  qtyButtonBorderColor: "#6f5f46",
  currencyMode: "manat",
};

const designLabelDictionary: Record<
  SuperAdminLanguage,
  {
    basicSettings: string;
    previewCompare: string;
    savedPreview: string;
    draftPreview: string;
    changedFields: string;
    noChanges: string;
    sectionHeader: string;
    sectionCategoryDish: string;
    sectionBasketControls: string;
    headerCaption: string;
    categoryName: string;
    dishName: string;
    dishDescription: string;
    addButton: string;
    qtySection: string;
    totalLabel: string;
    successSample: string;
    errorSample: string;
    fieldBrandName: string;
    fieldBrandSubtitle: string;
    paletteBuilder: string;
    paletteHint: string;
    basePrimary: string;
    baseSecondary: string;
    baseNeutral: string;
    autoGeneratePalette: string;
    paletteGenerated: string;
    fieldCurrency: string;
    fieldTableCount: string;
    fieldButtonRadius: string;
    fieldCardRadius: string;
    fieldPrimaryColor: string;
    fieldAccentTextColor: string;
    fieldBackgroundFrom: string;
    fieldBackgroundTo: string;
    fieldSurfaceColor: string;
    fieldTextColor: string;
    fieldMutedTextColor: string;
    fieldBorderColor: string;
    fieldPanelColor: string;
    fieldOverlayColor: string;
    fieldControlSurfaceColor: string;
    fieldActiveChipBackground: string;
    fieldActiveChipTextColor: string;
    fieldInactiveChipBackground: string;
    fieldInactiveChipTextColor: string;
    fieldDividerColor: string;
    fieldSuccessColor: string;
    fieldErrorColor: string;
    fieldCategoryTitleColor: string;
    fieldQtyButtonBackground: string;
    fieldQtyButtonTextColor: string;
    fieldQtyButtonBorderColor: string;
    resetToSaved: string;
    resetToDefault: string;
  }
> = {
  en: {
    basicSettings: "Simple Settings",
    previewCompare: "Before and After Preview",
    savedPreview: "Saved now",
    draftPreview: "Will be after save",
    changedFields: "Changes before save",
    noChanges: "No changes yet",
    sectionHeader: "Header",
    sectionCategoryDish: "Category + Dish Card",
    sectionBasketControls: "Basket + Controls",
    headerCaption: "Bar & Lounge QR Menu",
    categoryName: "Soups",
    dishName: "Creamy mushroom soup",
    dishDescription: "Light cream, champignons, herbs.",
    addButton: "Add",
    qtySection: "Quantity buttons",
    totalLabel: "Total",
    successSample: "Success sample",
    errorSample: "Error sample",
    fieldBrandName: "Brand Name",
    fieldBrandSubtitle: "Brand Subtitle",
    paletteBuilder: "Auto Palette From 3 Colors",
    paletteHint: "Pick 3 core colors, then auto-fill the whole restaurant palette.",
    basePrimary: "Base Primary",
    baseSecondary: "Base Secondary",
    baseNeutral: "Base Neutral",
    autoGeneratePalette: "Generate matching palette",
    paletteGenerated: "Palette generated from 3 base colors.",
    fieldCurrency: "Currency",
    fieldTableCount: "Table Count",
    fieldButtonRadius: "Button Radius (px)",
    fieldCardRadius: "Card Radius (px)",
    fieldPrimaryColor: "Primary",
    fieldAccentTextColor: "Primary Text",
    fieldBackgroundFrom: "Background From",
    fieldBackgroundTo: "Background To",
    fieldSurfaceColor: "Surface",
    fieldTextColor: "Text",
    fieldMutedTextColor: "Muted Text",
    fieldBorderColor: "Border",
    fieldPanelColor: "Panel/Basket",
    fieldOverlayColor: "Modal Overlay",
    fieldControlSurfaceColor: "Input Surface",
    fieldActiveChipBackground: "Lang Active BG",
    fieldActiveChipTextColor: "Lang Active Text",
    fieldInactiveChipBackground: "Lang Inactive BG",
    fieldInactiveChipTextColor: "Lang Inactive Text",
    fieldDividerColor: "Divider",
    fieldSuccessColor: "Success",
    fieldErrorColor: "Error",
    fieldCategoryTitleColor: "Category Title",
    fieldQtyButtonBackground: "Plus/Minus BG",
    fieldQtyButtonTextColor: "Plus/Minus Text",
    fieldQtyButtonBorderColor: "Plus/Minus Border",
    resetToSaved: "Reset to saved",
    resetToDefault: "Reset to default",
  },
  ru: {
    basicSettings: "Простые настройки",
    previewCompare: "Превью до и после",
    savedPreview: "Сейчас сохранено",
    draftPreview: "Будет после сохранения",
    changedFields: "Изменения перед сохранением",
    noChanges: "Изменений пока нет",
    sectionHeader: "Хедер",
    sectionCategoryDish: "Категория + карточка блюда",
    sectionBasketControls: "Корзина + контролы",
    headerCaption: "QR меню ресторана",
    categoryName: "Супы",
    dishName: "Грибной крем-суп",
    dishDescription: "Сливки, шампиньоны, зелень.",
    addButton: "Добавить",
    qtySection: "Кнопки количества",
    totalLabel: "Итого",
    successSample: "Пример успеха",
    errorSample: "Пример ошибки",
    fieldBrandName: "Название бренда",
    fieldBrandSubtitle: "Подзаголовок",
    paletteBuilder: "Авто-палитра из 3 цветов",
    paletteHint: "Выберите 3 базовых цвета, остальные применятся автоматически.",
    basePrimary: "Базовый основной",
    baseSecondary: "Базовый дополнительный",
    baseNeutral: "Базовый нейтральный",
    autoGeneratePalette: "Сгенерировать палитру",
    paletteGenerated: "Палитра сгенерирована из 3 базовых цветов.",
    fieldCurrency: "Валюта",
    fieldTableCount: "Количество столов",
    fieldButtonRadius: "Радиус кнопок (px)",
    fieldCardRadius: "Радиус карточек (px)",
    fieldPrimaryColor: "Основной",
    fieldAccentTextColor: "Текст на основном",
    fieldBackgroundFrom: "Фон от",
    fieldBackgroundTo: "Фон до",
    fieldSurfaceColor: "Поверхность",
    fieldTextColor: "Текст",
    fieldMutedTextColor: "Вторичный текст",
    fieldBorderColor: "Граница",
    fieldPanelColor: "Панель/корзина",
    fieldOverlayColor: "Оверлей модалки",
    fieldControlSurfaceColor: "Поверхность инпутов",
    fieldActiveChipBackground: "Язык активный фон",
    fieldActiveChipTextColor: "Язык активный текст",
    fieldInactiveChipBackground: "Язык неактивный фон",
    fieldInactiveChipTextColor: "Язык неактивный текст",
    fieldDividerColor: "Разделитель",
    fieldSuccessColor: "Успех",
    fieldErrorColor: "Ошибка",
    fieldCategoryTitleColor: "Заголовок категории",
    fieldQtyButtonBackground: "Плюс/минус фон",
    fieldQtyButtonTextColor: "Плюс/минус текст",
    fieldQtyButtonBorderColor: "Плюс/минус граница",
    resetToSaved: "Вернуть сохраненное",
    resetToDefault: "Сбросить по умолчанию",
  },
  az: {
    basicSettings: "Sade parametrlər",
    previewCompare: "Əvvəl və sonra önbaxış",
    savedPreview: "Hazırda saxlanılan",
    draftPreview: "Saxlandıqdan sonra",
    changedFields: "Saxlamadan öncə dəyişikliklər",
    noChanges: "Hələ dəyişiklik yoxdur",
    sectionHeader: "Header",
    sectionCategoryDish: "Kateqoriya + yemək kartı",
    sectionBasketControls: "Səbət + idarəetmə",
    headerCaption: "Restoran QR menyusu",
    categoryName: "Şorbalar",
    dishName: "Göbələk krem şorbası",
    dishDescription: "Qaymaq, göbələk, göyərti.",
    addButton: "Əlavə et",
    qtySection: "Miqdar düymələri",
    totalLabel: "Cəmi",
    successSample: "Uğurlu nümunə",
    errorSample: "Xəta nümunəsi",
    fieldBrandName: "Brend adı",
    fieldBrandSubtitle: "Alt başlıq",
    paletteBuilder: "3 rəngdən avtomatik palitra",
    paletteHint: "3 əsas rəng seçin, qalan rənglər avtomatik doldurulacaq.",
    basePrimary: "Əsas baza rəngi",
    baseSecondary: "İkinci baza rəngi",
    baseNeutral: "Neytral baza rəngi",
    autoGeneratePalette: "Palitranı avtomatik yarat",
    paletteGenerated: "Palitra 3 baza rəngindən yaradıldı.",
    fieldCurrency: "Valyuta",
    fieldTableCount: "Masa sayı",
    fieldButtonRadius: "Düymə radiusu (px)",
    fieldCardRadius: "Kart radiusu (px)",
    fieldPrimaryColor: "Əsas rəng",
    fieldAccentTextColor: "Əsas üzərində mətn",
    fieldBackgroundFrom: "Fon başlanğıcı",
    fieldBackgroundTo: "Fon sonu",
    fieldSurfaceColor: "Səth",
    fieldTextColor: "Mətn",
    fieldMutedTextColor: "Zəif mətn",
    fieldBorderColor: "Sərhəd",
    fieldPanelColor: "Panel/səbət",
    fieldOverlayColor: "Modal overlay",
    fieldControlSurfaceColor: "Input səthi",
    fieldActiveChipBackground: "Dil aktiv fon",
    fieldActiveChipTextColor: "Dil aktiv mətn",
    fieldInactiveChipBackground: "Dil passiv fon",
    fieldInactiveChipTextColor: "Dil passiv mətn",
    fieldDividerColor: "Ayırıcı",
    fieldSuccessColor: "Uğurlu",
    fieldErrorColor: "Xəta",
    fieldCategoryTitleColor: "Kateqoriya başlığı",
    fieldQtyButtonBackground: "Plus/minus fon",
    fieldQtyButtonTextColor: "Plus/minus mətn",
    fieldQtyButtonBorderColor: "Plus/minus sərhəd",
    resetToSaved: "Saxlanılana qaytar",
    resetToDefault: "Defolta sıfırla",
  },
};

const colorFieldGroups: Array<{ titleKey: "sectionHeader" | "sectionCategoryDish" | "sectionBasketControls"; fields: ColorField[] }> = [
  {
    titleKey: "sectionHeader",
    fields: [
      "backgroundFrom",
      "backgroundTo",
      "primaryColor",
      "accentTextColor",
      "textColor",
      "mutedTextColor",
      "borderColor",
      "activeChipBackground",
      "activeChipTextColor",
      "inactiveChipBackground",
      "inactiveChipTextColor",
    ],
  },
  {
    titleKey: "sectionCategoryDish",
    fields: [
      "surfaceColor",
      "categoryTitleColor",
      "dividerColor",
      "controlSurfaceColor",
      "qtyButtonBackground",
      "qtyButtonTextColor",
      "qtyButtonBorderColor",
    ],
  },
  {
    titleKey: "sectionBasketControls",
    fields: [
      "panelColor",
      "overlayColor",
      "successColor",
      "errorColor",
    ],
  },
];

function getCurrencyLabel(mode: RestaurantDesignSettings["currencyMode"], value: number) {
  if (mode === "azn") {
    return `AZN ${value.toFixed(2)}`;
  }

  if (mode === "symbol") {
    return `₼ ${value.toFixed(2)}`;
  }

  return `${value.toFixed(2)} manat`;
}

function getFieldLabel(field: ColorField, labels: (typeof designLabelDictionary)[SuperAdminLanguage]) {
  const map: Record<ColorField, string> = {
    primaryColor: labels.fieldPrimaryColor,
    accentTextColor: labels.fieldAccentTextColor,
    backgroundFrom: labels.fieldBackgroundFrom,
    backgroundTo: labels.fieldBackgroundTo,
    surfaceColor: labels.fieldSurfaceColor,
    textColor: labels.fieldTextColor,
    mutedTextColor: labels.fieldMutedTextColor,
    borderColor: labels.fieldBorderColor,
    panelColor: labels.fieldPanelColor,
    overlayColor: labels.fieldOverlayColor,
    controlSurfaceColor: labels.fieldControlSurfaceColor,
    activeChipBackground: labels.fieldActiveChipBackground,
    activeChipTextColor: labels.fieldActiveChipTextColor,
    inactiveChipBackground: labels.fieldInactiveChipBackground,
    inactiveChipTextColor: labels.fieldInactiveChipTextColor,
    dividerColor: labels.fieldDividerColor,
    successColor: labels.fieldSuccessColor,
    errorColor: labels.fieldErrorColor,
    categoryTitleColor: labels.fieldCategoryTitleColor,
    qtyButtonBackground: labels.fieldQtyButtonBackground,
    qtyButtonTextColor: labels.fieldQtyButtonTextColor,
    qtyButtonBorderColor: labels.fieldQtyButtonBorderColor,
  };

  return map[field];
}

function getChangedFieldLabel(
  field: keyof RestaurantDesignSettings,
  labels: (typeof designLabelDictionary)[SuperAdminLanguage],
) {
  if (field === "brandName") return labels.fieldBrandName;
  if (field === "brandSubtitle") return labels.fieldBrandSubtitle;
  if (field === "tableCount") return labels.fieldTableCount;
  if (field === "buttonRadius") return labels.fieldButtonRadius;
  if (field === "cardRadius") return labels.fieldCardRadius;
  if (field === "currencyMode") return labels.fieldCurrency;
  return getFieldLabel(field as ColorField, labels);
}

function clampRgb(value: number) {
  return Math.min(255, Math.max(0, value));
}

function toHex(value: number) {
  return clampRgb(value).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string): [number, number, number] {
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

function mixHex(left: string, right: string, ratio: number) {
  const safeRatio = Math.min(1, Math.max(0, ratio));
  const [lr, lg, lb] = hexToRgb(left);
  const [rr, rg, rb] = hexToRgb(right);

  return rgbToHex(
    Math.round(lr + (rr - lr) * safeRatio),
    Math.round(lg + (rg - lg) * safeRatio),
    Math.round(lb + (rb - lb) * safeRatio),
  );
}

function getReadableTextColor(background: string) {
  const [r, g, b] = hexToRgb(background);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.62 ? "#2c2218" : "#fff8ee";
}

function generatePaletteFromThreeColors(
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

function parseRestaurantDesign(settings: string | null): RestaurantDesignSettings {
  if (!settings) {
    return defaultDesign;
  }

  try {
    const parsed = JSON.parse(settings) as Partial<RestaurantDesignSettings>;
    const currencyMode = parsed.currencyMode;

    return {
      ...defaultDesign,
      ...parsed,
      buttonRadius: String(parsed.buttonRadius ?? defaultDesign.buttonRadius),
      cardRadius: String(parsed.cardRadius ?? defaultDesign.cardRadius),
      tableCount: String((parsed as { tableCount?: unknown }).tableCount ?? defaultDesign.tableCount),
      currencyMode:
        currencyMode === "azn" || currencyMode === "symbol" || currencyMode === "manat"
          ? currencyMode
          : defaultDesign.currencyMode,
    };
  } catch {
    return defaultDesign;
  }
}

function parseRestaurantServiceMode(settings: string | null): RestaurantServiceMode {
  if (!settings) {
    return "pro";
  }

  try {
    const parsed = JSON.parse(settings) as { serviceMode?: unknown };
    return parsed.serviceMode === "lite" ? "lite" : "pro";
  } catch {
    return "pro";
  }
}

function parseRestaurantSettingsObject(settings: string | null) {
  if (!settings) {
    return {} as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(settings);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Ignore invalid settings payload and fall back to empty object.
  }

  return {} as Record<string, unknown>;
}

function normalizeRadiusForSave(value: string, fallback: string) {
  const parsed = Number.parseFloat(String(value).trim().replace("px", ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return `${parsed}px`;
}

const dictionary: Record<
  SuperAdminLanguage,
  {
    superAdmin: string;
    login: string;
    password: string;
    logout: string;
    restaurants: string;
    menu: string;
    qr: string;
    refresh: string;
    selectRestaurant: string;
    restaurantName: string;
    restaurantSlug: string;
    addRestaurant: string;
    editRestaurant: string;
    deleteRestaurant: string;
    createRestaurant: string;
    serviceMode: string;
    serviceModeLite: string;
    serviceModePro: string;
    allDishes: string;
    searchDishByName: string;
    noDishResults: string;
    addDish: string;
    editDish: string;
    nameEn: string;
    nameRu: string;
    nameAz: string;
    descriptionEn: string;
    descriptionRu: string;
    descriptionAz: string;
    price: string;
    selectCategory: string;
    imageUrl: string;
    framingPreview: string;
    positionX: string;
    positionY: string;
    create: string;
    update: string;
    reset: string;
    addCategory: string;
    categoryEn: string;
    categoryRu: string;
    categoryAz: string;
    addCategoryButton: string;
    qrTitle: string;
    tableCount: string;
    tableCountHint: string;
    tableLabel: string;
    edit: string;
    delete: string;
    uploadingImage: string;
    uploadFailed: string;
    saveDishFailed: string;
    addCategoryFailed: string;
    saving: string;
    design: string;
    designTitle: string;
    saveDesign: string;
    rgbEditor: string;
    designSaved: string;
    selectRestaurantFirst: string;
    downloadQr: string;
    downloadStyledQr: string;
  }
> = {
  en: {
    superAdmin: "Super Admin",
    login: "Login",
    password: "Password",
    logout: "Logout",
    restaurants: "Restaurants",
    menu: "Menu Management",
    selectRestaurant: "Select Restaurant",
    restaurantName: "Restaurant Name",
    restaurantSlug: "URL Slug",
    addRestaurant: "Add Restaurant",
    editRestaurant: "Edit Restaurant",
    deleteRestaurant: "Delete Restaurant",
    createRestaurant: "Create Restaurant",
    serviceMode: "Mode",
    serviceModeLite: "Lite (menu + basket only)",
    serviceModePro: "Pro (menu + waiter + online orders)",
    qr: "QR Codes",
    refresh: "Refresh",
    allDishes: "All Dishes",
    searchDishByName: "Search dish by name",
    noDishResults: "No dishes found for this query.",
    addDish: "Add Dish",
    editDish: "Edit Dish",
    nameEn: "Name EN",
    nameRu: "Name RU",
    nameAz: "Name AZ",
    descriptionEn: "Description EN",
    descriptionRu: "Description RU",
    descriptionAz: "Description AZ",
    price: "Price",
    selectCategory: "Select category",
    imageUrl: "Image URL",
    framingPreview: "Menu framing preview",
    positionX: "Position X",
    positionY: "Position Y",
    create: "Create",
    update: "Update",
    reset: "Reset",
    addCategory: "Add Category",
    categoryEn: "Category EN",
    categoryRu: "Category RU",
    categoryAz: "Category AZ",
    addCategoryButton: "Add category",
    qrTitle: "QR Menu Links",
    tableCount: "Tables Count",
    tableCountHint: "Set how many tables this restaurant has. QR codes are generated automatically.",
    tableLabel: "Table",
    edit: "Edit",
    delete: "Delete",
    uploadingImage: "Uploading image...",
    uploadFailed: "Upload failed.",
    saveDishFailed: "Failed to save dish.",
    addCategoryFailed: "Failed to add category.",
    saving: "Saving...",
    design: "Design",
    designTitle: "Restaurant Design Studio",
    saveDesign: "Save Design",
    rgbEditor: "RGB color editor",
    designSaved: "Design saved successfully.",
    selectRestaurantFirst: "Select a restaurant first.",
    downloadQr: "Download QR",
    downloadStyledQr: "Download Styled Card",
  },
  ru: {
    superAdmin: "Супер Админ",
    login: "Логин",
    password: "Пароль",
    logout: "Выйти",
    restaurants: "Рестораны",
    menu: "Управление меню",
    selectRestaurant: "Выберите ресторан",
    restaurantName: "Название ресторана",
    restaurantSlug: "URL идентификатор",
    addRestaurant: "Добавить ресторан",
    editRestaurant: "Редактировать ресторан",
    deleteRestaurant: "Удалить ресторан",
    createRestaurant: "Создать ресторан",
    serviceMode: "Режим",
    serviceModeLite: "Лайт (меню + корзина)",
    serviceModePro: "Про (меню + вызов официанта + онлайн заказ)",
    qr: "QR коды",
    refresh: "Обновить",
    allDishes: "Все блюда",
    searchDishByName: "Поиск блюда по названию",
    noDishResults: "По вашему запросу ничего не найдено.",
    addDish: "Добавить блюдо",
    editDish: "Редактировать блюдо",
    nameEn: "Название EN",
    nameRu: "Название RU",
    nameAz: "Название AZ",
    descriptionEn: "Описание EN",
    descriptionRu: "Описание RU",
    descriptionAz: "Описание AZ",
    price: "Цена",
    selectCategory: "Выберите категорию",
    imageUrl: "Ссылка на изображение",
    framingPreview: "Предпросмотр кадрирования меню",
    positionX: "Позиция X",
    positionY: "Позиция Y",
    create: "Создать",
    update: "Обновить",
    reset: "Сбросить",
    addCategory: "Добавить категорию",
    categoryEn: "Категория EN",
    categoryRu: "Категория RU",
    categoryAz: "Категория AZ",
    addCategoryButton: "Добавить категорию",
    qrTitle: "QR меню ссылки",
    tableCount: "Количество столов",
    tableCountHint: "Укажите количество столов. QR-коды будут сгенерированы автоматически.",
    tableLabel: "Стол",
    edit: "Изменить",
    delete: "Удалить",
    uploadingImage: "Загрузка изображения...",
    uploadFailed: "Ошибка загрузки.",
    saveDishFailed: "Не удалось сохранить блюдо.",
    addCategoryFailed: "Не удалось добавить категорию.",
    saving: "Сохранение...",
    design: "Дизайн",
    designTitle: "Студия дизайна ресторана",
    saveDesign: "Сохранить дизайн",
    rgbEditor: "RGB редактор цветов",
    designSaved: "Дизайн успешно сохранен.",
    selectRestaurantFirst: "Сначала выберите ресторан.",
    downloadQr: "Скачать QR",
    downloadStyledQr: "Скачать карточку",
  },
  az: {
    superAdmin: "Super Admin",
    login: "Login",
    password: "Sifre",
    logout: "Cixis",
    restaurants: "Restoranlar",
    menu: "Menyu idaresi",
    selectRestaurant: "Restoran secin",
    restaurantName: "Restoran adi",
    restaurantSlug: "URL identifikator",
    addRestaurant: "Restoran elave et",
    editRestaurant: "Restorani redakte et",
    deleteRestaurant: "Restorani sil",
    createRestaurant: "Restoran yarat",
    serviceMode: "Rejim",
    serviceModeLite: "Lite (menyu + səbət)",
    serviceModePro: "Pro (menyu + ofisiant çağırışı + onlayn sifariş)",
    qr: "QR kodlar",
    refresh: "Yenile",
    allDishes: "Butun yemekler",
    searchDishByName: "Yemek adina gore axtar",
    noDishResults: "Bu sorquya uygun yemek tapilmadi.",
    addDish: "Yemek elave et",
    editDish: "Yemeyi redakte et",
    nameEn: "Ad EN",
    nameRu: "Ad RU",
    nameAz: "Ad AZ",
    descriptionEn: "Tesvir EN",
    descriptionRu: "Tesvir RU",
    descriptionAz: "Tesvir AZ",
    price: "Qiymet",
    selectCategory: "Kateqoriya secin",
    imageUrl: "Sekil linki",
    framingPreview: "Menyu kadr preview",
    positionX: "Pozisiya X",
    positionY: "Pozisiya Y",
    create: "Yarat",
    update: "Yenile",
    reset: "Sifirla",
    addCategory: "Kateqoriya elave et",
    categoryEn: "Kateqoriya EN",
    categoryRu: "Kateqoriya RU",
    categoryAz: "Kateqoriya AZ",
    addCategoryButton: "Kateqoriya elave et",
    qrTitle: "QR menyu linkleri",
    tableCount: "Masa sayi",
    tableCountHint: "Bu restoran ucun masa sayini daxil edin. QR kodlar avtomatik yaranacaq.",
    tableLabel: "Masa",
    edit: "Redakte et",
    delete: "Sil",
    uploadingImage: "Sekil yuklenir...",
    uploadFailed: "Yukleme ugursuz oldu.",
    saveDishFailed: "Yemek saxlanmadi.",
    addCategoryFailed: "Kateqoriya elave olunmadi.",
    saving: "Saxlanilir...",
    design: "Dizayn",
    designTitle: "Restoran dizayn studiyasi",
    saveDesign: "Dizayni saxla",
    rgbEditor: "RGB reng redaktoru",
    designSaved: "Dizayn ugurla saxlanildi.",
    selectRestaurantFirst: "Evvelce restoran secin.",
    downloadQr: "QR yukle",
    downloadStyledQr: "Dizayn karti yukle",
  },
};

export function SuperAdminDashboard() {
  const [language, setLanguage] = useState<SuperAdminLanguage>("en");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [login, setLogin] = useState("superadmin");
  const [password, setPassword] = useState("superadmin123");
  const [authError, setAuthError] = useState("");

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryWithDishes[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishSearchQuery, setDishSearchQuery] = useState("");

  const [tab, setTab] = useState<"restaurants" | "menu" | "qr" | "design">("restaurants");

  const [dishForm, setDishForm] = useState<DishForm>(emptyDishForm);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [savingDish, setSavingDish] = useState(false);
  const [categoryEn, setCategoryEn] = useState("");
  const [categoryRu, setCategoryRu] = useState("");
  const [categoryAz, setCategoryAz] = useState("");
  const [busyMessage, setBusyMessage] = useState("");

  const [menuUrl, setMenuUrl] = useState("");
  const [tableQrs, setTableQrs] = useState<Array<{ table: string; url: string; dataUrl: string }>>([]);
  const [designForm, setDesignForm] = useState<RestaurantDesignSettings>(defaultDesign);
  const [savingDesign, setSavingDesign] = useState(false);
  const [designNotice, setDesignNotice] = useState("");
  
  // Restaurant form
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    slug: "",
    logoUrl: "",
    serviceMode: "pro" as RestaurantServiceMode,
  });
  const [editingRestaurantId, setEditingRestaurantId] = useState<number | null>(null);

  const t = dictionary[language];
  const designLabels = designLabelDictionary[language];

  const dracula = {
    page: "radial-gradient(ellipse at top left, rgba(189,147,249,0.22) 0%, transparent 42%), radial-gradient(ellipse at bottom right, rgba(139,233,253,0.16) 0%, transparent 38%), linear-gradient(180deg, #0c1021 0%, #12162b 100%)",
    panel: "#171b33",
    panelSoft: "#202645",
    border: "#3f4a76",
    text: "#f8f8f2",
    muted: "#aab3d6",
    accent: "#bd93f9",
    accentText: "#101223",
    cyan: "#8be9fd",
    danger: "#ff6b6b",
  } as const;

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null;
  const normalizedDishSearchQuery = dishSearchQuery.trim().toLowerCase();
  const filteredDishes = useMemo(() => {
    if (!normalizedDishSearchQuery) {
      return dishes;
    }

    return dishes.filter((dish) =>
      [dish.nameEn, dish.nameRu, dish.nameAz].some((name) => name.toLowerCase().includes(normalizedDishSearchQuery)),
    );
  }, [dishes, normalizedDishSearchQuery]);
  const savedDesign = selectedRestaurant ? parseRestaurantDesign(selectedRestaurant.settings) : defaultDesign;
  const changedDesignFields = selectedRestaurant
    ? (Object.keys(defaultDesign) as Array<keyof RestaurantDesignSettings>).filter(
        (key) => String(savedDesign[key]) !== String(designForm[key]),
      )
    : [];

  const loadRestaurants = useCallback(async () => {
    console.log("[DEBUG] Loading restaurants...");
    const response = await fetch("/api/superadmin/restaurants");
    console.log("[DEBUG] Response status:", response.status, response.ok);
    if (response.ok) {
      const data = await response.json();
      console.log("[DEBUG] Restaurants data:", data);
      setRestaurants(data.restaurants || []);
      // Select first restaurant by default if none selected
      if (data.restaurants?.length > 0) {
        setSelectedRestaurantId((current) => {
          // Only set if no restaurant is currently selected
          if (!current) {
            console.log("[DEBUG] Selecting first restaurant:", data.restaurants[0].id);
            return data.restaurants[0].id;
          }
          return current;
        });
      }
    } else {
      console.error("[DEBUG] Failed to load restaurants:", response.status);
    }
  }, []);

  const loadMenu = useCallback(async () => {
    if (!selectedRestaurantId) return;
    
    const [categoriesResponse, dishesResponse] = await Promise.all([
      fetch(`/api/categories?restaurantId=${selectedRestaurantId}`),
      fetch(`/api/dishes?restaurantId=${selectedRestaurantId}`),
    ]);

    if (categoriesResponse.ok) {
      setCategories(await categoriesResponse.json());
    }

    if (dishesResponse.ok) {
      setDishes(await dishesResponse.json());
    }
  }, [selectedRestaurantId]);

  const checkSession = useCallback(async () => {
    try {
      console.log("[DEBUG] Checking session...");
      // Check session and get user info
      const response = await fetch("/api/admin/me");
      console.log("[DEBUG] Session check response:", response.status, response.ok);
      if (response.ok) {
        const data = await response.json();
        console.log("[DEBUG] Session data:", data);
        // Verify user is SUPER_ADMIN
        if (data.role === "SUPER_ADMIN") {
          console.log("[DEBUG] User is SUPER_ADMIN, loading restaurants...");
          setAuthenticated(true);
          void loadRestaurants();
        } else {
          console.log("[DEBUG] User is not SUPER_ADMIN:", data.role);
          // Do not clear shared cookies here: another dashboard tab may be using them.
          setAuthenticated(false);
        }
      }
    } finally {
      setLoadingAuth(false);
    }
  }, [loadRestaurants]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Load menu when restaurant is selected
  useEffect(() => {
    if (authenticated && selectedRestaurantId) {
      void loadMenu();
      setDishSearchQuery("");
    }
  }, [authenticated, selectedRestaurantId, loadMenu]);

  useEffect(() => {
    if (!authenticated || typeof window === "undefined") {
      return;
    }

    if (!selectedRestaurant) return;
    
    const url = `${window.location.origin}/${selectedRestaurant.slug}`;
    setMenuUrl(url);

    const generateQr = async () => {
      const response = await fetch(`/api/superadmin/qr?restaurantId=${selectedRestaurant.id}`, { cache: "no-store" });
      if (!response.ok) {
        setTableQrs([]);
        return;
      }

      const data = await response.json() as {
        qrCodes: Array<{ table: string; url: string; dataUrl: string }>;
      };

      setTableQrs(data.qrCodes || []);
    };

    void generateQr();
  }, [authenticated, selectedRestaurant]);

  useEffect(() => {
    if (!selectedRestaurant) {
      setDesignForm(defaultDesign);
      return;
    }

    setDesignForm(parseRestaurantDesign(selectedRestaurant.settings));
    setDesignNotice("");
  }, [selectedRestaurant]);

  function downloadDataUrl(dataUrl: string, filename: string) {
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function parseRadiusPx(value: string, fallback: number) {
    const parsed = Number.parseFloat(String(value).replace("px", "").trim());
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    return parsed;
  }

  async function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Failed to load image."));
      image.src = src;
    });
  }

  async function createStyledQrCardDataUrl(entry: { table: string; dataUrl: string }) {
    const width = 1200;
    const height = 1700;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not available.");
    }

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, designForm.backgroundFrom);
    gradient.addColorStop(1, designForm.backgroundTo);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const cardRadius = parseRadiusPx(designForm.cardRadius, 24);
    const cardX = 90;
    const cardY = 120;
    const cardWidth = width - 180;
    const cardHeight = height - 240;

    ctx.fillStyle = designForm.surfaceColor;
    ctx.strokeStyle = designForm.borderColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = designForm.textColor;
    ctx.font = "700 64px serif";
    ctx.textAlign = "center";
    ctx.fillText(designForm.brandName || selectedRestaurant?.name || "Restaurant", width / 2, cardY + 110);

    ctx.fillStyle = designForm.mutedTextColor;
    ctx.font = "500 34px sans-serif";
    ctx.fillText(designForm.brandSubtitle || "Scan to view menu", width / 2, cardY + 165);

    const qrImage = await loadImage(entry.dataUrl);
    const qrSize = 660;
    const qrX = (width - qrSize) / 2;
    const qrY = cardY + 240;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 24);
    ctx.fill();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    const buttonRadius = parseRadiusPx(designForm.buttonRadius, 14);
    const pillWidth = 420;
    const pillHeight = 90;
    const pillX = (width - pillWidth) / 2;
    const pillY = qrY + qrSize + 80;

    ctx.fillStyle = designForm.primaryColor;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, buttonRadius);
    ctx.fill();

    ctx.fillStyle = designForm.accentTextColor;
    ctx.font = "700 42px sans-serif";
    ctx.fillText(`${t.tableLabel} ${entry.table}`, width / 2, pillY + 58);

    ctx.fillStyle = designForm.mutedTextColor;
    ctx.font = "500 28px sans-serif";
    ctx.fillText("Scan QR to open menu", width / 2, pillY + 140);

    return canvas.toDataURL("image/png");
  }

  async function downloadStyledQr(entry: { table: string; dataUrl: string }) {
    try {
      const styledDataUrl = await createStyledQrCardDataUrl(entry);
      const slug = selectedRestaurant?.slug || "restaurant";
      downloadDataUrl(styledDataUrl, `${slug}-table-${entry.table}-styled.png`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create styled QR.");
    }
  }

  async function saveDesign() {
    if (!selectedRestaurantId || !selectedRestaurant) {
      setDesignNotice(t.selectRestaurantFirst);
      return;
    }

    setSavingDesign(true);
    setDesignNotice("");
    try {
      const response = await fetch(`/api/superadmin/restaurants/${selectedRestaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            serviceMode: parseRestaurantServiceMode(selectedRestaurant.settings),
            ...designForm,
            buttonRadius: normalizeRadiusForSave(designForm.buttonRadius, "14px"),
            cardRadius: normalizeRadiusForSave(designForm.cardRadius, "20px"),
            tableCount: Math.max(1, Math.min(200, Number.parseInt(designForm.tableCount, 10) || 5)),
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save design");
      }

      setDesignNotice(t.designSaved);
      await loadRestaurants();
    } catch (error) {
      setDesignNotice(error instanceof Error ? error.message : "Failed to save design");
    } finally {
      setSavingDesign(false);
    }
  }

  function applyAutoPaletteFromThreeColors() {
    const nextPalette = generatePaletteFromThreeColors(
      designForm.basePrimaryColor,
      designForm.baseSecondaryColor,
      designForm.baseNeutralColor,
    );

    setDesignForm((prev) => ({
      ...prev,
      ...nextPalette,
    }));
    setDesignNotice(designLabels.paletteGenerated);
  }

  function renderDesignPreview(design: RestaurantDesignSettings, previewLabel: string) {
    const buttonRadius = `${parseRadiusPx(design.buttonRadius, 14)}px`;
    const cardRadius = `${parseRadiusPx(design.cardRadius, 20)}px`;

    return (
      <article className="rounded-2xl border p-4" style={{ borderColor: design.borderColor, background: design.panelColor }}>
        <p className="mb-3 text-xs uppercase tracking-wide" style={{ color: design.mutedTextColor }}>{previewLabel}</p>

        <div className="rounded-xl border p-4" style={{ borderColor: design.borderColor, background: `linear-gradient(160deg, ${design.backgroundFrom} 0%, ${design.backgroundTo} 100%)` }}>
          <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: design.mutedTextColor }}>{designLabels.headerCaption}</p>
          <h3 className="mt-2 font-serif text-2xl" style={{ color: design.textColor }}>{design.brandName || "Restaurant"}</h3>
          <p className="mt-2 text-sm" style={{ color: design.mutedTextColor }}>{design.brandSubtitle || "Subtitle"}</p>
          <div className="mt-3 inline-flex rounded-full border p-1" style={{ borderColor: design.borderColor, background: design.controlSurfaceColor }}>
            <span className="rounded-full px-2 py-1 text-xs" style={{ background: design.activeChipBackground, color: design.activeChipTextColor }}>EN</span>
            <span className="px-2 py-1 text-xs" style={{ color: design.inactiveChipTextColor }}>RU</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: design.borderColor, borderRadius: cardRadius, background: design.surfaceColor }}>
          <h4 className="font-serif text-lg" style={{ color: design.categoryTitleColor }}>{designLabels.categoryName}</h4>
          <div className="mt-3 border-t pt-3" style={{ borderColor: design.dividerColor }}>
            <p className="font-medium" style={{ color: design.textColor }}>{designLabels.dishName}</p>
            <p className="mt-1 text-sm" style={{ color: design.mutedTextColor }}>{designLabels.dishDescription}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="h-9 w-9 rounded-lg border"
                style={{
                  borderColor: design.qtyButtonBorderColor,
                  background: design.qtyButtonBackground,
                  color: design.qtyButtonTextColor,
                }}
              >
                -
              </button>
              <span style={{ color: design.textColor }}>1</span>
              <button
                type="button"
                className="h-9 w-9 rounded-lg border"
                style={{
                  borderColor: design.qtyButtonBorderColor,
                  background: design.qtyButtonBackground,
                  color: design.qtyButtonTextColor,
                }}
              >
                +
              </button>
              <button
                type="button"
                className="ml-auto px-3 py-2 text-sm font-semibold"
                style={{ borderRadius: buttonRadius, background: design.primaryColor, color: design.accentTextColor }}
              >
                {designLabels.addButton}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: design.borderColor, background: design.panelColor }}>
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: design.dividerColor }}>
            <span style={{ color: design.textColor }}>{designLabels.totalLabel}</span>
            <strong style={{ color: design.primaryColor }}>{getCurrencyLabel(design.currencyMode, 18.4)}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: design.successColor }}>{designLabels.successSample}</span>
            <span className="text-sm" style={{ color: design.errorColor }}>{designLabels.errorSample}</span>
          </div>
        </div>
      </article>
    );
  }

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    console.log("[DEBUG] Logging in as super admin...");

    const response = await fetch("/api/superadmin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    console.log("[DEBUG] Login response:", response.status, response.ok);
    if (!response.ok) {
      setAuthError("Invalid super admin credentials");
      return;
    }

    const data = await response.json();
    console.log("[DEBUG] Login data:", data);
    setAuthenticated(true);
    void loadRestaurants();
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  async function onImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setBusyMessage(t.uploadingImage);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t.uploadFailed);
      }

      setDishForm((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } finally {
      setBusyMessage("");
    }
  }

  async function saveDish(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRestaurantId) return;
    
    setSavingDish(true);

    try {
      const payload = {
        nameEn: dishForm.nameEn,
        nameRu: dishForm.nameRu,
        nameAz: dishForm.nameAz,
        descriptionEn: dishForm.descriptionEn,
        descriptionRu: dishForm.descriptionRu,
        descriptionAz: dishForm.descriptionAz,
        price: Number(dishForm.price),
        imageUrl: dishForm.imageUrl,
        categoryId: Number(dishForm.categoryId),
        restaurantId: selectedRestaurantId,
        imagePositionX: Number(dishForm.imagePositionX),
        imagePositionY: Number(dishForm.imagePositionY),
      };

      const isEdit = editingDishId !== null;
      const url = isEdit ? `/api/dishes/${editingDishId}` : "/api/dishes";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t.saveDishFailed);
      }

      setDishForm(emptyDishForm);
      setEditingDishId(null);
      await loadMenu();
    } finally {
      setSavingDish(false);
    }
  }

  function editDish(dish: Dish) {
    setDishForm({
      nameEn: dish.nameEn,
      nameRu: dish.nameRu,
      nameAz: dish.nameAz,
      descriptionEn: dish.descriptionEn,
      descriptionRu: dish.descriptionRu,
      descriptionAz: dish.descriptionAz,
      price: String(dish.price),
      imageUrl: dish.imageUrl,
      categoryId: String(dish.categoryId),
      imagePositionX: String(dish.imagePositionX ?? 50),
      imagePositionY: String(dish.imagePositionY ?? 50),
    });
    setEditingDishId(dish.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeDish(id: number) {
    if (!confirm("Delete this dish?")) return;

    await fetch(`/api/dishes/${id}`, { method: "DELETE" });
    await loadMenu();
  }

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRestaurantId) return;

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: categoryEn,
        nameRu: categoryRu,
        nameAz: categoryAz,
        restaurantId: selectedRestaurantId,
      }),
    });

    if (!response.ok) {
      alert(t.addCategoryFailed);
      return;
    }

    setCategoryEn("");
    setCategoryRu("");
    setCategoryAz("");
    await loadMenu();
  }

  // Restaurant CRUD functions
  async function saveRestaurant(event: React.FormEvent) {
    event.preventDefault();

    const existingRestaurant = editingRestaurantId
      ? restaurants.find((restaurant) => restaurant.id === editingRestaurantId)
      : null;
    const existingSettings = parseRestaurantSettingsObject(existingRestaurant?.settings ?? null);

    const normalizedSettings =
      editingRestaurantId !== null
        ? { ...existingSettings, serviceMode: restaurantForm.serviceMode }
        : { serviceMode: restaurantForm.serviceMode };
    
    const isEdit = editingRestaurantId !== null;
    const url = isEdit ? `/api/superadmin/restaurants/${editingRestaurantId}` : "/api/superadmin/restaurants";
    const method = isEdit ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: restaurantForm.name,
        slug: restaurantForm.slug,
        logoUrl: restaurantForm.logoUrl || null,
        settings: normalizedSettings,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Failed to save restaurant");
      return;
    }

    setRestaurantForm({ name: "", slug: "", logoUrl: "", serviceMode: "pro" });
    setEditingRestaurantId(null);
    await loadRestaurants();
  }

  function editRestaurant(restaurant: Restaurant) {
    setRestaurantForm({
      name: restaurant.name,
      slug: restaurant.slug,
      logoUrl: restaurant.logoUrl || "",
      serviceMode: parseRestaurantServiceMode(restaurant.settings),
    });
    setEditingRestaurantId(restaurant.id);
  }

  async function removeRestaurant(id: number) {
    if (!confirm("Delete this restaurant? All related data will be lost.")) return;

    await fetch(`/api/superadmin/restaurants/${id}`, { method: "DELETE" });
    
    if (selectedRestaurantId === id) {
      setSelectedRestaurantId(null);
    }
    
    await loadRestaurants();
  }

  async function updateRestaurantServiceMode(restaurant: Restaurant, nextMode: RestaurantServiceMode) {
    const currentSettings = parseRestaurantSettingsObject(restaurant.settings);

    const response = await fetch(`/api/superadmin/restaurants/${restaurant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          ...currentSettings,
          serviceMode: nextMode,
        },
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || "Failed to update mode");
      return;
    }

    await loadRestaurants();
  }

  if (loadingAuth) {
    return (
      <main className="superadmin-dracula min-h-screen p-6" style={{ background: dracula.page, color: dracula.text }}>
        <div className="mx-auto max-w-6xl">
          <p style={{ color: dracula.cyan }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="superadmin-dracula flex min-h-screen items-center justify-center p-6" style={{ background: dracula.page, color: dracula.text }}>
        <form
          onSubmit={onLogin}
          className="w-full max-w-md rounded-2xl border border-dark-700 bg-dark-900 p-8 shadow-xl"
          style={{ borderColor: dracula.border, background: dracula.panel }}
        >
          <h1 className="mb-6 text-center font-serif text-3xl" style={{ color: dracula.text }}>{t.superAdmin}</h1>

          {authError ? <p className="mb-4 text-center text-sm" style={{ color: dracula.danger }}>{authError}</p> : null}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm" style={{ color: dracula.muted }}>{t.login}</label>
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                style={{ borderColor: dracula.border, background: dracula.panelSoft, color: dracula.text }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm" style={{ color: dracula.muted }}>{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                style={{ borderColor: dracula.border, background: dracula.panelSoft, color: dracula.text }}
              />
            </div>

            <button
              type="submit"
              className="min-h-11 w-full rounded-lg bg-gold-600 px-4 py-2 font-medium text-dark-950 hover:bg-gold-500"
              style={{ background: dracula.accent, color: dracula.accentText }}
            >
              {t.login}
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="superadmin-dracula min-h-screen p-4 sm:p-6" style={{ background: dracula.page, color: dracula.text }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4" style={{ borderColor: dracula.border, background: dracula.panel }}>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl" style={{ color: dracula.text }}>{t.superAdmin}</h1>
            <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(189,147,249,0.22)", color: dracula.accent }}>
              Management
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-full border p-1" style={{ borderColor: dracula.border, background: dracula.panelSoft }}>
              {(["en", "ru", "az"] as SuperAdminLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`min-h-9 rounded-full px-3 py-1 text-xs ${
                    language === lang ? "bg-gold-500 text-dark-950" : "text-gold-200 hover:bg-dark-700"
                  }`}
                  style={language === lang ? { background: dracula.accent, color: dracula.accentText } : { color: dracula.muted }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Restaurant Selector */}
            {restaurants.length > 0 && (
              <select
                value={selectedRestaurantId || ""}
                onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
                className="min-h-11 rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-gold-100"
                style={{ borderColor: dracula.border, background: dracula.panelSoft, color: dracula.text }}
              >
                <option value="">{t.selectRestaurant}</option>
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={loadMenu}
              className="min-h-11 rounded-lg border border-dark-600 bg-dark-800 px-4 py-2 text-sm text-gold-200 hover:bg-dark-700"
              style={{ borderColor: dracula.border, background: dracula.panelSoft, color: dracula.muted }}
            >
              {t.refresh}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-11 rounded-lg bg-rose-600/20 px-4 py-2 text-sm text-rose-400 hover:bg-rose-600/30"
              style={{ background: "rgba(255,107,107,0.2)", color: dracula.danger }}
            >
              {t.logout}
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            ["restaurants", t.restaurants],
            ["menu", t.menu],
            ["qr", t.qr],
            ["design", t.design],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`min-h-11 rounded-full px-4 py-2 text-sm ${
                tab === key ? "bg-gold-600 text-dark-950" : "bg-dark-800 text-gold-200 hover:bg-dark-700"
              }`}
              style={
                tab === key
                  ? { background: dracula.accent, color: dracula.accentText }
                  : { background: dracula.panelSoft, color: dracula.muted, border: `1px solid ${dracula.border}` }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "menu" ? (
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={saveDish} className="space-y-3 rounded-2xl border p-5 shadow-sm" style={{ borderColor: dracula.border, background: dracula.panel }}>
              <h2 className="font-serif text-2xl" style={{ color: dracula.text }}>{editingDishId ? t.editDish : t.addDish}</h2>

              <input
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.nameEn}
                onChange={(e) => setDishForm((prev) => ({ ...prev, nameEn: e.target.value }))}
                placeholder={t.nameEn}
              />
              <input
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.nameRu}
                onChange={(e) => setDishForm((prev) => ({ ...prev, nameRu: e.target.value }))}
                placeholder={t.nameRu}
              />
              <input
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.nameAz}
                onChange={(e) => setDishForm((prev) => ({ ...prev, nameAz: e.target.value }))}
                placeholder={t.nameAz}
              />
              <input
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.descriptionEn}
                onChange={(e) => setDishForm((prev) => ({ ...prev, descriptionEn: e.target.value }))}
                placeholder={t.descriptionEn}
              />
              <input
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.descriptionRu}
                onChange={(e) => setDishForm((prev) => ({ ...prev, descriptionRu: e.target.value }))}
                placeholder={t.descriptionRu}
              />
              <input
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.descriptionAz}
                onChange={(e) => setDishForm((prev) => ({ ...prev, descriptionAz: e.target.value }))}
                placeholder={t.descriptionAz}
              />
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                value={dishForm.price}
                onChange={(e) => setDishForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder={t.price}
                required
              />
              <select
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                value={dishForm.categoryId}
                onChange={(e) => setDishForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                required
              >
                <option value="">{t.selectCategory}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameEn}
                  </option>
                ))}
              </select>

              {dishForm.imageUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-gold-400">{t.framingPreview}</p>
                  <div className="relative h-32 overflow-hidden rounded-lg border border-dark-600">
                    <Image
                      src={dishForm.imageUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      style={{
                        objectPosition: `${dishForm.imagePositionX}% ${dishForm.imagePositionY}%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gold-400">{t.positionX}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={dishForm.imagePositionX}
                        onChange={(e) => setDishForm((prev) => ({ ...prev, imagePositionX: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gold-400">{t.positionY}</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={dishForm.imagePositionY}
                        onChange={(e) => setDishForm((prev) => ({ ...prev, imagePositionY: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                }}
                className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingDish}
                  className="rounded-xl bg-gold-600 px-4 py-2 text-dark-950 hover:bg-gold-500"
                >
                  {savingDish ? t.saving : editingDishId ? t.update : t.create}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDishForm(emptyDishForm);
                    setEditingDishId(null);
                  }}
                  className="rounded-xl border border-dark-600 bg-dark-800 px-4 py-2 text-gold-200 hover:bg-dark-700"
                >
                  {t.reset}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <form onSubmit={addCategory} className="rounded-2xl border p-5 shadow-sm" style={{ borderColor: dracula.border, background: dracula.panel }}>
                <h2 className="font-serif text-2xl" style={{ color: dracula.text }}>{t.addCategory}</h2>
                <div className="mt-3 space-y-2">
                  <input
                    className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                    value={categoryEn}
                    onChange={(e) => setCategoryEn(e.target.value)}
                    placeholder={t.categoryEn}
                  />
                  <input
                    className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                    value={categoryRu}
                    onChange={(e) => setCategoryRu(e.target.value)}
                    placeholder={t.categoryRu}
                  />
                  <input
                    className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                    value={categoryAz}
                    onChange={(e) => setCategoryAz(e.target.value)}
                    placeholder={t.categoryAz}
                  />
                  <button type="submit" className="min-h-11 rounded-xl bg-gold-600 px-4 py-2 text-dark-950 hover:bg-gold-500">
                    {t.addCategoryButton}
                  </button>
                </div>
              </form>

              <div className="space-y-3 rounded-2xl border p-5 shadow-sm" style={{ borderColor: dracula.border, background: dracula.panel }}>
                <h2 className="font-serif text-2xl" style={{ color: dracula.text }}>{t.allDishes}</h2>
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  style={{ borderColor: dracula.border, background: dracula.panelSoft, color: dracula.text }}
                  value={dishSearchQuery}
                  onChange={(e) => setDishSearchQuery(e.target.value)}
                  placeholder={t.searchDishByName}
                />

                {filteredDishes.length === 0 ? (
                  <p className="text-sm" style={{ color: dracula.muted }}>{t.noDishResults}</p>
                ) : null}

                {filteredDishes.map((dish) => (
                  <article key={dish.id} className="rounded-xl border border-dark-600 p-3">
                    <p className="font-medium text-gold-200">{dish.nameEn}</p>
                    <p className="text-sm text-gold-400">{getCurrencyLabel(designForm.currencyMode, dish.price)}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editDish(dish)}
                        className="min-h-10 rounded-lg border border-dark-600 bg-dark-800 px-3 py-1 text-sm text-gold-300 hover:bg-dark-700"
                      >
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDish(dish.id)}
                        className="min-h-10 rounded-lg border border-rose-900/50 bg-dark-800 px-3 py-1 text-sm text-rose-400 hover:bg-rose-950/30"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "restaurants" ? (
          <section className="space-y-6">
            {/* Add/Edit Restaurant Form */}
            <form onSubmit={saveRestaurant} className="rounded-2xl border border-dark-700 bg-dark-900 p-5 shadow-sm">
              <h2 className="font-serif text-2xl text-gold-100">
                {editingRestaurantId ? t.editRestaurant : t.addRestaurant}
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t.restaurantName}
                  required
                />
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.slug}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder={t.restaurantSlug}
                  required
                />
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.logoUrl}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  placeholder="Logo URL (optional)"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  className="min-h-10 rounded-xl bg-gold-600 px-4 py-2 text-dark-950 hover:bg-gold-500"
                >
                  {editingRestaurantId ? t.update : t.createRestaurant}
                </button>
                {editingRestaurantId && (
                  <button
                    type="button"
                    onClick={() => {
                      setRestaurantForm({ name: "", slug: "", logoUrl: "", serviceMode: "pro" });
                      setEditingRestaurantId(null);
                    }}
                    className="min-h-10 rounded-xl border border-dark-600 bg-dark-800 px-4 py-2 text-gold-200 hover:bg-dark-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Restaurants List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    selectedRestaurantId === restaurant.id
                      ? "border-gold-500 bg-gold-500/10"
                      : "border-dark-700 bg-dark-900"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-gold-100">{restaurant.name}</h3>
                      <p className="text-sm text-gold-400">/{restaurant.slug}</p>
                      <p className="mt-1 text-xs" style={{ color: dracula.cyan }}>
                        {t.serviceMode}: {parseRestaurantServiceMode(restaurant.settings) === "lite" ? t.serviceModeLite : t.serviceModePro}
                      </p>
                      <div className="mt-2">
                        <label className="mb-1 block text-xs text-gold-300">{t.serviceMode}</label>
                        <select
                          className="w-full rounded-lg border border-dark-600 bg-dark-800 px-2 py-1 text-xs text-gold-100"
                          value={parseRestaurantServiceMode(restaurant.settings)}
                          onChange={(event) =>
                            void updateRestaurantServiceMode(
                              restaurant,
                              event.target.value as RestaurantServiceMode,
                            )
                          }
                        >
                          <option value="pro">{t.serviceModePro}</option>
                          <option value="lite">{t.serviceModeLite}</option>
                        </select>
                      </div>
                      <p className="mt-2 break-all text-xs text-gold-300">
                        Menu: <a href={`/${restaurant.slug}`} target="_blank" rel="noreferrer" className="underline">/{restaurant.slug}</a>
                      </p>
                      <p className="mt-1 break-all text-xs text-gold-300">
                        Admin: <a href={`/${restaurant.slug}/admin`} target="_blank" rel="noreferrer" className="underline">/{restaurant.slug}/admin</a>
                      </p>
                      <div className="mt-2 text-xs text-gold-500">
                        <span className="mr-3">{restaurant._count?.categories || 0} categories</span>
                        <span className="mr-3">{restaurant._count?.dishes || 0} dishes</span>
                        <span>{restaurant._count?.orders || 0} orders</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRestaurantId(restaurant.id);
                        setTab("menu");
                      }}
                      className="min-h-9 flex-1 rounded-lg bg-gold-600/20 px-3 py-1 text-sm text-gold-400 hover:bg-gold-600/30"
                    >
                      Manage Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => editRestaurant(restaurant)}
                      className="min-h-9 rounded-lg border border-dark-600 bg-dark-800 px-3 py-1 text-sm text-gold-300 hover:bg-dark-700"
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRestaurant(restaurant.id)}
                      className="min-h-9 rounded-lg border border-rose-900/50 bg-dark-800 px-3 py-1 text-sm text-rose-400 hover:bg-rose-950/30"
                    >
                      {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "qr" ? (
          <section className="rounded-2xl border p-6 shadow-sm" style={{ borderColor: dracula.border, background: dracula.panel }}>
            <h2 className="font-serif text-3xl" style={{ color: dracula.text }}>{t.qrTitle}</h2>
            <p className="mt-2 break-all text-sm" style={{ color: dracula.cyan }}>{menuUrl}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tableQrs.map((entry) => (
                <article key={entry.table} className="rounded-xl border border-dark-600 p-3">
                  <h3 className="font-serif text-xl text-gold-200">
                    {t.tableLabel} {entry.table}
                  </h3>
                  <p className="mt-1 break-all text-xs text-gold-500">{entry.url}</p>
                  <Image
                    src={entry.dataUrl}
                    alt={`QR table ${entry.table}`}
                    width={220}
                    height={220}
                    unoptimized
                    className="mt-3 h-auto w-full max-w-[220px] rounded-lg border border-dark-600 bg-white p-2"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadDataUrl(entry.dataUrl, `${selectedRestaurant?.slug || "restaurant"}-table-${entry.table}-qr.png`)}
                      className="min-h-10 rounded-lg border border-dark-600 bg-dark-800 px-3 py-1 text-xs text-gold-200 hover:bg-dark-700"
                    >
                      {t.downloadQr}
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadStyledQr(entry)}
                      className="min-h-10 rounded-lg bg-gold-600 px-3 py-1 text-xs text-dark-950 hover:bg-gold-500"
                    >
                      {t.downloadStyledQr}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "design" ? (
          <section className="space-y-6">
            <div className="rounded-2xl border p-5 shadow-sm" style={{ borderColor: dracula.border, background: dracula.panel }}>
              <h2 className="font-serif text-3xl" style={{ color: dracula.text }}>{t.designTitle}</h2>
              <p className="mt-2 text-sm" style={{ color: dracula.cyan }}>{t.rgbEditor}</p>

              {!selectedRestaurant ? (
                <p className="mt-4 rounded-lg border border-dark-600 bg-dark-800 p-3 text-sm text-gold-300">{t.selectRestaurantFirst}</p>
              ) : (
                <>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
                    <div className="space-y-3 rounded-xl border border-dark-600 bg-dark-800/60 p-4">
                      <h3 className="font-serif text-xl text-gold-100">{designLabels.basicSettings}</h3>

                      <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                        <p className="text-sm font-medium text-gold-100">{designLabels.paletteBuilder}</p>
                        <p className="mt-1 text-xs text-gold-400">{designLabels.paletteHint}</p>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <label className="text-xs text-gold-300">
                            {designLabels.basePrimary}
                            <input
                              value={designForm.basePrimaryColor}
                              onChange={(event) =>
                                setDesignForm((prev) => ({
                                  ...prev,
                                  basePrimaryColor: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-md border border-dark-600 bg-dark-800 px-2 py-1 text-gold-100"
                            />
                          </label>
                          <label className="text-xs text-gold-300">
                            {designLabels.baseSecondary}
                            <input
                              value={designForm.baseSecondaryColor}
                              onChange={(event) =>
                                setDesignForm((prev) => ({
                                  ...prev,
                                  baseSecondaryColor: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-md border border-dark-600 bg-dark-800 px-2 py-1 text-gold-100"
                            />
                          </label>
                          <label className="text-xs text-gold-300">
                            {designLabels.baseNeutral}
                            <input
                              value={designForm.baseNeutralColor}
                              onChange={(event) =>
                                setDesignForm((prev) => ({
                                  ...prev,
                                  baseNeutralColor: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-md border border-dark-600 bg-dark-800 px-2 py-1 text-gold-100"
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={applyAutoPaletteFromThreeColors}
                          className="mt-3 min-h-10 w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-gold-100 hover:bg-dark-700"
                        >
                          {designLabels.autoGeneratePalette}
                        </button>
                      </div>

                      <label className="block text-sm text-gold-300">{designLabels.fieldBrandName}</label>
                      <input
                        className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                        value={designForm.brandName}
                        onChange={(event) => setDesignForm((prev) => ({ ...prev, brandName: event.target.value }))}
                      />

                      <label className="block text-sm text-gold-300">{designLabels.fieldBrandSubtitle}</label>
                      <input
                        className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                        value={designForm.brandSubtitle}
                        onChange={(event) => setDesignForm((prev) => ({ ...prev, brandSubtitle: event.target.value }))}
                      />

                      <label className="block text-sm text-gold-300">{designLabels.fieldCurrency}</label>
                      <select
                        className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                        value={designForm.currencyMode}
                        onChange={(event) =>
                          setDesignForm((prev) => ({
                            ...prev,
                            currencyMode: event.target.value as RestaurantDesignSettings["currencyMode"],
                          }))
                        }
                      >
                        <option value="manat">manat</option>
                        <option value="azn">AZN</option>
                        <option value="symbol">₼</option>
                      </select>

                      <label className="block text-sm text-gold-300">{t.tableCount}</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                        value={String(designForm.tableCount)}
                        onChange={(event) => setDesignForm((prev) => ({ ...prev, tableCount: event.target.value }))}
                      />
                      <p className="text-xs text-gold-500">{t.tableCountHint}</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gold-300">{designLabels.fieldButtonRadius}</label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                            value={String(designForm.buttonRadius).replace("px", "")}
                            onChange={(event) => setDesignForm((prev) => ({ ...prev, buttonRadius: event.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gold-300">{designLabels.fieldCardRadius}</label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                            value={String(designForm.cardRadius).replace("px", "")}
                            onChange={(event) => setDesignForm((prev) => ({ ...prev, cardRadius: event.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={saveDesign}
                          disabled={savingDesign}
                          className="min-h-11 rounded-xl bg-gold-600 px-4 py-2 text-dark-950 hover:bg-gold-500 disabled:opacity-60"
                        >
                          {savingDesign ? t.saving : t.saveDesign}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDesignForm(savedDesign)}
                          className="min-h-11 rounded-xl border border-dark-600 bg-dark-800 px-4 py-2 text-gold-100 hover:bg-dark-700"
                        >
                          {designLabels.resetToSaved}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDesignForm(defaultDesign)}
                          className="min-h-11 rounded-xl border border-dark-600 bg-dark-800 px-4 py-2 text-gold-100 hover:bg-dark-700 sm:col-span-2"
                        >
                          {designLabels.resetToDefault}
                        </button>
                      </div>

                      {designNotice ? <p className="text-sm text-gold-300">{designNotice}</p> : null}
                    </div>

                    <div className="space-y-4 rounded-xl border border-dark-600 bg-dark-800/50 p-4">
                      <h3 className="font-serif text-xl text-gold-100">{designLabels.previewCompare}</h3>

                      <div className="rounded-xl border border-dark-600 bg-dark-900 p-3">
                        <p className="text-sm text-gold-300">{designLabels.changedFields}</p>
                        {changedDesignFields.length === 0 ? (
                          <p className="mt-2 text-sm text-gold-500">{designLabels.noChanges}</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {changedDesignFields.map((field) => (
                              <div key={field} className="rounded-lg border border-dark-600 bg-dark-800 p-2 text-xs text-gold-200">
                                <p className="font-medium">{getChangedFieldLabel(field, designLabels)}</p>
                                <p className="mt-1 text-gold-400">{String(savedDesign[field])} → {String(designForm[field])}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        {renderDesignPreview(savedDesign, designLabels.savedPreview)}
                        {renderDesignPreview(designForm, designLabels.draftPreview)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {colorFieldGroups.map((group) => (
                      <article key={group.titleKey} className="rounded-xl border border-dark-600 bg-dark-800/60 p-4">
                        <h3 className="font-serif text-xl text-gold-100">{designLabels[group.titleKey]}</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {group.fields.map((field) => (
                            <label key={field} className="rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-gold-200">
                              <span className="mb-2 block">{getFieldLabel(field, designLabels)}</span>
                              <div className="mb-2 h-6 w-full rounded" style={{ background: designForm[field] }} />
                              <input
                                value={designForm[field]}
                                onChange={(event) =>
                                  setDesignForm((prev) => ({
                                    ...prev,
                                    [field]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-md border border-dark-600 bg-dark-800 px-2 py-1 text-sm text-gold-100"
                              />
                            </label>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-dark-700 bg-dark-900 p-6 shadow-sm">
              <h2 className="font-serif text-3xl text-gold-100">{t.qrTitle}</h2>
              <p className="mt-2 break-all text-sm text-gold-400">{menuUrl}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tableQrs.map((entry) => (
                  <article key={entry.table} className="rounded-xl border border-dark-600 p-3">
                    <h3 className="font-serif text-xl text-gold-200">
                      {t.tableLabel} {entry.table}
                    </h3>
                    <p className="mt-1 break-all text-xs text-gold-500">{entry.url}</p>
                    <Image
                      src={entry.dataUrl}
                      alt={`QR table ${entry.table}`}
                      width={220}
                      height={220}
                      unoptimized
                      className="mt-3 h-auto w-full max-w-[220px] rounded-lg border border-dark-600 bg-white p-2"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => downloadDataUrl(entry.dataUrl, `${selectedRestaurant?.slug || "restaurant"}-table-${entry.table}-qr.png`)}
                        className="min-h-10 rounded-lg border border-dark-600 bg-dark-800 px-3 py-1 text-xs text-gold-200 hover:bg-dark-700"
                      >
                        {t.downloadQr}
                      </button>
                      <button
                        type="button"
                        onClick={() => void downloadStyledQr(entry)}
                        className="min-h-10 rounded-lg bg-gold-600 px-3 py-1 text-xs text-dark-950 hover:bg-gold-500"
                      >
                        {t.downloadStyledQr}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {busyMessage ? <p className="mt-4 text-sm text-gold-300">{busyMessage}</p> : null}
      </div>
    </main>
  );
}
