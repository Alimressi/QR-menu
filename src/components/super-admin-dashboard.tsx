"use client";

import { CategoryWithDishes, Dish } from "@/types";
import { formatCurrency } from "@/lib/design";
import { compressImage } from "@/lib/image-compress";
import { getRestaurantTableCountFromSettings } from "@/lib/restaurant";
import { RESTAURANT_STATUSES, getEffectiveStatus, getTrialDaysLeft } from "@/lib/subscription";
import {
  ColorField,
  DishForm,
  Restaurant,
  RestaurantDesignSettings,
  RestaurantServiceMode,
  SuperAdminLanguage,
} from "./super-admin/types";
import {
  designLabelDictionary,
  dictionary,
  getChangedFieldLabel,
  getFieldLabel,
} from "./super-admin/i18n";
import { generatePaletteFromThreeColors } from "./super-admin/palette";
import { MenuImportPanel } from "./super-admin/menu-import-panel";
import { DishCard } from "@/components/dish-card";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Drag target laid over the dish photo in the editor: dragging picks the focal
 * point that object-position uses, so the admin sees the exact menu framing.
 */
function FramingOverlay({
  x,
  y,
  onChange,
}: {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const apply = (clientX: number, clientY: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    const nextX = Math.round(Math.min(100, Math.max(0, ((clientX - box.left) / box.width) * 100)));
    const nextY = Math.round(Math.min(100, Math.max(0, ((clientY - box.top) / box.height) * 100)));
    onChange(nextX, nextY);
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 cursor-crosshair touch-none"
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        apply(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (dragging.current) apply(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
    >
      <div
        className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-[0_0_0_2px_rgba(0,0,0,0.45)]"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </div>
  );
}


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
  soldOut: false,
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


function getDishName(language: SuperAdminLanguage, dish: Dish) {
  if (language === "ru") {
    return dish.nameRu || dish.nameEn;
  }

  if (language === "az") {
    return dish.nameAz || dish.nameEn;
  }

  return dish.nameEn;
}

function getCategoryNameTranslated(language: SuperAdminLanguage, category: CategoryWithDishes) {
  if (language === "ru") {
    return category.nameRu || category.nameEn;
  }

  if (language === "az") {
    return category.nameAz || category.nameEn;
  }

  return category.nameEn;
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

function parseRestaurantPhotosEnabled(settings: string | null): boolean {
  if (!settings) {
    return true;
  }

  try {
    const parsed = JSON.parse(settings) as { photosEnabled?: unknown };
    return parsed.photosEnabled !== false; // default: photos on
  } catch {
    return true;
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

function parseRestaurantAdminLogin(settings: string | null) {
  const parsed = parseRestaurantSettingsObject(settings);
  const adminLogin = parsed.adminLogin;

  if (typeof adminLogin === "string") {
    return adminLogin;
  }

  return "";
}

function normalizeRadiusForSave(value: string, fallback: string) {
  const parsed = Number.parseFloat(String(value).trim().replace("px", ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return `${parsed}px`;
}

function emptyRestaurantForm() {
  return {
    name: "",
    slug: "",
    logoUrl: "",
    serviceMode: "pro" as RestaurantServiceMode,
    adminLogin: "",
    adminPassword: "",
    // New restaurants are sold on a trial; the API fills the end date.
    status: "trial",
    trialEndsAt: "",
    phone: "",
    instagramUrl: "",
    address: "",
    showLogo: true,
    showPhone: true,
    showWhatsapp: true,
    showInstagram: true,
    showLocation: true,
  };
}


export function SuperAdminDashboard() {
  const [language, setLanguage] = useState<SuperAdminLanguage>("en");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  // Empty, not prefilled. These once held "superadmin" / "superadmin123", which
  // are not the real credentials but read as a hint in the page source to anyone
  // who opens it. The real password lives only in a Worker secret.
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  /** Which restaurant's checkout link was just copied, for the button's label. */
  const [copiedBillingFor, setCopiedBillingFor] = useState<number | null>(null);
  /** Table count as typed in the QR tab, before it is saved. */
  const [qrTableCount, setQrTableCount] = useState("");
  const [savingTableCount, setSavingTableCount] = useState(false);
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
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurantForm());
  const [editingRestaurantId, setEditingRestaurantId] = useState<number | null>(null);

  const t = dictionary[language];
  const designLabels = designLabelDictionary[language];

  // Inline-style half of the red-neon theme. The class-based half lives in
  // globals.css under .superadmin-dracula; keep the two in step.
  const dracula = {
    page: "radial-gradient(ellipse at 12% -5%, rgba(255,85,85,0.22) 0%, transparent 48%), radial-gradient(ellipse at 88% 105%, rgba(255,121,198,0.14) 0%, transparent 46%), linear-gradient(180deg, #140d12 0%, #1b0f16 100%)",
    panel: "#1a1016",
    panelSoft: "#241620",
    border: "#4a2634",
    text: "#f8f8f2",
    muted: "#c98a9c",
    accent: "#ff5555",
    accentText: "#17090d",
    cyan: "#ff79c6",
    danger: "#ff8f8f",
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

  // Dish form data shaped for the shared menu card, in the admin's language.
  const dishCardPreview = useMemo(() => {
    const byLanguage = (en: string, ru: string, az: string) =>
      (language === "ru" ? ru : language === "az" ? az : en) || en;

    return {
      name: byLanguage(dishForm.nameEn, dishForm.nameRu, dishForm.nameAz) || "—",
      description: byLanguage(dishForm.descriptionEn, dishForm.descriptionRu, dishForm.descriptionAz),
      price: Number(dishForm.price) || 0,
      imageUrl: dishForm.imageUrl,
      imagePositionX: dishForm.imagePositionX,
      imagePositionY: dishForm.imagePositionY,
      soldOut: dishForm.soldOut,
    };
  }, [dishForm, language]);

  const changedDesignFields = selectedRestaurant
    ? (Object.keys(defaultDesign) as Array<keyof RestaurantDesignSettings>).filter(
        (key) => String(savedDesign[key]) !== String(designForm[key]),
      )
    : [];

  const loadRestaurants = useCallback(async () => {
    const response = await fetch("/api/superadmin/restaurants", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setRestaurants(data.restaurants || []);
      // Select first restaurant by default if none selected
      if (data.restaurants?.length > 0) {
        setSelectedRestaurantId((current) => current || data.restaurants[0].id);
      }
    }
  }, []);

  const loadMenu = useCallback(async () => {
    if (!selectedRestaurantId) return;
    
    const [categoriesResponse, dishesResponse] = await Promise.all([
      // fresh=1 keeps the editor off the guest cache — see the two GET handlers.
      fetch(`/api/categories?restaurantId=${selectedRestaurantId}&fresh=1`, { cache: "no-store" }),
      fetch(`/api/dishes?restaurantId=${selectedRestaurantId}&fresh=1`, { cache: "no-store" }),
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
      // Check session and get user info
      const response = await fetch("/api/admin/me", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        // Verify user is SUPER_ADMIN
        if (data.role === "SUPER_ADMIN") {
          setAuthenticated(true);
          void loadRestaurants();
        } else {
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

    // Show what is actually stored, so the field never claims a count the
    // generated codes below do not match.
    setQrTableCount(String(getRestaurantTableCountFromSettings(selectedRestaurant.settings)));

    const generateQr = async () => {
      const QRCode = await import("qrcode");
      const response = await fetch(`/api/superadmin/qr?restaurantId=${selectedRestaurant.id}`, { cache: "no-store" });
      if (!response.ok) {
        setTableQrs([]);
        return;
      }

      const data = await response.json() as {
        qrCodes: Array<{ table: string; url: string }>;
      };

      const qrEntries = await Promise.all(
        (data.qrCodes || []).map(async (entry) => {
          const dataUrl = await QRCode.toDataURL(entry.url, {
            width: 400,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });

          return {
            table: entry.table,
            url: entry.url,
            dataUrl,
          };
        }),
      );

      setTableQrs(qrEntries);
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

  /**
   * Change how many tables this restaurant has, from the QR tab.
   *
   * Sends only `tableCount`; the PATCH merges into the stored settings, so the
   * design, service mode and admin login are all left alone.
   *
   * Printed codes are safe. A table's access key is an HMAC over
   * `restaurant:<slug>|table:<n>` and nothing else — not the total. Going from 12
   * tables to 20 mints keys for 13-20 and leaves 1-12 byte-identical; going back
   * to 8 simply stops listing 9-12, whose keys still verify if someone scans a
   * code printed earlier. The only thing that would ever invalidate them is
   * rotating QR_TABLE_KEY_SECRET.
   */
  async function saveTableCount() {
    if (!selectedRestaurantId) return;

    const parsed = Number.parseInt(qrTableCount, 10);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 200) {
      alert(t.tableCountInvalid);
      return;
    }

    setSavingTableCount(true);

    try {
      const response = await fetch(`/api/superadmin/restaurants/${selectedRestaurantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { tableCount: parsed } }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update table count");
      }

      await loadRestaurants();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update table count");
    } finally {
      setSavingTableCount(false);
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
      // `menu-preview` for the same reason as the dish card: the panel's own
      // theme forces heading colours with !important, and the brand name here is
      // an <h3>. Without it this preview showed the restaurant's name in the
      // panel's pink glow instead of the colour the guest will actually see.
      <article
        className="menu-preview rounded-2xl border p-4"
        style={{ borderColor: design.borderColor, background: design.panelColor }}
      >
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
            <strong style={{ color: design.primaryColor }}>{formatCurrency(18.4, design.currencyMode)}</strong>
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

    const response = await fetch("/api/superadmin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      setAuthError("Invalid super admin credentials");
      return;
    }

    setAuthenticated(true);
    void loadRestaurants();
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  async function onImageUpload(original: File) {
    if (!selectedRestaurantId) return;

    setBusyMessage(t.preparingImage);

    // Shrink on the device first: a phone photo is 10-20 MB, a dish card is
    // 420px wide. This keeps the guest menu fast and means whoever adds the
    // dish never hits the upload size limit.
    const { file } = await compressImage(original);

    const formData = new FormData();
    formData.append("file", file);
    // Uploads are stored under the restaurant they belong to.
    formData.append("restaurantId", String(selectedRestaurantId));
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
        soldOut: dishForm.soldOut,
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
    } catch (error) {
      // Without this the throw above went nowhere: React swallows a rejected
      // promise from an event handler, so a failed save looked exactly like a
      // successful one that changed nothing. Ticking "sold out", pressing
      // Update and seeing the dish unchanged is what that bug looks like from
      // the outside — the session had expired and nobody was told.
      alert(error instanceof Error ? error.message : t.saveDishFailed);
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
      soldOut: dish.soldOut === true,
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

    const contactSettings = {
      phone: restaurantForm.phone.trim(),
      instagramUrl: restaurantForm.instagramUrl.trim(),
      address: restaurantForm.address.trim(),
      showLogo: restaurantForm.showLogo,
      showPhone: restaurantForm.showPhone,
      showWhatsapp: restaurantForm.showWhatsapp,
      showInstagram: restaurantForm.showInstagram,
      showLocation: restaurantForm.showLocation,
    };
    const normalizedSettings =
      editingRestaurantId !== null
        ? { ...existingSettings, serviceMode: restaurantForm.serviceMode, ...contactSettings }
        : { serviceMode: restaurantForm.serviceMode, ...contactSettings };

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
        adminLogin: restaurantForm.adminLogin,
        adminPassword: restaurantForm.adminPassword,
        status: restaurantForm.status,
        trialEndsAt: restaurantForm.trialEndsAt || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Failed to save restaurant");
      return;
    }

    setRestaurantForm(emptyRestaurantForm());
    setEditingRestaurantId(null);
    await loadRestaurants();
  }

  /**
   * Copy the checkout link for one restaurant.
   *
   * Built on the server, because the link carries this restaurant's id as custom
   * data and that is what ties the payment back to them when the webhook lands.
   * Hand a venue the wrong link and you switch on somebody else's menu.
   */
  async function copyBillingLink(restaurantId: number) {
    try {
      const response = await fetch(`/api/superadmin/checkout-link?restaurantId=${restaurantId}`, {
        cache: "no-store",
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        alert(data.error || "Could not build the checkout link.");
        return;
      }

      await navigator.clipboard.writeText(data.url);
      setCopiedBillingFor(restaurantId);
      setTimeout(() => setCopiedBillingFor((current) => (current === restaurantId ? null : current)), 2000);
    } catch {
      // Clipboard access is refused outside a secure context, and on http://
      // during local development that is every time. Show the link so it can
      // still be copied by hand rather than failing silently.
      alert("Could not copy automatically. Open the network tab for the link, or try again over HTTPS.");
    }
  }

  function editRestaurant(restaurant: Restaurant) {
    const s = parseRestaurantSettingsObject(restaurant.settings);
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const flag = (v: unknown) => v !== false; // default on
    setRestaurantForm({
      name: restaurant.name,
      slug: restaurant.slug,
      logoUrl: restaurant.logoUrl || "",
      serviceMode: parseRestaurantServiceMode(restaurant.settings),
      adminLogin: parseRestaurantAdminLogin(restaurant.settings),
      adminPassword: "",
      status: restaurant.status || "active",
      // <input type="date"> wants YYYY-MM-DD, not an ISO timestamp.
      trialEndsAt: restaurant.trialEndsAt ? restaurant.trialEndsAt.slice(0, 10) : "",
      phone: str(s.phone),
      instagramUrl: str(s.instagramUrl),
      address: str(s.address),
      showLogo: flag(s.showLogo),
      showPhone: flag(s.showPhone),
      showWhatsapp: flag(s.showWhatsapp),
      showInstagram: flag(s.showInstagram),
      showLocation: flag(s.showLocation),
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

  async function updateRestaurantPhotosEnabled(restaurant: Restaurant, nextEnabled: boolean) {
    const currentSettings = parseRestaurantSettingsObject(restaurant.settings);

    const response = await fetch(`/api/superadmin/restaurants/${restaurant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          ...currentSettings,
          photosEnabled: nextEnabled,
        },
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      alert(data.error || "Failed to update photos option");
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

        {tab === "menu" && selectedRestaurantId ? (
          <div className="mb-6">
            <MenuImportPanel restaurantId={selectedRestaurantId} onImported={loadMenu} />
          </div>
        ) : null}

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
                      {getCategoryNameTranslated(language, category)}
                    </option>
                ))}
              </select>

              {dishForm.imageUrl ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gold-400">{t.framingPreview}</p>
                    <p className="text-xs text-gold-400/60">{t.framingHint}</p>
                  </div>

                  {/* The very same <DishCard/> the guest menu renders, so this
                      preview cannot drift from the real thing. One card, because
                      the menu now draws one card — phone and desktop stopped
                      being two designs.

                      `menu-preview` keeps the panel's own theme out: see the
                      .superadmin-dracula rules in globals.css, which force
                      heading colours with !important and were repainting the
                      dish name in pink. */}
                  <div className="menu-preview w-[420px] max-w-full">
                    <DishCard
                      staticImage
                      dish={dishCardPreview}
                      design={savedDesign}
                      addLabel={designLabels.addButton}
                      imageOverlay={
                        <FramingOverlay
                          x={Number(dishForm.imagePositionX) || 50}
                          y={Number(dishForm.imagePositionY) || 50}
                          onChange={(nextX, nextY) =>
                            setDishForm((prev) => ({
                              ...prev,
                              imagePositionX: String(nextX),
                              imagePositionY: String(nextY),
                            }))
                          }
                        />
                      }
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

              {/* Today's stop list. The dish stays in the menu, greyed out and
                  unorderable, and comes back by unticking this. */}
              <label className="flex items-center gap-2 text-sm text-gold-200">
                <input
                  type="checkbox"
                  checked={dishForm.soldOut}
                  onChange={(e) => setDishForm((prev) => ({ ...prev, soldOut: e.target.checked }))}
                />
                {t.soldOut}
                <span className="text-xs text-gold-500">{t.soldOutHint}</span>
              </label>

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
                      <p className="font-medium text-gold-200">{getDishName(language, dish)}</p>
                    <p className="text-sm text-gold-400">{formatCurrency(dish.price, designForm.currencyMode)}</p>
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                <select
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                  value={restaurantForm.status}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, status: e.target.value }))}
                  title={t.subscriptionStatus}
                >
                  {RESTAURANT_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {t.status[value]}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.trialEndsAt}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, trialEndsAt: e.target.value }))}
                  title={t.trialEndsAt}
                  disabled={restaurantForm.status !== "trial"}
                />
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.adminLogin}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, adminLogin: e.target.value }))}
                  placeholder="Restaurant admin login"
                  required
                />
                <input
                  type="password"
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.adminPassword}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
                  placeholder={editingRestaurantId ? "New admin password (leave blank to keep)" : "Restaurant admin password"}
                  required={!editingRestaurantId}
                />
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.phone}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone e.g. +994 70 000 00 00"
                />
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.instagramUrl}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                  placeholder="Instagram URL"
                />
                <input
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100 placeholder:text-dark-400"
                  value={restaurantForm.address}
                  onChange={(e) => setRestaurantForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Address (opens in Google Maps)"
                />
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs uppercase tracking-wider text-gold-300">Show in header</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gold-100">
                  {([
                    ["showLogo", "Logo"],
                    ["showPhone", "Phone"],
                    ["showWhatsapp", "WhatsApp"],
                    ["showInstagram", "Instagram"],
                    ["showLocation", "Location"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-gold-500"
                        checked={restaurantForm[key]}
                        onChange={(e) => setRestaurantForm((prev) => ({ ...prev, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
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
                      setRestaurantForm(emptyRestaurantForm());
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
                      <div className="mt-2">
                        <label className="mb-1 block text-xs text-gold-300">{t.photosMode}</label>
                        <select
                          className="w-full rounded-lg border border-dark-600 bg-dark-800 px-2 py-1 text-xs text-gold-100"
                          value={parseRestaurantPhotosEnabled(restaurant.settings) ? "on" : "off"}
                          onChange={(event) =>
                            void updateRestaurantPhotosEnabled(restaurant, event.target.value === "on")
                          }
                        >
                          <option value="on">{t.photosOn}</option>
                          <option value="off">{t.photosOff}</option>
                        </select>
                      </div>
                      <p className="mt-2 break-all text-xs text-gold-300">
                        Menu: <a href={`/${restaurant.slug}`} target="_blank" rel="noreferrer" className="underline">/{restaurant.slug}</a>
                      </p>
                      <p className="mt-1 break-all text-xs text-gold-300">
                        Admin: <a href={`/${restaurant.slug}/admin`} target="_blank" rel="noreferrer" className="underline">/{restaurant.slug}/admin</a>
                      </p>
                      <div className="mt-2 text-xs">
                        {(() => {
                          const effective = getEffectiveStatus(restaurant);
                          const daysLeft = getTrialDaysLeft(restaurant);
                          const tone: Record<string, string> = {
                            active: "rgba(80,250,123,0.18)|#50fa7b",
                            trial: "rgba(139,233,253,0.18)|#8be9fd",
                            past_due: "rgba(255,184,108,0.18)|#ffb86c",
                            disabled: "rgba(255,107,107,0.18)|#ff6b6b",
                          };
                          const [background, color] = (tone[effective] || tone.active).split("|");
                          return (
                            <span
                              className="rounded-full px-2 py-1 font-semibold"
                              style={{ background, color }}
                            >
                              {t.status[effective]}
                              {effective === "trial" && daysLeft !== null ? ` · ${daysLeft}d` : ""}
                            </span>
                          );
                        })()}
                      </div>
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
                      onClick={() => copyBillingLink(restaurant.id)}
                      title="Copy the Lemon Squeezy checkout link for this restaurant"
                      className="min-h-9 rounded-lg border border-dark-600 bg-dark-800 px-3 py-1 text-sm text-gold-300 hover:bg-dark-700"
                    >
                      {copiedBillingFor === restaurant.id ? "Copied" : "Billing link"}
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

            <div className="mt-5 rounded-xl border border-dark-600 p-4">
              <label className="block text-sm text-gold-300">{t.tableCount}</label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={qrTableCount}
                  onChange={(event) => setQrTableCount(event.target.value)}
                  className="w-28 rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-gold-100"
                />
                <button
                  type="button"
                  onClick={() => void saveTableCount()}
                  disabled={savingTableCount}
                  className="min-h-10 rounded-lg bg-gold-600 px-4 py-2 text-sm text-dark-950 hover:bg-gold-500"
                >
                  {savingTableCount ? t.saving : t.update}
                </button>
              </div>
              <p className="mt-2 text-xs text-gold-500">{t.tableCountQrHint}</p>
            </div>

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
