import type { RestaurantDesign } from "@/lib/design";

export type SuperAdminLanguage = "en" | "ru" | "az";
export type RestaurantServiceMode = "lite" | "pro";

export type Restaurant = {
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

export type DishForm = {
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

// Super-admin edits the full settings: the shared render contract (RestaurantDesign)
// plus editor-only fields (brand text, base palette, table count, quantity buttons…).
export type RestaurantDesignSettings = RestaurantDesign & {
  basePrimaryColor: string;
  baseSecondaryColor: string;
  baseNeutralColor: string;
  brandName: string;
  brandSubtitle: string;
  tableCount: string;
  overlayColor: string;
  categoryTitleColor: string;
  qtyButtonBackground: string;
  qtyButtonTextColor: string;
  qtyButtonBorderColor: string;
};

export type ColorField =
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
