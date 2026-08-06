"use client";

import { CategoryWithDishes, Language, Order } from "@/types";
import { Minus, Plus, ShoppingBag, Trash2, Bell, Menu, X, Phone, MapPin } from "lucide-react";
import Image from "next/image";
import { DishCard } from "@/components/dish-card";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  categories: CategoryWithDishes[];
  restaurantId?: number;
  restaurantSlug?: string;
  settings?: {
    serviceMode?: "lite" | "pro";
    /** When false, the menu renders without dish photos (text-only). */
    photosEnabled?: boolean;
    brandName?: string;
    brandSubtitle?: string;
    /** Optional small line under the subtitle: service fee note, etc. */
    infoNote?: string;
    /** Contact / social links shown as buttons in the header. */
    phone?: string;
    instagramUrl?: string;
    address?: string;
    /** Per-element visibility toggles (super-admin). Undefined = shown. */
    showLogo?: boolean;
    showPhone?: boolean;
    showWhatsapp?: boolean;
    showInstagram?: boolean;
    showLocation?: boolean;
    primaryColor?: string;
    accentTextColor?: string;
    backgroundFrom?: string;
    backgroundTo?: string;
    surfaceColor?: string;
    textColor?: string;
    mutedTextColor?: string;
    borderColor?: string;
    buttonRadius?: string;
    cardRadius?: string;
    panelColor?: string;
    overlayColor?: string;
    controlSurfaceColor?: string;
    activeChipBackground?: string;
    activeChipTextColor?: string;
    inactiveChipBackground?: string;
    inactiveChipTextColor?: string;
    dividerColor?: string;
    successColor?: string;
    errorColor?: string;
    categoryTitleColor?: string;
    qtyButtonBackground?: string;
    qtyButtonTextColor?: string;
    qtyButtonBorderColor?: string;
    currencyMode?: "manat" | "azn" | "symbol";
    /** When set, the table number is fixed to this value and cannot be edited. */
    lockedTableNumber?: string;
  };
  logoUrl?: string | null;
  restaurantName?: string;
};

type Dictionary = {
  title: string;
  subtitle: string;
  menuLabel: string;
  tableNumber: string;
  qrTableDetected: string;
  placeOrder: string;
  add: string;
  total: string;
  basket: string;
  empty: string;
  orderSuccess: string;
  failed: string;
  chooseItemsError: string;
  tableRequiredError: string;
  tableSessionExpired: string;
  qrRequiredError: string;
  qrInvalidError: string;
  categories: string;
  viewBasket: string;
  close: string;
  activeOrder: string;
  status: string;
  orderNo: string;
  mergedOrderSuccess: string;
  newOrderSuccess: string;
  statusNew: string;
  statusPreparing: string;
  statusReady: string;
  statusPaid: string;
  callWaiter: string;
  callWaiterSuccess: string;
  callWaiterFailed: string;
  waiterOnTheWay: string;
  noItemsInCategory: string;
  removeItemAria: string;
  decreaseQtyAria: string;
  increaseQtyAria: string;
  missingRestaurantContext: string;
  requiredOptionError: string;
  chooseOption: string;
  optionLabel: string;
  browseCategories: string;
};

const dictionary: Record<Language, Dictionary> = {
  en: {
    title: "Nine Lives",
    subtitle: "Craft cocktails. Fine dishes. Timeless atmosphere.",
    menuLabel: "Bar & Lounge QR Menu",
    tableNumber: "Table number",
    qrTableDetected: "Detected from QR",
    placeOrder: "Place order",
    add: "Add",
    total: "Total",
    basket: "Your orders",
    empty: "You haven't added anything yet",
    orderSuccess: "Order created successfully.",
    failed: "Something went wrong. Please try again.",
    chooseItemsError: "Add at least one dish to your basket.",
    tableRequiredError: "Please enter table number.",
    tableSessionExpired: "Your table session is closed. Please scan the QR on your table again.",
    qrRequiredError: "Please scan your table QR code to place an order.",
    qrInvalidError: "Invalid QR link. Please scan the QR code on your table.",
    categories: "Categories",
    viewBasket: "View orders",
    close: "Close",
    activeOrder: "Current order",
    status: "Status",
    orderNo: "Order",
    mergedOrderSuccess: "Items were added to your current order.",
    newOrderSuccess: "Order created successfully.",
    statusNew: "new",
    statusPreparing: "preparing",
    statusReady: "ready",
    statusPaid: "paid",
    callWaiter: "Call Waiter",
    callWaiterSuccess: "Waiter is on the way!",
    callWaiterFailed: "Failed to call waiter. Please try again.",
    waiterOnTheWay: "Waiter called",
    noItemsInCategory: "No items in this category yet.",
    removeItemAria: "Remove item",
    decreaseQtyAria: "Decrease quantity",
    increaseQtyAria: "Increase quantity",
    missingRestaurantContext: "Restaurant context is missing. Please reload menu from QR link.",
    requiredOptionError: "Please choose an option for this dish before adding it.",
    chooseOption: "Choose option",
    optionLabel: "Option",
    browseCategories: "Browse categories",
  },
  ru: {
    title: "Nine Lives",
    subtitle: "Авторские коктейли. Избранные блюда. Неподвластная времени атмосфера.",
    menuLabel: "QR-меню бара и лаунжа",
    tableNumber: "Номер стола",
    qrTableDetected: "Определен по QR",
    placeOrder: "Сделать заказ",
    add: "Добавить",
    total: "Итого",
    basket: "Ваши заказы",
    empty: "Вы пока ничего не добавили",
    orderSuccess: "Заказ успешно создан.",
    failed: "Что-то пошло не так. Попробуйте снова.",
    chooseItemsError: "Добавьте хотя бы одно блюдо в корзину.",
    tableRequiredError: "Введите номер стола.",
    tableSessionExpired: "Сессия стола закрыта. Пожалуйста, снова отсканируйте QR-код на вашем столе.",
    qrRequiredError: "Чтобы сделать заказ, отсканируйте QR-код на вашем столе.",
    qrInvalidError: "Неверная QR-ссылка. Пожалуйста, сканируйте QR-код на вашем столе.",
    categories: "Категории",
    viewBasket: "Заказы",
    close: "Закрыть",
    activeOrder: "Текущий заказ",
    status: "Статус",
    orderNo: "Заказ",
    mergedOrderSuccess: "Позиции добавлены в текущий заказ.",
    newOrderSuccess: "Заказ успешно создан.",
    statusNew: "новый",
    statusPreparing: "готовится",
    statusReady: "готов",
    statusPaid: "оплачен",
    callWaiter: "Вызвать официанта",
    callWaiterSuccess: "Официант уже идет к вам!",
    callWaiterFailed: "Не удалось вызвать официанта. Попробуйте еще раз.",
    waiterOnTheWay: "Официант вызван",
    noItemsInCategory: "В этой категории пока нет блюд.",
    removeItemAria: "Удалить позицию",
    decreaseQtyAria: "Уменьшить количество",
    increaseQtyAria: "Увеличить количество",
    missingRestaurantContext: "Контекст ресторана отсутствует. Пожалуйста, откройте меню снова по QR-ссылке.",
    requiredOptionError: "Перед добавлением выберите вариант блюда.",
    chooseOption: "Выберите вариант",
    optionLabel: "Вариант",
    browseCategories: "Категории",
  },
  az: {
    title: "Nine Lives",
    subtitle: "Müəllif kokteylləri. Seçilmiş yeməklər. Zamansız atmosfer.",
    menuLabel: "Bar və lounge üçün QR menyu",
    tableNumber: "Masa nömrəsi",
    qrTableDetected: "QR ilə təyin edildi",
    placeOrder: "Sifariş et",
    add: "Əlavə et",
    total: "Cəmi",
    basket: "Sifarişləriniz",
    empty: "Hələ heç nə əlavə etməmisiniz",
    orderSuccess: "Sifariş uğurla yaradıldı.",
    failed: "Xəta baş verdi. Yenidən cəhd edin.",
    chooseItemsError: "Səbətə ən azı bir yemək əlavə edin.",
    tableRequiredError: "Masa nömrəsini daxil edin.",
    tableSessionExpired: "Masa sessiyası bağlanıb. Zəhmət olmasa masanızdakı QR kodu yenidən skan edin.",
    qrRequiredError: "Sifariş etmək üçün masanızdakı QR kodu skan edin.",
    qrInvalidError: "Yanlış QR linki. Zəhmət olmasa masanızdakı QR kodu skan edin.",
    categories: "Kateqoriyalar",
    viewBasket: "Sifarişlər",
    close: "Bağla",
    activeOrder: "Cari sifariş",
    status: "Status",
    orderNo: "Sifariş",
    mergedOrderSuccess: "Məhsullar cari sifarişinizə əlavə olundu.",
    newOrderSuccess: "Sifariş uğurla yaradıldı.",
    statusNew: "yeni",
    statusPreparing: "hazırlanır",
    statusReady: "hazırdır",
    statusPaid: "ödənilib",
    callWaiter: "Ofisiant çağır",
    callWaiterSuccess: "Ofisiant sizə tərəf gəlir!",
    callWaiterFailed: "Ofisiant çağırmaq alınmadı. Yenidən cəhd edin.",
    waiterOnTheWay: "Ofisiant çağırıldı",
    noItemsInCategory: "Bu kateqoriyada hələlik yemək yoxdur.",
    removeItemAria: "Məhsulu sil",
    decreaseQtyAria: "Miqdarı azalt",
    increaseQtyAria: "Miqdarı artır",
    missingRestaurantContext: "Restoran məlumatı tapılmadı. Zəhmət olmasa menyunu QR linki ilə yenidən açın.",
    requiredOptionError: "Əlavə etməzdən əvvəl yemək variantını seçin.",
    chooseOption: "Variant seçin",
    optionLabel: "Variant",
    browseCategories: "Kateqoriyalar",
  },
};

