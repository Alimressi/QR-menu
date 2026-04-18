"use client";

import { CategoryWithDishes, Language, Order } from "@/types";
import { Minus, Plus, ShoppingBag, Trash2, Bell, User } from "lucide-react";
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
};

const dictionary: Record<Language, Dictionary> = {
  en: {
    title: "Nine Lives",
    subtitle: "Craft cocktails. Fine dishes. Timeless atmosphere.",
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
  },
  ru: {
    title: "Nine Lives",
    subtitle: "Авторские коктейли. Избранные блюда. Неподвластная времени атмосфера.",
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
  },
  az: {
    title: "Nine Lives",
    subtitle: "Həmkar kokteyllər. Seçilmiş yeməklər. Zamansız atmosfer.",
    tableNumber: "Masa nömrəsi",
    qrTableDetected: "QR-dan təyin edildi",
    placeOrder: "Sifariş et",
    add: "Əlavə et",
    total: "Cəmi",
    basket: "Səbətiniz",
    empty: "Səbət boşdur",
    orderSuccess: "Sifariş uğurla yaradıldı.",
    failed: "Xəta baş verdi. Yenidən cəhd edin.",
    chooseItemsError: "Səbətə ən azı bir yemək əlavə edin.",
    tableRequiredError: "Masa nömrəsini daxil edin.",
    tableSessionExpired: "Masa sessiyasi baglanib. Zehmet olmasa masanizdaki QR kodu yeniden skan edin.",
    qrRequiredError: "Sifaris etmek ucun masanizdaki QR kodu skan edin.",
    qrInvalidError: "Yanlis QR linki. Zehmet olmasa masanizdaki QR kodu skan edin.",
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
  },
};

function getDishName(language: Language, dish: CategoryWithDishes["dishes"][number]) {
  if (language === "ru") {
    return dish.nameRu;
  }

  if (language === "az") {
    return dish.nameAz;
  }

  return dish.nameEn;
}

function getDishDescription(language: Language, dish: CategoryWithDishes["dishes"][number]) {
  if (language === "ru") {
    return dish.descriptionRu;
  }

  if (language === "az") {
    return dish.descriptionAz;
  }

  return dish.descriptionEn;
}

function getCategoryName(language: Language, category: CategoryWithDishes) {
  if (language === "ru") {
    return category.nameRu;
  }

  if (language === "az") {
    return category.nameAz;
  }

  return category.nameEn;
}

