"use client";

import { CategoryWithDishes, Language, Order } from "@/types";
import { Minus, Plus, ShoppingBag, Trash2, Bell, User, Menu, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  categories: CategoryWithDishes[];
  restaurantId?: number;
  restaurantSlug?: string;
  settings?: {
    serviceMode?: "lite" | "pro";
    brandName?: string;
    brandSubtitle?: string;
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
    basket: "Your basket",
    empty: "Your basket is empty",
    orderSuccess: "Order created successfully.",
    failed: "Something went wrong. Please try again.",
    chooseItemsError: "Add at least one dish to your basket.",
    tableRequiredError: "Please enter table number.",
    tableSessionExpired: "Your table session is closed. Please scan the QR on your table again.",
    qrRequiredError: "Please scan your table QR code to place an order.",
    qrInvalidError: "Invalid QR link. Please scan the QR code on your table.",
    categories: "Categories",
    viewBasket: "View basket",
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
    basket: "Ваша корзина",
    empty: "Корзина пуста",
    orderSuccess: "Заказ успешно создан.",
    failed: "Что-то пошло не так. Попробуйте снова.",
    chooseItemsError: "Добавьте хотя бы одно блюдо в корзину.",
    tableRequiredError: "Введите номер стола.",
    tableSessionExpired: "Сессия стола закрыта. Пожалуйста, снова отсканируйте QR-код на вашем столе.",
    qrRequiredError: "Чтобы сделать заказ, отсканируйте QR-код на вашем столе.",
    qrInvalidError: "Неверная QR-ссылка. Пожалуйста, сканируйте QR-код на вашем столе.",
    categories: "Категории",
    viewBasket: "Корзина",
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
    basket: "Səbətiniz",
    empty: "Səbət boşdur",
    orderSuccess: "Sifariş uğurla yaradıldı.",
    failed: "Xəta baş verdi. Yenidən cəhd edin.",
    chooseItemsError: "Səbətə ən azı bir yemək əlavə edin.",
    tableRequiredError: "Masa nömrəsini daxil edin.",
    tableSessionExpired: "Masa sessiyası bağlanıb. Zəhmət olmasa masanızdakı QR kodu yenidən skan edin.",
    qrRequiredError: "Sifariş etmək üçün masanızdakı QR kodu skan edin.",
    qrInvalidError: "Yanlış QR linki. Zəhmət olmasa masanızdakı QR kodu skan edin.",
    categories: "Kateqoriyalar",
    viewBasket: "Səbət",
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

function parseServiceModeFromRawSettings(rawSettings: string | null | undefined) {
  if (!rawSettings) {
    return "pro" as const;
  }

  try {
    const parsed = JSON.parse(rawSettings) as { serviceMode?: unknown };
    return parsed.serviceMode === "lite" ? "lite" : "pro";
  } catch {
    return "pro" as const;
  }
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
}: Props) {
  const [liveCategories, setLiveCategories] = useState<CategoryWithDishes[]>(categories);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(categories[0]?.id ?? null);
  const [language, setLanguage] = useState<Language>("en");
  const [tableNumber, setTableNumber] = useState("");
  const [qrTableNumber, setQrTableNumber] = useState("");
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
  const dishTouchStartYRef = useRef<number | null>(null);
  const dishTouchStartScrollTopRef = useRef(0);
  const basketSheetRef = useRef<HTMLElement | null>(null);
  const dishSheetRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const dishModalCloseTimerRef = useRef<number | null>(null);
  const lastClickedCategoryIdRef = useRef<number | null>(null);
  const pendingCategoryScrollIdRef = useRef<number | null>(null);

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
    brandName: settings?.brandName || restaurantName || t.title,
    brandSubtitle: settings?.brandSubtitle || t.subtitle,
    primaryColor: settings?.primaryColor || "#b8944f",
    accentTextColor: settings?.accentTextColor || "#120e08",
    backgroundFrom: settings?.backgroundFrom || "#0a0a0a",
    backgroundTo: settings?.backgroundTo || "#0d0d0d",
    surfaceColor: settings?.surfaceColor || "rgba(18,18,18,0.86)",
    textColor: settings?.textColor || "#f0e8d0",
    mutedTextColor: settings?.mutedTextColor || "#c9b28d",
    borderColor: settings?.borderColor || "rgba(201,169,98,0.35)",
    buttonRadius: normalizeRadius(settings?.buttonRadius, "14px"),
    cardRadius: normalizeRadius(settings?.cardRadius, "20px"),
    panelColor: settings?.panelColor || "#161616",
    overlayColor: settings?.overlayColor || "#000000",
    controlSurfaceColor: settings?.controlSurfaceColor || "#2a2a2a",
    activeChipBackground: settings?.activeChipBackground || "#b8944f",
    activeChipTextColor: settings?.activeChipTextColor || "#120e08",
    inactiveChipBackground: settings?.inactiveChipBackground || "#1f1f1f",
    inactiveChipTextColor: settings?.inactiveChipTextColor || "#f0e8d0",
    dividerColor: settings?.dividerColor || "rgba(201,169,98,0.35)",
    successColor: settings?.successColor || "#34d399",
    errorColor: settings?.errorColor || "#f87171",
    categoryTitleColor: settings?.categoryTitleColor || (settings?.textColor || "#f0e8d0"),
    qtyButtonBackground: settings?.qtyButtonBackground || settings?.controlSurfaceColor || "#2a2a2a",
    qtyButtonTextColor: settings?.qtyButtonTextColor || settings?.textColor || "#f0e8d0",
    qtyButtonBorderColor: settings?.qtyButtonBorderColor || settings?.borderColor || "rgba(201,169,98,0.35)",
    currencyMode: settings?.currencyMode || "manat",
  };

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
    if (!restaurantId || isLiteMode) {
      setActiveOrder(null);
      return;
    }

    const normalizedTable = currentTable.trim();

    if (!normalizedTable) {
      setActiveOrder(null);
      return;
    }

    const response = await fetch(
      `/api/orders/active?tableNumber=${encodeURIComponent(normalizedTable)}&restaurantId=${restaurantId}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { order: Order | null };
    setActiveOrder(data.order);
  }, [isLiteMode, restaurantId]);

  useEffect(() => {
    setRuntimeServiceMode(settings?.serviceMode === "lite" ? "lite" : "pro");
  }, [settings?.serviceMode]);

  useEffect(() => {
    if (!restaurantSlug) {
      return;
    }

    const refreshServiceMode = async () => {
      const response = await fetch(`/api/public/restaurant?slug=${encodeURIComponent(restaurantSlug)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { restaurant?: { settings?: string | null } };
      setRuntimeServiceMode(parseServiceModeFromRawSettings(data.restaurant?.settings));
    };

    void refreshServiceMode();
    const intervalMs = isPageVisible ? 8000 : 30000;
    const interval = window.setInterval(() => {
      void refreshServiceMode();
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [isPageVisible, restaurantSlug]);

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
        if (lastClickedCategoryIdRef.current !== null && prev === lastClickedCategoryIdRef.current) {
          if (currentId !== lastClickedCategoryIdRef.current) {
            lastClickedCategoryIdRef.current = null;
            return currentId;
          }

          return prev;
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
    const targetLeft =
      rail.scrollLeft +
      (buttonRect.left - railRect.left) -
      (railRect.width / 2 - buttonRect.width / 2);

    rail.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
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

  useEffect(() => {
    if (!restaurantId) {
      return;
    }

    const refreshMenu = async () => {
      const response = await fetch(`/api/categories?restaurantId=${restaurantId}`, { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as CategoryWithDishes[];
      setLiveCategories(data);
    };

    void refreshMenu();

    const menuRefreshIntervalMs = isPageVisible ? 12000 : 90000;

    const interval = window.setInterval(() => {
      void refreshMenu();
    }, menuRefreshIntervalMs);

    return () => window.clearInterval(interval);
  }, [isPageVisible, restaurantId]);

  useEffect(() => {
    const isAnyOverlayOpen = isBasketOpen || isDishModalOpen || isCategoryMenuOpen;

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

    const activeOrderPollIntervalMs = isPageVisible ? 10000 : 30000;

    const interval = window.setInterval(() => {
      void fetchActiveOrder(normalized);
    }, activeOrderPollIntervalMs);

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
    touchStartScrollTopRef.current = basketSheetRef.current?.scrollTop ?? 0;
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

    const sheet = basketSheetRef.current;
    const atTop = (sheet?.scrollTop ?? 0) <= 0 && touchStartScrollTopRef.current <= 0;

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
    dishTouchStartScrollTopRef.current = dishSheetRef.current?.scrollTop ?? 0;
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

    const sheet = dishSheetRef.current;
    const atTop = (sheet?.scrollTop ?? 0) <= 0 && dishTouchStartScrollTopRef.current <= 0;

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

    if (!restaurantId) {
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
          restaurantId,
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

    if (!restaurantId) {
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
        body: JSON.stringify({ tableNumber: effectiveTable.trim(), restaurantId }),
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

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium" style={{ color: design.mutedTextColor }}>{t.tableNumber}</label>
          <input
            value={tableNumber}
            onChange={(event) => {
              if (qrTableNumber) {
                return;
              }

              setTableNumber(event.target.value);
            }}
            placeholder="12"
            readOnly={Boolean(qrTableNumber)}
            disabled={Boolean(qrTableNumber)}
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
      }}
    >
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
              <p className="text-xs uppercase tracking-[0.4em]" style={{ color: design.mutedTextColor }}>{t.menuLabel}</p>
              <h1 className="mt-3 font-serif text-3xl sm:text-5xl" style={{ color: design.textColor }}>{design.brandName}</h1>
              <p className="mt-3 max-w-2xl" style={{ color: design.mutedTextColor }}>{design.brandSubtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              {!isLiteMode ? (
                <button
                  type="button"
                  onClick={callWaiter}
                  disabled={callingWaiter || waiterCalled}
                  className={`flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-medium transition ${
                    waiterCalled
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
                      : "hover:opacity-90"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  style={!waiterCalled ? { backgroundColor: design.primaryColor, color: design.accentTextColor, borderRadius: design.buttonRadius } : undefined}
                >
                  {waiterCalled ? (
                    <>
                      <User size={16} />
                      <span className="hidden sm:inline">{t.waiterOnTheWay}</span>
                    </>
                  ) : (
                    <>
                      <Bell size={16} className="animate-pulse" />
                      <span className="hidden sm:inline">{t.callWaiter}</span>
                    </>
                  )}
                </button>
              ) : null}

              <div className="flex rounded-full border p-1" style={{ borderColor: design.borderColor, background: design.controlSurfaceColor }}>
                {(["en", "ru", "az"] as Language[]).map((lang) => (
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
              <h2 className="mb-4 border-b pb-3 font-serif text-2xl" style={{ borderColor: design.dividerColor, color: design.categoryTitleColor }}>
                {getCategoryName(language, category)}
              </h2>

              {category.dishes.length === 0 ? (
                <div className="rounded-xl border p-4 text-sm" style={{ borderColor: design.borderColor, color: design.mutedTextColor, background: withAlpha(design.surfaceColor, 0.7) }}>
                  {t.noItemsInCategory}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {category.dishes.map((dish) => (
                  <article
                    key={dish.id}
                    className="group card-hover card-glow mx-auto w-full max-w-[420px] overflow-hidden border shadow-sm"
                    onClick={() => openDishModal(dish.id)}
                    style={{
                      borderRadius: design.cardRadius,
                      borderColor: design.borderColor,
                      background: design.surfaceColor,
                    }}
                  >
                    <div className="relative aspect-[21/11] w-full overflow-hidden">
                      <Image
                        src={dish.imageUrl}
                        alt={getDishName(language, dish)}
                        fill
                        sizes="420px"
                        quality={95}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        style={{
                          objectPosition: `${dish.imagePositionX}% ${dish.imagePositionY}%`,
                        }}
                      />
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif text-xl" style={{ color: design.textColor }}>{getDishName(language, dish)}</h3>
                        <p
                          className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold leading-none sm:text-[0.95rem]"
                          style={{ backgroundColor: design.primaryColor, color: design.accentTextColor }}
                        >
                          {formatCurrency(dish.price, design.currencyMode)}
                        </p>
                      </div>

                      <p className="text-sm leading-6" style={{ color: design.mutedTextColor }}>{getDishDescription(language, dish)}</p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateSelectedQty(dish.id, -1);
                          }}
                          className="min-h-11 min-w-11 rounded-lg border p-2 transition"
                          style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-medium" style={{ color: design.textColor }}>{getSelectedQty(dish.id)}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateSelectedQty(dish.id, 1);
                          }}
                          className="min-h-11 min-w-11 rounded-lg border p-2 transition"
                          style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                        >
                          <Plus size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            addToCart(dish.id);
                          }}
                          className="ml-auto min-h-11 px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                          style={{
                            borderRadius: design.buttonRadius,
                            backgroundColor: design.primaryColor,
                            color: design.accentTextColor,
                          }}
                        >
                          {t.add}
                        </button>
                      </div>

                      {dish.options && dish.options.length > 0 ? (
                        <div>
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
                        </div>
                      ) : null}
                    </div>
                  </article>
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
            className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t p-4 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ borderColor: design.borderColor, background: design.panelColor,
              transform: `translateY(${isDragging ? dragY : isBasketVisible ? 0 : 480}px)`,
            }}
            ref={(node) => {
              basketSheetRef.current = node;
            }}
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
                className="absolute inset-x-0 bottom-0 max-h-[95vh] overflow-y-auto rounded-t-3xl border-t pb-6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  borderColor: design.borderColor,
                  background: design.panelColor,
                  transform: `translateY(${isDishDragging ? dishDragY : isDishModalVisible ? 0 : 560}px)`,
                }}
                ref={(node) => {
                  dishSheetRef.current = node;
                }}
                onTouchStart={onDishSheetTouchStart}
                onTouchMove={onDishSheetTouchMove}
                onTouchEnd={onDishSheetTouchEnd}
              >
                <div className="mx-auto mb-3 mt-2 h-1.5 w-14 rounded-full" style={{ background: design.mutedTextColor }} />
                <button
                  type="button"
                  onClick={closeDishModal}
                  className="absolute right-4 top-4 z-20 min-h-10 min-w-10 rounded-full border"
                  style={{ borderColor: design.borderColor, background: withAlpha(design.controlSurfaceColor, 0.75), color: design.textColor }}
                  aria-label={t.close}
                >
                  <X size={16} className="mx-auto" />
                </button>

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
    </div>
  );
}