type CategoryTranslation = {
  ru: string;
  az: string;
};

const categoryTranslationFallbacks: Record<string, CategoryTranslation> = {
  salads: { ru: "Салаты", az: "Salatlar" },
  soups: { ru: "Супы", az: "Şorbalar" },
  appetizers: { ru: "Закуски", az: "Qəlyanaltılar" },
  "sandwiches and burgers": { ru: "Сэндвичи и бургеры", az: "Sendviçlər və burgerlər" },
  pasta: { ru: "Паста", az: "Pasta" },
  sushi: { ru: "Суши", az: "Suşi" },
  "main course": { ru: "Основные блюда", az: "Əsas yeməklər" },
  pizza: { ru: "Пицца", az: "Pizza" },
  "pizza menu": { ru: "Пицца", az: "Pizza" },
  "signature cocktails": { ru: "Авторские коктейли", az: "İmza kokteylləri" },
  "classic cocktails": { ru: "Классические коктейли", az: "Klassik kokteyllər" },
  sour: { ru: "Сауэр-коктейли", az: "Sour kokteylləri" },
  "hot alcohol": { ru: "Горячие алкогольные напитки", az: "İsti alkoqollu içkilər" },
  whiskey: { ru: "Виски", az: "Viski" },
  vodka: { ru: "Водка", az: "Votka" },
  tequila: { ru: "Текила", az: "Tekila" },
  gin: { ru: "Джин", az: "Cin" },
  rum: { ru: "Ром", az: "Rom" },
  liqueurs: { ru: "Ликеры", az: "Likörlər" },
  aperitif: { ru: "Аперитивы", az: "Aperitivlər" },
  aperitive: { ru: "Аперитивы", az: "Aperitivlər" },
  beer: { ru: "Пиво", az: "Pivə" },
  "shot section": { ru: "Шоты", az: "Shotlar" },
  lemonades: { ru: "Лимонады", az: "Limonadlar" },
  "soft drinks": { ru: "Безалкогольные напитки", az: "Sərinləşdirici içkilər" },
  coffee: { ru: "Кофе", az: "Qəhvə" },
  "ice coffee": { ru: "Айс-кофе", az: "Buzlu qəhvə" },
  dessert: { ru: "Десерты", az: "Desertlər" },
  "local red wines": { ru: "Местные красные вина", az: "Yerli qırmızı şərablar" },
  "local white wine": { ru: "Местные белые вина", az: "Yerli ağ şərablar" },
  "local rose wine": { ru: "Местные розовые вина", az: "Yerli roze şərablar" },
  wines: { ru: "Вина", az: "Şərablar" },
  "classic wines": { ru: "Классические вина", az: "Klassik şərablar" },
  "sparkling wines": { ru: "Игристые вина", az: "Köpüklü şərablar" },
};

function normalizeCategoryKey(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/\s+/g, " ").trim();
}

function getCategoryFallbackTranslation(language: Language, category: CategoryWithDishes) {
  if (language === "en") {
    return null;
  }

  const keys = [category.nameEn, category.nameRu, category.nameAz]
    .map((value) => normalizeCategoryKey(String(value || "")))
    .filter(Boolean);

  for (const key of keys) {
    const translation = categoryTranslationFallbacks[key];

    if (translation) {
      return language === "ru" ? translation.ru : translation.az;
    }
  }

  return null;
}

function getDishName(language: Language, dish: CategoryWithDishes["dishes"][number]) {
  if (language === "ru") {
    return dish.nameRu || dish.nameEn;
  }

  if (language === "az") {
    return dish.nameAz || dish.nameEn;
  }

  return dish.nameEn;
}

function getDishDescription(language: Language, dish: CategoryWithDishes["dishes"][number]) {
  if (language === "ru") {
    return dish.descriptionRu || dish.descriptionAz || dish.descriptionEn;
  }

  if (language === "az") {
    return dish.descriptionAz || dish.descriptionRu || dish.descriptionEn;
  }

  return dish.descriptionEn;
}

function getCategoryName(language: Language, category: CategoryWithDishes) {
  const nameEn = String(category.nameEn || "").trim();
  const nameRu = String(category.nameRu || "").trim();
  const nameAz = String(category.nameAz || "").trim();

  if (language === "ru") {
    if (nameRu && nameRu !== nameEn) {
      return nameRu;
    }

    const fallback = getCategoryFallbackTranslation(language, category);

    return fallback || nameRu || nameAz || nameEn;
  }

  if (language === "az") {
    if (nameAz && nameAz !== nameEn) {
      return nameAz;
    }

    const fallback = getCategoryFallbackTranslation(language, category);

    return fallback || nameAz || nameRu || nameEn;
  }

  return nameEn || nameRu || nameAz;
}

function getOrderItemName(language: Language, item: Order["items"][number]) {
  if (language === "ru") {
    return item.nameRu || item.nameEn;
  }

  if (language === "az") {
    return item.nameAz || item.nameEn;
  }

  return item.nameEn;
}

function getDishOptionName(
  language: Language,
  option: { nameEn: string; nameRu: string; nameAz: string },
) {
  if (language === "ru") {
    return option.nameRu || option.nameEn;
  }

  if (language === "az") {
    return option.nameAz || option.nameEn;
  }

  return option.nameEn;
}

function getOrderItemOptionName(language: Language, item: Order["items"][number]) {
  if (language === "ru") {
    return item.optionNameRu || item.optionNameEn || "";
  }

  if (language === "az") {
    return item.optionNameAz || item.optionNameEn || "";
  }

  return item.optionNameEn || "";
}

const TABLE_SESSION_STORAGE_KEY = "qr-table-session";

function normalizeRadius(value: string | undefined, fallbackPx: string) {
  const parsed = Number.parseFloat(String(value ?? "").trim().replace("px", ""));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackPx;
  }

  return `${parsed}px`;
}

// Nearest vertically-scrollable element between the touch target and the sheet,
// so a sheet's drag-to-close only fires when the real scroller is at the top.
function findScrollableUnder(target: EventTarget | null, boundary: HTMLElement | null) {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== boundary) {
    if (node.scrollHeight > node.clientHeight) {
      const overflowY = window.getComputedStyle(node).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        return node;
      }
    }
    node = node.parentElement;
  }
  return boundary;
}