function getOrderItemName(language: Language, item: Order["items"][number]) {
  if (language === "ru") {
    return item.nameRu;
  }

  if (language === "az") {
    return item.nameAz;
  }

  return item.nameEn;
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
    return `₼ ${value.toFixed(2)}`;
  }

  return `${value.toFixed(2)} manat`;
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
  const [language, setLanguage] = useState<Language>("en");
  const [tableNumber, setTableNumber] = useState("");
  const [qrTableNumber, setQrTableNumber] = useState("");
  const [qrSessionToken, setQrSessionToken] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTableSessionExpired, setIsTableSessionExpired] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [runtimeServiceMode, setRuntimeServiceMode] = useState<"lite" | "pro">(
    settings?.serviceMode === "lite" ? "lite" : "pro",
  );
  const touchStartYRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

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
    return Object.entries(cart)
      .map(([dishId, quantity]) => {
        const dish = allDishes.find((item) => item.id === Number(dishId));

        if (!dish) {
          return null;
        }

        return { dish, quantity };
      })
      .filter((item): item is { dish: CategoryWithDishes["dishes"][number]; quantity: number } => Boolean(item));
  }, [allDishes, cart]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
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
    if (!isBasketOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBasketOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
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

    element.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const qty = getSelectedQty(dishId);

    setCart((prev) => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + qty,
    }));
  }

  function updateCartItemQty(dishId: number, delta: number) {
    setCart((prev) => {
      const current = prev[dishId] || 0;
      const next = current + delta;

      if (next <= 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }

      return {
        ...prev,
        [dishId]: next,
      };
    });
  }

  function removeFromCart(dishId: number) {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[dishId];
      return copy;
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
    setIsDragging(true);
  }

  function onSheetTouchMove(event: React.TouchEvent<HTMLElement>) {
    if (touchStartYRef.current === null) {
      return;
    }

    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    const nextDrag = Math.max(0, currentY - touchStartYRef.current);
    setDragY(nextDrag);
  }

  function onSheetTouchEnd() {
    const shouldClose = dragY > 90;
    setIsDragging(false);
    setDragY(0);
    touchStartYRef.current = null;

    if (shouldClose) {
      closeBasket();
    }
  }

  async function placeOrder() {
    if (isLiteMode) {
      return;
    }

    if (!restaurantId) {
      setError("Restaurant context is missing. Please reload menu from QR link.");
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
          items: cartItems.map((item) => ({ dishId: item.dish.id, quantity: item.quantity })),
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
      setError("Restaurant context is missing. Please reload menu from QR link.");
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
                  {getOrderItemName(language, item)} x{item.quantity} ({formatCurrency(item.price, design.currencyMode)})
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
                    <p className="text-xs" style={{ color: design.mutedTextColor }}>{item.quantity} x {formatCurrency(item.dish.price, design.currencyMode)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.dish.id)}
                    className="min-h-9 min-w-9 rounded-lg border"
                    style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.errorColor }}
                    aria-label="Remove item"
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
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} className="mx-auto" />
                  </button>
                  <span className="min-w-8 text-center text-sm" style={{ color: design.textColor }}>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateCartItemQty(item.dish.id, 1)}
                    className="min-h-9 min-w-9 rounded-lg border"
                    style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} className="mx-auto" />
                  </button>
                </div>
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
              <p className="text-xs uppercase tracking-[0.4em]" style={{ color: design.mutedTextColor }}>Bar & Lounge QR Menu</p>
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

          <div className="mt-6">
            <p className="mb-2 text-[11px] uppercase tracking-[0.3em] sm:text-xs sm:tracking-[0.35em]" style={{ color: design.mutedTextColor }}>{t.categories}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {liveCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => scrollToCategory(category.id)}
                  className="min-h-11 whitespace-nowrap px-4 py-2 text-sm transition hover:opacity-90"
                  style={{
                    borderRadius: design.buttonRadius,
                    border: `1px solid ${design.borderColor}`,
                    background: design.surfaceColor,
                    color: design.mutedTextColor,
                  }}
                >
                  {getCategoryName(language, category)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
        <section className="space-y-8">
          {liveCategories.map((category, categoryIndex) => (
            <div id={`category-${category.id}`} key={category.id} className="fade-up scroll-mt-6" style={{ animationDelay: `${categoryIndex * 90}ms` }}>
              <h2 className="mb-4 border-b pb-3 font-serif text-2xl" style={{ borderColor: design.dividerColor, color: design.categoryTitleColor }}>
                {getCategoryName(language, category)}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {category.dishes.map((dish) => (
                  <article
                    key={dish.id}
                    className="group card-hover card-glow mx-auto w-full max-w-[420px] overflow-hidden border shadow-sm"
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
                          className="rounded-full px-3 py-1 text-sm font-semibold"
                          style={{ backgroundColor: design.primaryColor, color: design.accentTextColor }}
                        >
                          {formatCurrency(dish.price, design.currencyMode)}
                        </p>
                      </div>

                      <p className="text-sm leading-6" style={{ color: design.mutedTextColor }}>{getDishDescription(language, dish)}</p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateSelectedQty(dish.id, -1)}
                          className="min-h-11 min-w-11 rounded-lg border p-2 transition"
                          style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-medium" style={{ color: design.textColor }}>{getSelectedQty(dish.id)}</span>
                        <button
                          type="button"
                          onClick={() => updateSelectedQty(dish.id, 1)}
                          className="min-h-11 min-w-11 rounded-lg border p-2 transition"
                          style={{ borderColor: design.qtyButtonBorderColor, background: design.qtyButtonBackground, color: design.qtyButtonTextColor }}
                        >
                          <Plus size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => addToCart(dish.id)}
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
    </div>
  );
}