function withAlpha(color: string, alpha: number) {
  const normalized = color.trim().replace("#", "");
  const expanded = normalized.length === 3
    ? normalized
        .split("")
        .map((part) => `${part}${part}`)
        .join("")
    : normalized;

  if (/^[0-9a-fA-F]{6}$/.test(expanded)) {
    const r = Number.parseInt(expanded.slice(0, 2), 16);
    const g = Number.parseInt(expanded.slice(2, 4), 16);
    const b = Number.parseInt(expanded.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}

function formatCurrency(value: number, mode: "manat" | "azn" | "symbol") {
  if (mode === "azn") {
    return `AZN ${value.toFixed(2)}`;
  }

  if (mode === "symbol") {
    return `${value.toFixed(2)} ₼`;
  }

  return `${value.toFixed(2)} ₼`;
}

function isValidTableSession(value: unknown): value is {
  tableNumber: string;
  sessionToken: string;
  accessKey: string;
  restaurantSlug?: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const tableNumber = (value as { tableNumber?: unknown }).tableNumber;
  const sessionToken = (value as { sessionToken?: unknown }).sessionToken;
  const accessKey = (value as { accessKey?: unknown }).accessKey;
  const restaurantSlug = (value as { restaurantSlug?: unknown }).restaurantSlug;

  return (
    typeof tableNumber === "string" &&
    typeof sessionToken === "string" &&
    typeof accessKey === "string" &&
    (restaurantSlug === undefined || typeof restaurantSlug === "string")
  );
}

export function MenuClient({
  categories,
  restaurantId,
  restaurantSlug,
  settings,
  restaurantName,
  logoUrl,
}: Props) {
  const [liveCategories, setLiveCategories] = useState<CategoryWithDishes[]>(categories);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  // Mutable copies of server-provided (or client-fetched) restaurant data
  const [liveRestaurantId, setLiveRestaurantId] = useState<number | undefined>(restaurantId);
  const [liveSettings, setLiveSettings] = useState<Props["settings"]>(settings);
  const [liveRestaurantName, setLiveRestaurantName] = useState<string | undefined>(restaurantName);
  // True when categories haven't arrived yet (either no SSR data, or SSR fetched restaurant
  // but /api/categories cold-started and returned []).  Client useEffect refetches as fallback.
  const [isDataLoading, setIsDataLoading] = useState(categories.length === 0 && !!restaurantSlug);
  const [language, setLanguage] = useState<Language>("az");
  const [tableNumber, setTableNumber] = useState("");
  const [qrTableNumber, setQrTableNumber] = useState("");

  // A restaurant can pin the table number (e.g. a portfolio demo): prefilled and locked.
  const fixedTableNumber = (liveSettings?.lockedTableNumber ?? "").trim();
  const tableLocked = Boolean(qrTableNumber) || Boolean(fixedTableNumber);

  useEffect(() => {
    if (fixedTableNumber && !qrTableNumber) {
      setTableNumber(fixedTableNumber);
    }
  }, [fixedTableNumber, qrTableNumber]);
  const [qrSessionToken, setQrSessionToken] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selectedOptionByDish, setSelectedOptionByDish] = useState<Record<number, number | undefined>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [dishModalDishId, setDishModalDishId] = useState<number | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isDishModalVisible, setIsDishModalVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dishDragY, setDishDragY] = useState(0);
  const [isDishDragging, setIsDishDragging] = useState(false);
  const [isTableSessionExpired, setIsTableSessionExpired] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isCategoryRailPinned, setIsCategoryRailPinned] = useState(false);
  const [categoryRailHeight, setCategoryRailHeight] = useState(0);
  const [runtimeServiceMode, setRuntimeServiceMode] = useState<"lite" | "pro">(
    settings?.serviceMode === "lite" ? "lite" : "pro",
  );
  const stickyCategoriesRef = useRef<HTMLDivElement | null>(null);
  const categoryRailTriggerRef = useRef<HTMLDivElement | null>(null);
  const categoryRailAnchorRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartScrollTopRef = useRef(0);
  const touchScrollElRef = useRef<HTMLElement | null>(null);
  const dishTouchStartYRef = useRef<number | null>(null);
  const dishTouchStartScrollTopRef = useRef(0);
  const dishTouchScrollElRef = useRef<HTMLElement | null>(null);
  const basketSheetRef = useRef<HTMLElement | null>(null);
  const dishSheetRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const dishModalCloseTimerRef = useRef<number | null>(null);
  const lastClickedCategoryIdRef = useRef<number | null>(null);
  const clickScrollTimeoutRef = useRef<number | null>(null);
  const pendingCategoryScrollIdRef = useRef<number | null>(null);
  const overlayOpenRef = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const allDishes = useMemo(() => liveCategories.flatMap((category) => category.dishes), [liveCategories]);

  // Client-side fallback fetch.
  // Runs when:
  //   a) SSR had no restaurantId at all (full cold-start path), OR
  //   b) SSR got the restaurant but /api/categories timed-out / cold-started and
  //      returned [] — in that case restaurantId prop is set but categories is empty.
  useEffect(() => {
    // Nothing to do if we already have categories, or no slug to look up.
    if (categories.length > 0 || !restaurantSlug) return;

    let cancelled = false;
    const fetchInitialData = async () => {
      try {
        let rid = restaurantId;

        // Step 1 — fetch restaurant only if SSR didn't give us one.
        if (!rid) {
          const res = await fetch(`/api/public/restaurant?slug=${encodeURIComponent(restaurantSlug)}`);
          if (!res.ok || cancelled) return;
          const { restaurant } = (await res.json()) as {
            restaurant: { id: number; name: string; settings?: string | null };
          };
          if (cancelled) return;

          rid = restaurant.id;
          const parsedSettings = restaurant.settings
            ? (JSON.parse(restaurant.settings) as Props["settings"])
            : {};
          setLiveRestaurantId(rid);
          setLiveRestaurantName(restaurant.name);
          setLiveSettings(parsedSettings);
        }

        // Step 2 — always fetch categories (SSR may have returned [] on cold start).
        if (rid) {
          const catRes = await fetch(`/api/categories?restaurantId=${rid}`);
          // Treat both a non-ok response AND an empty array as "not ready yet" —
          // both happen when Prisma WASM is still cold-starting.
          const cats: CategoryWithDishes[] = catRes.ok
            ? ((await catRes.json()) as CategoryWithDishes[])
            : [];

          if (!cancelled && cats.length > 0) {
            setLiveCategories(cats);
            setActiveCategoryId(cats[0]?.id ?? null);
          } else if (!cancelled) {
            // Empty or error — wait for the Worker isolate to warm up, then retry
            // bypassing the CDN cache so we hit a live (warm) Worker.
            await new Promise<void>((resolve) => setTimeout(resolve, 2000));
            if (cancelled) return;
            const retryRes = await fetch(`/api/categories?restaurantId=${rid}`, {
              cache: "no-store",
            });
            if (!retryRes.ok || cancelled) return;
            const catsRetry = (await retryRes.json()) as CategoryWithDishes[];
            if (!cancelled) {
              setLiveCategories(catsRetry);
              setActiveCategoryId(catsRetry[0]?.id ?? null);
            }
          }
        }
      } catch {
        // silent — page still renders, just without data
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }
    };

    void fetchInitialData();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartItems = useMemo(() => {
    return Object.entries(cart).flatMap(([dishId, quantity]) => {
      const dish = allDishes.find((item) => item.id === Number(dishId));

      if (!dish) {
        return [];
      }

      const selectedOptionId = selectedOptionByDish[dish.id];
      const selectedOption = dish.options?.find((option) => option.id === selectedOptionId);
      const unitPrice = dish.price + (selectedOption?.price ?? 0);

      return [{ dish, quantity, selectedOption, unitPrice }];
    });
  }, [allDishes, cart, selectedOptionByDish]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);
  const activeOrderTotal = activeOrder?.total ?? 0;
  const basketGrandTotal = activeOrderTotal + total;

  const t = dictionary[language];
  const isLiteMode = runtimeServiceMode === "lite";
  const design = {
    brandName: liveSettings?.brandName || liveRestaurantName || t.title,
    brandSubtitle: liveSettings?.brandSubtitle || t.subtitle,
    infoNote: liveSettings?.infoNote || "",
    phone: liveSettings?.phone || "",
    instagramUrl: liveSettings?.instagramUrl || "",
    address: liveSettings?.address || "",
    logoUrl: (liveSettings?.showLogo !== false && logoUrl) ? logoUrl : "",
    showPhone: liveSettings?.showPhone !== false,
    showWhatsapp: liveSettings?.showWhatsapp !== false,
    showInstagram: liveSettings?.showInstagram !== false,
    showLocation: liveSettings?.showLocation !== false,
    primaryColor: liveSettings?.primaryColor || "#b8944f",
    accentTextColor: liveSettings?.accentTextColor || "#120e08",
    backgroundFrom: liveSettings?.backgroundFrom || "#0a0a0a",
    backgroundTo: liveSettings?.backgroundTo || "#0d0d0d",
    surfaceColor: liveSettings?.surfaceColor || "rgba(18,18,18,0.86)",
    textColor: liveSettings?.textColor || "#f0e8d0",
    mutedTextColor: liveSettings?.mutedTextColor || "#c9b28d",
    borderColor: liveSettings?.borderColor || "rgba(201,169,98,0.35)",
    buttonRadius: normalizeRadius(liveSettings?.buttonRadius, "14px"),
    cardRadius: normalizeRadius(liveSettings?.cardRadius, "20px"),
    panelColor: liveSettings?.panelColor || "#161616",
    overlayColor: liveSettings?.overlayColor || "#000000",
    controlSurfaceColor: liveSettings?.controlSurfaceColor || "#2a2a2a",
    activeChipBackground: liveSettings?.activeChipBackground || "#b8944f",
    activeChipTextColor: liveSettings?.activeChipTextColor || "#120e08",
    inactiveChipBackground: liveSettings?.inactiveChipBackground || "#1f1f1f",
    inactiveChipTextColor: liveSettings?.inactiveChipTextColor || "#f0e8d0",
    dividerColor: liveSettings?.dividerColor || "rgba(201,169,98,0.35)",
    successColor: liveSettings?.successColor || "#34d399",
    errorColor: liveSettings?.errorColor || "#f87171",
    categoryTitleColor: liveSettings?.categoryTitleColor || (liveSettings?.textColor || "#f0e8d0"),
    qtyButtonBackground: liveSettings?.qtyButtonBackground || liveSettings?.controlSurfaceColor || "#2a2a2a",
    qtyButtonTextColor: liveSettings?.qtyButtonTextColor || liveSettings?.textColor || "#f0e8d0",
    qtyButtonBorderColor: liveSettings?.qtyButtonBorderColor || liveSettings?.borderColor || "rgba(201,169,98,0.35)",
    currencyMode: liveSettings?.currencyMode || "manat",
  };

  // Photos on unless the restaurant explicitly turned them off (text-only menu).
  const showPhotos = liveSettings?.photosEnabled !== false;

  // The page <body> has a fixed dark gradient in globals.css (fine for dark
  // restaurants). Paint it with the active theme so a light restaurant doesn't
  // show a dark frame around the menu on wide screens / overscroll.
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = `linear-gradient(180deg, ${design.backgroundFrom} 0%, ${design.backgroundTo} 100%)`;
    return () => {
      document.body.style.background = previous;
    };
  }, [design.backgroundFrom, design.backgroundTo]);

  function getStatusLabel(status: Order["status"]) {
    if (status === "new") {
      return t.statusNew;
    }

    if (status === "preparing") {
      return t.statusPreparing;
    }

    if (status === "ready") {
      return t.statusReady;
    }

    return t.statusPaid;
  }

  const fetchActiveOrder = useCallback(async (currentTable: string) => {
    if (!liveRestaurantId || isLiteMode) {
      setActiveOrder(null);
      return;
    }

    const normalizedTable = currentTable.trim();

    if (!normalizedTable) {
      setActiveOrder(null);
      return;
    }

    const response = await fetch(
      `/api/orders/active?tableNumber=${encodeURIComponent(normalizedTable)}&restaurantId=${liveRestaurantId}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { order: Order | null };
    setActiveOrder(data.order);
  }, [isLiteMode, liveRestaurantId]);

  useEffect(() => {
    setRuntimeServiceMode(liveSettings?.serviceMode === "lite" ? "lite" : "pro");
  }, [liveSettings?.serviceMode]);

  useEffect(() => {
    const restoreStoredSession = () => {
      const storedSession = window.localStorage.getItem(TABLE_SESSION_STORAGE_KEY);

      if (!storedSession) {
        return false;
      }

      try {
        const parsed: unknown = JSON.parse(storedSession);

        if (!isValidTableSession(parsed)) {
          window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
          setIsTableSessionExpired(true);
          return false;
        }

        if (restaurantSlug && parsed.restaurantSlug && parsed.restaurantSlug !== restaurantSlug) {
          window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
          return false;
        }

        setQrTableNumber(parsed.tableNumber);
        setTableNumber(parsed.tableNumber);
        setQrSessionToken(parsed.sessionToken);
        setIsTableSessionExpired(false);
        return true;
      } catch {
        window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
        return false;
      }
    };

    const bootstrapQrSession = async (tableFromQr: string, accessKeyFromQr: string) => {
      const response = await fetch("/api/qr/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableFromQr,
          accessKey: accessKeyFromQr,
          restaurantSlug,
        }),
      });

      const data = (await response.json()) as { tableNumber?: string; sessionToken?: string; error?: string };

      if (!response.ok || !data.sessionToken || !data.tableNumber) {
        setIsTableSessionExpired(true);
        setError(t.qrInvalidError);
        return;
      }

      const sessionPayload = {
        tableNumber: data.tableNumber,
        sessionToken: data.sessionToken,
        accessKey: accessKeyFromQr,
        restaurantSlug,
      };
      window.localStorage.setItem(TABLE_SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));

      setQrTableNumber(data.tableNumber);
      setTableNumber(data.tableNumber);
      setQrSessionToken(data.sessionToken);
      setIsTableSessionExpired(false);

      // Lock the active table session and remove editable QR params from URL.
      window.history.replaceState({}, "", window.location.pathname);
    };

    const searchParams = new URLSearchParams(window.location.search);
    const tableFromQr = searchParams.get("table")?.trim() || "";
    const accessKeyFromQr = searchParams.get("ak")?.trim() || "";

    if (!tableFromQr || !accessKeyFromQr) {
      restoreStoredSession();
      return;
    }

    void bootstrapQrSession(tableFromQr, accessKeyFromQr);
  }, [restaurantSlug, t.qrInvalidError]);

  useEffect(() => {
    if (!qrTableNumber) {
      return;
    }

    const syncSession = () => {
      const storedSession = window.localStorage.getItem(TABLE_SESSION_STORAGE_KEY);

      if (!storedSession) {
        setQrTableNumber("");
        setTableNumber("");
        setQrSessionToken("");
        setActiveOrder(null);
        setIsTableSessionExpired(true);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(storedSession);

        if (!isValidTableSession(parsed)) {
          window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
          setQrTableNumber("");
          setTableNumber("");
          setQrSessionToken("");
          setActiveOrder(null);
          setIsTableSessionExpired(true);
          return;
        }

        setQrSessionToken(parsed.sessionToken);

        setIsTableSessionExpired(false);
      } catch {
        window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
      }
    };

    syncSession();
    const sessionSyncIntervalMs = isPageVisible ? 30000 : 90000;
    const interval = window.setInterval(syncSession, sessionSyncIntervalMs);

    return () => window.clearInterval(interval);
  }, [isPageVisible, qrTableNumber]);

  useEffect(() => {
    setLiveCategories(categories);
  }, [categories]);

  useEffect(() => {
    setActiveCategoryId((previous) => {
      if (liveCategories.length === 0) {
        return null;
      }

      if (previous !== null && liveCategories.some((category) => category.id === previous)) {
        return previous;
      }

      return liveCategories[0]?.id ?? null;
    });
  }, [liveCategories]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updatePinnedState = () => {
      const trigger = categoryRailTriggerRef.current;
      const anchor = categoryRailAnchorRef.current;
      const rail = document.getElementById("sticky-category-rail");
      if (!trigger || !anchor || !rail) {
        return;
      }

      const nextHeight = Math.round(rail.getBoundingClientRect().height);
      setCategoryRailHeight((prev) => (prev === nextHeight ? prev : nextHeight));

      const shouldPin = trigger.getBoundingClientRect().top <= 0;
      setIsCategoryRailPinned((prev) => (prev === shouldPin ? prev : shouldPin));
    };

    updatePinnedState();
    window.addEventListener("scroll", updatePinnedState, { passive: true });
    window.addEventListener("resize", updatePinnedState);

    return () => {
      window.removeEventListener("scroll", updatePinnedState);
      window.removeEventListener("resize", updatePinnedState);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || liveCategories.length === 0) {
      return;
    }

    const categoryIds = liveCategories.map((category) => category.id);

    const updateActiveCategory = () => {
      // Freeze the highlight while an overlay is open (the body gets position:fixed,
      // which would otherwise recompute the active category to the wrong section).
      if (overlayOpenRef.current) {
        return;
      }

      const stickyRail = document.getElementById("sticky-category-rail");
      const stickyHeight = stickyRail?.getBoundingClientRect().height ?? 0;
      const stickyOffset = Math.max(stickyHeight + 16, 0);
      let currentId = categoryIds[0];

      for (const categoryId of categoryIds) {
        const element = document.getElementById(`category-${categoryId}`);
        if (!element) {
          continue;
        }

        if (element.getBoundingClientRect().top - stickyOffset <= 0) {
          currentId = categoryId;
        } else {
          break;
        }
      }

      setActiveCategoryId((prev) => {
        const clicked = lastClickedCategoryIdRef.current;
        if (clicked !== null) {
          // Keep the tapped category highlighted through the whole smooth scroll;
          // only hand control back once the page has actually reached it.
          if (currentId === clicked) {
            lastClickedCategoryIdRef.current = null;
            return clicked;
          }
          return clicked;
        }

        return prev === currentId ? prev : currentId;
      });
    };

    let ticking = false;
    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(() => {
        updateActiveCategory();
        ticking = false;
      });
    };

    updateActiveCategory();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [liveCategories]);

  useEffect(() => {
    if (activeCategoryId === null) {
      return;
    }

    const rail = stickyCategoriesRef.current;
    if (!rail) {
      return;
    }

    const activeButton = rail.querySelector(`[data-category-id="${activeCategoryId}"]`) as HTMLElement | null;
    if (!activeButton) {
      return;
    }

    const railRect = rail.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const margin = 28;

    // Only nudge the rail when the active chip has reached an edge. Re-centring it
    // on every scroll step made the top bar jump around distractingly.
    let delta = 0;
    if (buttonRect.left < railRect.left + margin) {
      delta = buttonRect.left - railRect.left - margin;
    } else if (buttonRect.right > railRect.right - margin) {
      delta = buttonRect.right - railRect.right + margin;
    }

    if (delta !== 0) {
      rail.scrollBy({ left: delta, behavior: "smooth" });
    }
  }, [activeCategoryId]);

  useEffect(() => {
    if (isCategoryMenuOpen) {
      return;
    }

    const pendingId = pendingCategoryScrollIdRef.current;
    if (pendingId === null) {
      return;
    }

    pendingCategoryScrollIdRef.current = null;
    window.setTimeout(() => {
      scrollToCategory(pendingId);
    }, 30);
  }, [isCategoryMenuOpen]);

  // Categories are loaded from server-rendered props and refreshed only after full page reload.

  useEffect(() => {
    const isAnyOverlayOpen = isBasketOpen || isDishModalOpen || isCategoryMenuOpen;
    overlayOpenRef.current = isAnyOverlayOpen;

    if (!isAnyOverlayOpen) {
      return;
    }

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.left = previousBodyStyles.left;
      document.body.style.right = previousBodyStyles.right;
      document.body.style.width = previousBodyStyles.width;
      document.body.style.overflow = previousBodyStyles.overflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" as ScrollBehavior });
    };
  }, [isBasketOpen, isDishModalOpen, isCategoryMenuOpen]);

  useEffect(() => {
    if (!isBasketOpen || (!message && !error)) {
      return;
    }

    window.requestAnimationFrame(() => {
      const sheet = basketSheetRef.current;
      if (!sheet) {
        return;
      }

      sheet.scrollTo({
        top: sheet.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [error, isBasketOpen, message]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }

      if (dishModalCloseTimerRef.current) {
        window.clearTimeout(dishModalCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isLiteMode) {
      setActiveOrder(null);
      return;
    }

    const normalized = tableNumber.trim();

    if (!normalized) {
      setActiveOrder(null);
      return;
    }

    void fetchActiveOrder(normalized);

    // Poll only when the tab is visible; stop entirely in the background
    // to save Cloudflare request quota (was 10 s active / 30 s hidden).
    if (!isPageVisible) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchActiveOrder(normalized);
    }, 60000); // 60 s when visible

    return () => window.clearInterval(interval);
  }, [fetchActiveOrder, isLiteMode, isPageVisible, tableNumber]);

  function scrollToCategory(categoryId: number) {
    const element = document.getElementById(`category-${categoryId}`);
    if (!element) {
      return;
    }

    const stickyRail = document.getElementById("sticky-category-rail");
    const stickyHeight = stickyRail?.getBoundingClientRect().height ?? 0;
    const stickyOffset = Math.max(stickyHeight + 14, 0);
    const targetTop = element.getBoundingClientRect().top + window.scrollY - stickyOffset;
    lastClickedCategoryIdRef.current = categoryId;
    setActiveCategoryId(categoryId);

    // Safety net: release the highlight lock even if a short final section never
    // scrolls all the way under the sticky rail.
    if (clickScrollTimeoutRef.current) {
      window.clearTimeout(clickScrollTimeoutRef.current);
    }
    clickScrollTimeoutRef.current = window.setTimeout(() => {
      lastClickedCategoryIdRef.current = null;
    }, 1200);

    window.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
  }

  function getSelectedDishOption(dish: CategoryWithDishes["dishes"][number]) {
    const selectedOptionId = selectedOptionByDish[dish.id];
    return dish.options?.find((option) => option.id === selectedOptionId);
  }

  function selectDishOption(dishId: number, optionId: number) {
    setSelectedOptionByDish((prev) => ({
      ...prev,
      [dishId]: optionId,
    }));
  }

  function getSelectedQty(dishId: number) {
    return selectedQuantities[dishId] ?? 1;
  }

  function updateSelectedQty(dishId: number, delta: number) {
    setSelectedQuantities((prev) => {
      const current = prev[dishId] ?? 1;
      const next = Math.max(1, current + delta);

      return {
        ...prev,
        [dishId]: next,
      };
    });
  }

  function addToCart(dishId: number) {
    const dish = allDishes.find((item) => item.id === dishId);
    if (!dish) {
      return;
    }

    if (dish.options && dish.options.length > 0 && !selectedOptionByDish[dishId]) {
      setError(t.requiredOptionError);
      openDishModal(dishId);
      return;
    }

    const qty = getSelectedQty(dishId);

    setCart((prev) => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + qty,
    }));
  }

  function openDishModal(dishId: number) {
    setDishModalDishId(dishId);
    setIsDishModalOpen(true);

    window.requestAnimationFrame(() => {
      setIsDishModalVisible(true);
    });
  }

  function closeDishModal() {
    setIsDishDragging(false);
    setDishDragY(0);
    setIsDishModalVisible(false);

    if (dishModalCloseTimerRef.current) {
      window.clearTimeout(dishModalCloseTimerRef.current);
    }

    dishModalCloseTimerRef.current = window.setTimeout(() => {
      setIsDishModalOpen(false);
      setDishModalDishId(null);
      dishModalCloseTimerRef.current = null;
    }, 260);
  }

  function updateCartItemQty(dishId: number, delta: number) {
    let removed = false;

    setCart((prev) => {
      const current = prev[dishId] || 0;
      const next = current + delta;

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[dishId];
        removed = true;
        return copy;
      }

      return {
        ...prev,
        [dishId]: next,
      };
    });

    if (removed) {
      setSelectedOptionByDish((optionMap) => {
        const nextOptions = { ...optionMap };
        delete nextOptions[dishId];
        return nextOptions;
      });
    }
  }

  function removeFromCart(dishId: number) {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[dishId];
      return copy;
    });

    setSelectedOptionByDish((prev) => {
      const next = { ...prev };
      delete next[dishId];
      return next;
    });
  }

  function openBasket() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsBasketOpen(true);
    setDragY(0);

    window.requestAnimationFrame(() => {
      setIsBasketVisible(true);
    });
  }

  function closeBasket() {
    setIsDragging(false);
    setDragY(0);
    setIsBasketVisible(false);

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsBasketOpen(false);
      closeTimerRef.current = null;
    }, 320);
  }

  function onSheetTouchStart(event: React.TouchEvent<HTMLElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    // The basket has an inner scrollable list; only drag-to-close when the actual
    // scroller under the finger is at the top, otherwise swiping the items closed it.
    const scroller = findScrollableUnder(event.target, basketSheetRef.current);
    touchScrollElRef.current = scroller;
    touchStartScrollTopRef.current = scroller?.scrollTop ?? 0;
    setIsDragging(false);
    setDragY(0);
  }

  function onSheetTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (touchStartYRef.current === null) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const nextDrag = Math.max(0, currentY - touchStartYRef.current);

    if (nextDrag <= 0) {
      return;
    }

    const scroller = touchScrollElRef.current;
    const atTop = (scroller?.scrollTop ?? 0) <= 0 && touchStartScrollTopRef.current <= 0;

    if (!atTop) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    setIsDragging(true);
    setDragY(nextDrag);
  }

  function onSheetTouchEnd() {
    const shouldClose = isDragging && dragY > 90;
    setIsDragging(false);
    setDragY(0);
    touchStartYRef.current = null;
    touchStartScrollTopRef.current = 0;

    if (shouldClose) {
      closeBasket();
    }
  }

  function onDishSheetTouchStart(event: React.TouchEvent<HTMLElement>) {
    dishTouchStartYRef.current = event.touches[0]?.clientY ?? null;
    const scroller = findScrollableUnder(event.target, dishSheetRef.current);
    dishTouchScrollElRef.current = scroller;
    dishTouchStartScrollTopRef.current = scroller?.scrollTop ?? 0;
    setIsDishDragging(false);
    setDishDragY(0);
  }

  function onDishSheetTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (dishTouchStartYRef.current === null) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? dishTouchStartYRef.current;
    const nextDrag = Math.max(0, currentY - dishTouchStartYRef.current);

    if (nextDrag <= 0) {
      return;
    }

    const scroller = dishTouchScrollElRef.current;
    const atTop = (scroller?.scrollTop ?? 0) <= 0 && dishTouchStartScrollTopRef.current <= 0;

    if (!atTop) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    setIsDishDragging(true);
    setDishDragY(nextDrag);
  }

  function onDishSheetTouchEnd() {
    const shouldClose = isDishDragging && dishDragY > 90;
    setIsDishDragging(false);
    setDishDragY(0);
    dishTouchStartYRef.current = null;
    dishTouchStartScrollTopRef.current = 0;

    if (shouldClose) {
      closeDishModal();
    }
  }

  async function placeOrder() {
    if (isLiteMode) {
      return;
    }

    if (!liveRestaurantId) {
      setError(t.missingRestaurantContext);
      return;
    }

    if (cartItems.length === 0) {
      setError(t.chooseItemsError);
      return;
    }

    if (!tableNumber.trim()) {
      setError(t.tableRequiredError);
      return;
    }

    if (!qrSessionToken) {
      setError(t.qrRequiredError);
      return;
    }

    if (isTableSessionExpired) {
      setError(t.tableSessionExpired);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: tableNumber.trim(),
          qrToken: qrSessionToken,
          restaurantId: liveRestaurantId,
          items: cartItems.map((item) => ({
            dishId: item.dish.id,
            quantity: item.quantity,
            optionId: item.selectedOption?.id,
          })),
        }),
      });

      const data = (await response.json()) as {
        order?: Order;
        mergedIntoExisting?: boolean;
        error?: string;
      };

      if (!response.ok) {
        const serverError = (data?.error || "").toLowerCase();

        if (serverError.includes("scan") || serverError.includes("session")) {
          window.localStorage.removeItem(TABLE_SESSION_STORAGE_KEY);
          setQrTableNumber("");
          setTableNumber("");
          setQrSessionToken("");
          setIsTableSessionExpired(true);
        }

        throw new Error(data?.error || t.failed);
      }

      const nextOrder = data.order;

      if (!nextOrder) {
        throw new Error(t.failed);
      }

      setMessage(
        `${data.mergedIntoExisting ? t.mergedOrderSuccess : t.newOrderSuccess} #${nextOrder.id}.`,
      );
      setActiveOrder(nextOrder);
      setCart({});
      setSelectedOptionByDish({});
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : t.failed);
    } finally {
      setLoading(false);
    }
  }

  async function callWaiter() {
    if (isLiteMode) {
      return;
    }

    if (!liveRestaurantId) {
      setError(t.missingRestaurantContext);
      return;
    }

    const effectiveTable = qrTableNumber || tableNumber;
    if (!effectiveTable.trim()) {
      setError(t.tableRequiredError);
      return;
    }

    setCallingWaiter(true);
    setError("");

    try {
      const response = await fetch("/api/waiter-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: effectiveTable.trim(), restaurantId: liveRestaurantId }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok) {
        throw new Error(data?.error || t.callWaiterFailed);
      }

      setWaiterCalled(true);
      setMessage(t.callWaiterSuccess);
      setTimeout(() => setWaiterCalled(false), 30000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.callWaiterFailed);
    } finally {
      setCallingWaiter(false);
    }
  }

  function renderBasketContent() {
    return (
      <>
        <div className="mb-4 flex items-center gap-2" style={{ color: design.textColor }}>
          <ShoppingBag size={20} style={{ color: design.primaryColor }} />
          <h2 className="font-serif text-2xl">{t.basket}</h2>
        </div>

        {/* Table number is only needed to place an online order. Lite mode has no
            ordering (and often one shared QR for all tables), so hide it there. */}
        {!isLiteMode ? (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium" style={{ color: design.mutedTextColor }}>{t.tableNumber}</label>
            <input
              value={tableNumber}
              onChange={(event) => {
                if (tableLocked) {
                  return;
                }

                setTableNumber(event.target.value);
              }}
              placeholder="12"
              readOnly={tableLocked}
              disabled={tableLocked}
              className="min-h-11 w-full rounded-xl border px-3 py-2 outline-none ring-0 transition"
              style={{
                borderColor: design.borderColor,
                background: design.controlSurfaceColor,
                color: design.textColor,
              }}
            />
            {qrTableNumber ? <p className="mt-2 text-xs" style={{ color: design.mutedTextColor }}>{t.qrTableDetected}: {qrTableNumber}</p> : null}
            {isTableSessionExpired ? <p className="mt-2 text-xs" style={{ color: design.errorColor }}>{t.tableSessionExpired}</p> : null}
          </div>
        ) : null}

        {activeOrder ? (
          <div className="mb-4 rounded-xl border p-3" style={{ borderColor: design.borderColor, background: design.panelColor }}>
            <p className="text-sm font-semibold" style={{ color: design.textColor }}>
              {t.activeOrder}: #{activeOrder.id}
            </p>
            <p className="mt-1 text-xs" style={{ color: design.mutedTextColor }}>
              {t.status}: {getStatusLabel(activeOrder.status)}
            </p>
            <div className="mt-2 space-y-1">
              {activeOrder.items.map((item) => (
                <p key={item.id} className="text-xs" style={{ color: design.textColor }}>
                  {getOrderItemName(language, item)}
                  {getOrderItemOptionName(language, item) ? ` (${getOrderItemOptionName(language, item)})` : ""}
                  {` x${item.quantity} (${formatCurrency(item.price, design.currencyMode)})`}
                </p>
              ))}
            </div>
            <p className="mt-2 text-sm font-medium" style={{ color: design.textColor }}>{t.total}: {formatCurrency(activeOrder.total, design.currencyMode)}</p>
          </div>
        ) : null}

        <div className="mb-4 max-h-72 space-y-3 overflow-auto">
          {cartItems.length === 0 ? (
            <p className="text-sm" style={{ color: design.mutedTextColor }}>{t.empty}</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.dish.id} className="rounded-xl border p-3" style={{ borderColor: design.borderColor, background: design.panelColor }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium" style={{ color: design.textColor }}>{getDishName(language, item.dish)}</p>
                    {item.selectedOption ? (
                      <p className="text-xs" style={{ color: design.mutedTextColor }}>
                        {t.optionLabel}: {getDishOptionName(language, item.selectedOption)}
                      </p>
                    ) : null}
                    <p className="text-xs" style={{ color: design.mutedTextColor }}>{item.quantity} x {formatCurrency(item.unitPrice, design.currencyMode)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.dish.id)}
                    className="min-h-9 min-w-9 rounded-lg border"
                    style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.errorColor }}
                    aria-label={t.removeItemAria}
                  >
                    <Trash2 size={14} className="mx-auto" />
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCartItemQty(item.dish.id, -1)}
                    className="min-h-9 min-w-9 rounded-lg border"
                    style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                    aria-label={t.decreaseQtyAria}
                  >
                    <Minus size={14} className="mx-auto" />
                  </button>
                  <span className="min-w-8 text-center text-sm" style={{ color: design.textColor }}>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateCartItemQty(item.dish.id, 1)}
                    className="min-h-9 min-w-9 rounded-lg border"
                    style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                    aria-label={t.increaseQtyAria}
                  >
                    <Plus size={14} className="mx-auto" />
                  </button>
                </div>

                {item.dish.options && item.dish.options.length > 0 ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs" style={{ color: design.mutedTextColor }}>
                      {t.chooseOption}
                    </label>
                    <select
                      value={selectedOptionByDish[item.dish.id] ?? ""}
                      onChange={(event) => selectDishOption(item.dish.id, Number(event.target.value))}
                      className="min-h-9 w-full rounded-lg border px-2 py-1 text-xs"
                      style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                    >
                      <option value="" disabled>{t.chooseOption}</option>
                      {item.dish.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {getDishOptionName(language, option)} (+{formatCurrency(option.price, design.currencyMode)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="mb-4 flex items-center justify-between border-t pt-4" style={{ borderColor: design.dividerColor, color: design.textColor }}>
          <span className="font-medium">{t.total}</span>
          <strong className="font-sans text-2xl font-bold tracking-tight" style={{ color: design.primaryColor }}>{formatCurrency(basketGrandTotal, design.currencyMode)}</strong>
        </div>

        <div className="space-y-2">
          {!isLiteMode ? (
            <button
              type="button"
              onClick={placeOrder}
              disabled={loading}
              className="min-h-12 w-full px-4 py-3 font-medium transition hover:opacity-90 disabled:opacity-60"
              style={{
                borderRadius: design.buttonRadius,
                backgroundColor: design.primaryColor,
                color: design.accentTextColor,
              }}
            >
              {loading ? "..." : t.placeOrder}
            </button>
          ) : null}
        </div>

        {message ? <p className="mt-3 text-sm" style={{ color: design.successColor }}>{message}</p> : null}
        {error ? <p className="mt-3 text-sm" style={{ color: design.errorColor }}>{error}</p> : null}
      </>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-7xl px-3 py-5 pb-28 sm:px-6 sm:py-8 sm:pb-8 lg:px-8"
      style={{
        color: design.textColor,
        backgroundImage: `linear-gradient(180deg, ${design.backgroundFrom} 0%, ${design.backgroundTo} 100%)`,
        borderRadius: "26px",
        // Theme the loading skeleton with the restaurant's own accent colour.
        ["--skeleton-base" as string]: withAlpha(design.primaryColor, 0.1),
        ["--skeleton-shine" as string]: withAlpha(design.primaryColor, 0.18),
      } as React.CSSProperties}
    >
      {isDataLoading ? (
        <div aria-hidden="true">
          {/* Header placeholder */}
          <div
            className="mb-6 rounded-2xl border p-4 sm:mb-10 sm:rounded-3xl sm:p-10"
            style={{ borderColor: design.borderColor, background: design.surfaceColor }}
          >
            <div className="skeleton h-9 w-2/3 max-w-sm rounded-lg sm:h-12" />
            <div className="skeleton mt-4 h-4 w-1/2 max-w-md rounded" />
          </div>

          {/* Category chips placeholder */}
          <div className="mb-8 flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="skeleton h-12 w-28 shrink-0"
                style={{ borderRadius: design.buttonRadius }}
              />
            ))}
          </div>

          {/* Dish cards placeholder */}
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden border"
                style={{ borderRadius: design.cardRadius, borderColor: design.borderColor, background: design.surfaceColor }}
              >
                <div className="skeleton aspect-[21/11] w-full" />
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="skeleton h-6 w-1/2 rounded" />
                    <div className="skeleton h-7 w-16 rounded-full" />
                  </div>
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="skeleton h-11 w-11 rounded-lg" />
                    <div className="skeleton h-11 w-11 rounded-lg" />
                    <div className="skeleton ml-auto h-11 w-20" style={{ borderRadius: design.buttonRadius }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {!isDataLoading ? (<>
      <header
        className="fade-up mb-6 rounded-2xl border p-4 shadow-2xl sm:mb-10 sm:rounded-3xl sm:p-10 relative overflow-hidden"
        style={{
          borderColor: design.borderColor,
          background: `linear-gradient(135deg, ${design.backgroundTo} 0%, ${design.surfaceColor} 100%)`,
        }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at top right, ${design.primaryColor}33 0%, transparent 50%)` }} />
        <div className="relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-4">
                {design.logoUrl ? (
                  <Image
                    src={design.logoUrl}
                    alt={design.brandName}
                    width={72}
                    height={72}
                    className="shrink-0 rounded-full object-cover"
                    style={{ width: 64, height: 64, border: `1px solid ${design.borderColor}` }}
                  />
                ) : null}
                <h1 className="font-serif text-3xl sm:text-5xl" style={{ color: design.textColor }}>{design.brandName}</h1>
              </div>
              <p className="mt-3 max-w-2xl" style={{ color: design.mutedTextColor }}>{design.brandSubtitle}</p>
              {design.infoNote ? (
                <p className="mt-2 max-w-2xl text-sm" style={{ color: design.mutedTextColor, opacity: 0.85 }}>{design.infoNote}</p>
              ) : null}

              {((design.phone && (design.showPhone || design.showWhatsapp)) || (design.instagramUrl && design.showInstagram) || (design.address && design.showLocation)) ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {design.phone && design.showPhone ? (
                    <a
                      href={`tel:${design.phone.replace(/[^0-9+]/g, "")}`}
                      className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95"
                      style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                    >
                      <Phone size={14} style={{ color: design.primaryColor }} />
                      <span>{design.phone}</span>
                    </a>
                  ) : null}
                  {design.phone && design.showWhatsapp ? (
                    <a
                      href={`https://wa.me/${design.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="WhatsApp"
                      className="flex min-h-8 min-w-8 items-center justify-center rounded-full border px-2.5 py-1.5 transition active:scale-95"
                      style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.34M12.05 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.5 6.6 2.07 12.05 2.07a9.83 9.83 0 0 1 6.99 2.9 9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88M20.46 3.5A11.82 11.82 0 0 0 12.05.14C5.5.14.16 5.48.16 12.04c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.49-8.4"/></svg>
                    </a>
                  ) : null}
                  {design.instagramUrl && design.showInstagram ? (
                    <a
                      href={design.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="flex min-h-8 min-w-8 items-center justify-center rounded-full border px-2.5 py-1.5 transition active:scale-95"
                      style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                    </a>
                  ) : null}
                  {design.address && design.showLocation ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(design.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Location"
                      className="flex min-h-8 min-w-8 items-center justify-center rounded-full border px-2.5 py-1.5 transition active:scale-95"
                      style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                    >
                      <MapPin size={16} style={{ color: design.primaryColor }} />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">

              {!isLiteMode ? (
                <button
                  type="button"
                  onClick={callWaiter}
                  disabled={callingWaiter || waiterCalled}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderRadius: "100px",
                    background: waiterCalled ? "rgba(16,185,129,0.12)" : design.primaryColor,
                    color: waiterCalled ? "#34d399" : design.accentTextColor,
                    border: waiterCalled ? "1.5px solid rgba(16,185,129,0.4)" : "none",
                    minHeight: "40px",
                  }}
                >
                  {waiterCalled ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <span>{t.waiterOnTheWay}</span>
                    </>
                  ) : (
                    <>
                      <Bell size={15} />
                      <span>{t.callWaiter}</span>
                    </>
                  )}
                </button>
              ) : null}

              <div className="flex rounded-full border p-1" style={{ borderColor: design.borderColor, background: design.controlSurfaceColor }}>
                {(["az", "ru", "en"] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className="min-h-9 flex-1 rounded-full px-3 py-1.5 text-xs transition sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                    style={
                      language === lang
                        ? { background: design.activeChipBackground, color: design.activeChipTextColor }
                        : { background: design.inactiveChipBackground, color: design.inactiveChipTextColor }
                    }
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </header>

      <div ref={categoryRailTriggerRef} className="h-px" />

      <div
        ref={categoryRailAnchorRef}
        className="mb-4"
        style={isCategoryRailPinned ? { minHeight: `${Math.max(categoryRailHeight, 88)}px` } : undefined}
      >
        <div
          className={isCategoryRailPinned ? "fixed inset-x-0 top-0 z-40 px-3 pt-0 sm:px-6 lg:px-8" : ""}
          style={isCategoryRailPinned ? { background: withAlpha(design.backgroundTo, 0.92) } : undefined}
        >
          <div
            id="sticky-category-rail"
            className="-mx-1 rounded-2xl border p-3 backdrop-blur"
            style={{
              borderColor: design.borderColor,
              background: withAlpha(design.panelColor, 0.9),
            }}
          >
            <p className="mb-3 px-1 text-[13px] uppercase tracking-[0.3em] sm:text-sm sm:tracking-[0.35em]" style={{ color: design.mutedTextColor }}>
              {t.categories}
            </p>
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(true)}
                className="min-h-10 min-w-10 shrink-0 rounded-lg border"
                style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                aria-label={t.browseCategories}
              >
                <Menu size={17} className="mx-auto" />
              </button>
              <div ref={stickyCategoriesRef} className="menu-chip-scroll flex flex-1 items-center gap-3 overflow-x-auto pb-1">
                {liveCategories.map((category) => {
                  const isActive = activeCategoryId === category.id;
                  return (
                    <button
                      key={`sticky-${category.id}`}
                      data-category-id={category.id}
                      type="button"
                      onClick={() => scrollToCategory(category.id)}
                      className="min-h-14 shrink-0 whitespace-nowrap px-5 py-3 text-sm transition hover:opacity-90 sm:min-h-16 sm:px-6 sm:text-base"
                      style={{
                        borderRadius: design.buttonRadius,
                        border: `1px solid ${design.borderColor}`,
                        background: isActive ? design.activeChipBackground : design.surfaceColor,
                        color: isActive ? design.activeChipTextColor : design.mutedTextColor,
                      }}
                    >
                      {getCategoryName(language, category)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <section className="space-y-8">

          {liveCategories.map((category) => (
            <div id={`category-${category.id}`} key={category.id} className="scroll-mt-28 sm:scroll-mt-32 lg:scroll-mt-24">
              <h2 className="mb-4 border-b pb-3 font-serif text-[28px]" style={{ borderColor: design.dividerColor, color: design.categoryTitleColor }}>
                {getCategoryName(language, category)}
              </h2>

              {category.dishes.length === 0 ? (
                <div className="rounded-xl border p-4 text-sm" style={{ borderColor: design.borderColor, color: design.mutedTextColor, background: withAlpha(design.surfaceColor, 0.7) }}>
                  {t.noItemsInCategory}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {category.dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={{
                      name: getDishName(language, dish),
                      description: getDishDescription(language, dish),
                      price: dish.price,
                      imageUrl: dish.imageUrl,
                      imagePositionX: dish.imagePositionX,
                      imagePositionY: dish.imagePositionY,
                    }}
                    design={design}
                    addLabel={t.add}
                    showPhoto={showPhotos}
                    onOpen={() => openDishModal(dish.id)}
                    onAdd={() => addToCart(dish.id)}
                    optionsSlot={
                      dish.options && dish.options.length > 0 ? (
                        <>
                          <label className="mb-1 block text-xs" style={{ color: design.mutedTextColor }}>
                            {t.chooseOption}
                          </label>
                          <select
                            value={selectedOptionByDish[dish.id] ?? ""}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => selectDishOption(dish.id, Number(event.target.value))}
                            className="min-h-10 w-full rounded-lg border px-2 py-1 text-sm"
                            style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                          >
                            <option value="" disabled>{t.chooseOption}</option>
                            {dish.options.map((option) => (
                              <option key={option.id} value={option.id}>
                                {getDishOptionName(language, option)} (+{formatCurrency(option.price, design.currencyMode)})
                              </option>
                            ))}
                          </select>
                        </>
                      ) : null
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside
          className="fade-up hidden h-fit rounded-2xl border p-4 shadow-lg sm:p-5 lg:sticky lg:top-6 lg:block backdrop-blur-sm"
          style={{ borderColor: design.borderColor, background: design.panelColor }}
        >
          {renderBasketContent()}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur-sm lg:hidden" style={{ borderColor: design.borderColor, background: design.panelColor }}>
        <button
          type="button"
          onClick={openBasket}
          className="flex min-h-12 w-full items-center justify-between px-4 py-3"
          style={{
            borderRadius: design.buttonRadius,
            backgroundColor: design.primaryColor,
            color: design.accentTextColor,
          }}
        >
          <span className="font-medium">{t.viewBasket}</span>
          <span className="font-sans text-lg font-bold tracking-tight">{formatCurrency(basketGrandTotal, design.currencyMode)}</span>
        </button>
      </div>

      {isBasketOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className={`absolute inset-0 transition-opacity duration-300 ${isBasketVisible ? "opacity-100" : "opacity-0"}`}
            style={{ background: withAlpha(design.overlayColor, 0.6) }}
            onClick={closeBasket}
            aria-label={t.close}
          />

          <section
            className={`absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t p-4 shadow-2xl${
              isDragging ? "" : " transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            }`}
            style={{ borderColor: design.borderColor, background: design.panelColor,
              // Closed = fully off-screen (100% of the sheet height). A fixed 480px
              // left a tall sheet's header ("Your basket") visible during the close.
              transform: `translate3d(0, ${isDragging ? `${dragY}px` : isBasketVisible ? "0px" : "100%"}, 0)`,
              willChange: "transform",
            }}
            ref={(node) => {
              basketSheetRef.current = node;
            }}
          >
            {/* Drag-to-close zone: grip + header only, so scrolling the items or
                touching the table field never dismisses the sheet. */}
            <div
              className="-mx-4 -mt-4 touch-none px-4 pt-4"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full" style={{ background: design.primaryColor }} />
              <div className="mb-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={closeBasket}
                  className="min-h-10 rounded-lg border px-3 text-sm"
                  style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                >
                  {t.close}
                </button>
              </div>
            </div>
            {renderBasketContent()}
          </section>
        </div>
      ) : null}

      {isCategoryMenuOpen ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: withAlpha(design.overlayColor, 0.64) }}
            onClick={() => setIsCategoryMenuOpen(false)}
            aria-label={t.close}
          />
          <aside
            className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden border-r p-4"
            style={{ borderColor: design.borderColor, background: design.panelColor }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-2xl" style={{ color: design.textColor }}>{t.categories}</h3>
              <button
                type="button"
                onClick={() => setIsCategoryMenuOpen(false)}
                className="min-h-10 min-w-10 rounded-lg border"
                style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                aria-label={t.close}
              >
                <X size={16} className="mx-auto" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-8 pr-1">
              {liveCategories.map((category) => {
                const isActive = activeCategoryId === category.id;

                return (
                  <button
                    key={`menu-${category.id}`}
                    type="button"
                    onClick={() => {
                      pendingCategoryScrollIdRef.current = category.id;
                      setIsCategoryMenuOpen(false);
                    }}
                    className="w-full rounded-xl border px-4 py-3 text-left"
                    style={{
                      borderColor: design.borderColor,
                      background: isActive ? design.activeChipBackground : design.controlSurfaceColor,
                      color: isActive ? design.activeChipTextColor : design.textColor,
                    }}
                  >
                    {getCategoryName(language, category)}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}

      {isDishModalOpen && dishModalDishId !== null ? (
        <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true">
          <button
            type="button"
            className={`absolute inset-0 transition-opacity duration-300 ${isDishModalVisible ? "opacity-100" : "opacity-0"}`}
            style={{ background: withAlpha(design.overlayColor, 0.7) }}
            onClick={closeDishModal}
            aria-label={t.close}
          />

          {(() => {
            const dish = allDishes.find((item) => item.id === dishModalDishId);
            if (!dish) {
              return null;
            }

            const selectedOption = getSelectedDishOption(dish);
            const finalPrice = dish.price + (selectedOption?.price ?? 0);

            return (
              <section
                className={`absolute inset-x-0 bottom-0 max-h-[95vh] overflow-y-auto rounded-t-3xl border-t pb-6 shadow-2xl${
                  isDishDragging ? "" : " transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                }`}
                style={{
                  borderColor: design.borderColor,
                  background: design.panelColor,
                  transform: `translate3d(0, ${isDishDragging ? `${dishDragY}px` : isDishModalVisible ? "0px" : "100%"}, 0)`,
                  willChange: "transform",
                }}
                ref={(node) => {
                  dishSheetRef.current = node;
                }}
              >
                <div
                  className="touch-none pb-1 pt-2"
                  onTouchStart={onDishSheetTouchStart}
                  onTouchMove={onDishSheetTouchMove}
                  onTouchEnd={onDishSheetTouchEnd}
                >
                  <div className="mx-auto mb-2 h-1.5 w-14 rounded-full" style={{ background: design.mutedTextColor }} />
                </div>
                <button
                  type="button"
                  onClick={closeDishModal}
                  className="absolute right-4 top-4 z-20 min-h-10 min-w-10 rounded-full border"
                  style={{ borderColor: design.borderColor, background: withAlpha(design.controlSurfaceColor, 0.75), color: design.textColor }}
                  aria-label={t.close}
                >
                  <X size={16} className="mx-auto" />
                </button>

                {showPhotos ? (
                  <div className="px-4 pt-2">
                    <div className="relative mx-auto aspect-[16/10] w-full max-w-[760px] overflow-hidden rounded-2xl border"
                      style={{ borderColor: design.borderColor, background: withAlpha(design.controlSurfaceColor, 0.55) }}
                    >
                      <Image
                        src={dish.imageUrl}
                        alt={getDishName(language, dish)}
                        fill
                        sizes="(min-width: 1024px) 760px, 100vw"
                        quality={95}
                        className="h-full w-full object-contain"
                        style={{ objectPosition: `${dish.imagePositionX}% ${dish.imagePositionY}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="px-4 pt-4">
                  <h3 className="font-serif text-3xl" style={{ color: design.textColor }}>{getDishName(language, dish)}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: design.mutedTextColor }}>{getDishDescription(language, dish)}</p>

                  {dish.options && dish.options.length > 0 ? (
                    <div className="mt-4">
                      <label className="mb-2 block text-sm" style={{ color: design.mutedTextColor }}>{t.chooseOption}</label>
                      <div className="space-y-2">
                        {dish.options.map((option) => {
                          const isSelected = selectedOptionByDish[dish.id] === option.id;

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => selectDishOption(dish.id, option.id)}
                              className="w-full rounded-xl border px-3 py-2 text-left"
                              style={{
                                borderColor: design.borderColor,
                                background: isSelected ? design.activeChipBackground : design.controlSurfaceColor,
                                color: isSelected ? design.activeChipTextColor : design.textColor,
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span>{getDishOptionName(language, option)}</span>
                                <span className="text-sm">+{formatCurrency(option.price, design.currencyMode)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border p-1.5" style={{ borderColor: design.borderColor }}>
                      <button
                        type="button"
                        onClick={() => updateSelectedQty(dish.id, -1)}
                        className="min-h-11 min-w-11 rounded-lg border"
                        style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                      >
                        <Minus size={16} className="mx-auto" />
                      </button>
                      <span className="min-w-8 text-center" style={{ color: design.textColor }}>{getSelectedQty(dish.id)}</span>
                      <button
                        type="button"
                        onClick={() => updateSelectedQty(dish.id, 1)}
                        className="min-h-11 min-w-11 rounded-lg border"
                        style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                      >
                        <Plus size={16} className="mx-auto" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCart(dish.id);
                        if (!dish.options || dish.options.length === 0 || selectedOptionByDish[dish.id]) {
                          closeDishModal();
                        }
                      }}
                      className="min-h-12 flex-1 rounded-xl px-4 py-3 text-base font-semibold"
                      style={{ background: design.primaryColor, color: design.accentTextColor }}
                    >
                      {t.add} {formatCurrency(finalPrice, design.currencyMode)}
                    </button>
                  </div>
                </div>
              </section>
            );
          })()}
        </div>
      ) : null}
          </>
      ) : null /* isDataLoading */}
    </div>
  );
}
