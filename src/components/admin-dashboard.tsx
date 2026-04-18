"use client";

import { CategoryWithDishes, Dish, Order } from "@/types";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminLanguage = "en" | "ru" | "az";

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

type RestaurantDesign = {
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
  currencyMode: "manat" | "azn" | "symbol";
};

const defaultAdminDesign: RestaurantDesign = {
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

function normalizeRadius(value: string | undefined, fallbackPx: string) {
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

function parseRestaurantDesign(rawSettings: unknown): RestaurantDesign {
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
    ...defaultAdminDesign,
    ...parsed,
    buttonRadius: normalizeRadius(typeof parsed.buttonRadius === "string" ? parsed.buttonRadius : undefined, "14px"),
    cardRadius: normalizeRadius(typeof parsed.cardRadius === "string" ? parsed.cardRadius : undefined, "20px"),
    currencyMode:
      parsed.currencyMode === "azn" || parsed.currencyMode === "symbol" || parsed.currencyMode === "manat"
        ? parsed.currencyMode
        : defaultAdminDesign.currencyMode,
  };
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

const statuses = ["new", "preparing", "ready", "paid"] as const;

const dictionary: Record<
  AdminLanguage,
  {
    checkingSession: string;
    adminLogin: string;
    useEnvCredentials: string;
    login: string;
    password: string;
    signIn: string;
    invalidCredentials: string;
    restaurantAdmin: string;
    refresh: string;
    logout: string;
    activeOrders: string;
    orderHistory: string;
    menu: string;
    qr: string;
    order: string;
    table: string;
    noOrders: string;
    allTables: string;
    historySortedByLatest: string;
    allDishes: string;
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
    tableLabel: string;
    edit: string;
    delete: string;
    uploadingImage: string;
    uploadFailed: string;
    saveDishFailed: string;
    addCategoryFailed: string;
    saving: string;
    statusNew: string;
    statusPreparing: string;
    statusReady: string;
    statusPaid: string;
    waiterCalls: string;
    noWaiterCalls: string;
    callFromTable: string;
    markAsResolved: string;
    resolved: string;
  }
> = {
  en: {
    checkingSession: "Checking session...",
    adminLogin: "Admin Login",
    useEnvCredentials: "Use credentials from .env file",
    login: "Login",
    password: "Password",
    signIn: "Sign in",
    invalidCredentials: "Invalid login or password.",
    restaurantAdmin: "Restaurant Admin",
    refresh: "Refresh",
    logout: "Logout",
    activeOrders: "Active Orders",
    orderHistory: "Order History",
    menu: "Menu",
    qr: "QR",
    order: "Order",
    table: "Table",
    noOrders: "No orders yet.",
    allTables: "All tables",
    historySortedByLatest: "Sorted by latest paid first",
    allDishes: "All Dishes",
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
    qrTitle: "QR Menu Links (5 Tables)",
    tableLabel: "Table",
    edit: "Edit",
    delete: "Delete",
    uploadingImage: "Uploading image...",
    uploadFailed: "Upload failed.",
    saveDishFailed: "Failed to save dish.",
    addCategoryFailed: "Failed to add category.",
    saving: "Saving...",
    statusNew: "new",
    statusPreparing: "preparing",
    statusReady: "ready",
    statusPaid: "paid",
    waiterCalls: "Waiter Calls",
    noWaiterCalls: "No active waiter calls",
    callFromTable: "Call from table",
    markAsResolved: "Mark resolved",
    resolved: "resolved",
  },
  ru: {
    checkingSession: "Проверка сессии...",
    adminLogin: "Вход в админку",
    useEnvCredentials: "Используйте данные из файла .env",
    login: "Логин",
    password: "Пароль",
    signIn: "Войти",
    invalidCredentials: "Неверный логин или пароль.",
    restaurantAdmin: "Админ-панель ресторана",
    refresh: "Обновить",
    logout: "Выйти",
    activeOrders: "Активные заказы",
    orderHistory: "История заказов",
    menu: "Меню",
    qr: "QR",
    order: "Заказ",
    table: "Стол",
    noOrders: "Пока нет заказов.",
    allTables: "Все столы",
    historySortedByLatest: "Сортировка: сначала последние оплаченные",
    allDishes: "Все блюда",
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
    reset: "Сброс",
    addCategory: "Добавить категорию",
    categoryEn: "Категория EN",
    categoryRu: "Категория RU",
    categoryAz: "Категория AZ",
    addCategoryButton: "Добавить категорию",
    qrTitle: "QR-ссылки меню (5 столиков)",
    tableLabel: "Стол",
    edit: "Изменить",
    delete: "Удалить",
    uploadingImage: "Загрузка изображения...",
    uploadFailed: "Ошибка загрузки.",
    saveDishFailed: "Не удалось сохранить блюдо.",
    addCategoryFailed: "Не удалось добавить категорию.",
    saving: "Сохранение...",
    statusNew: "новый",
    statusPreparing: "готовится",
    statusReady: "готов",
    statusPaid: "оплачен",
    waiterCalls: "Вызовы официанта",
    noWaiterCalls: "Нет активных вызовов",
    callFromTable: "Вызов со стола",
    markAsResolved: "Отметить выполненным",
    resolved: "выполнено",
  },
  az: {
    checkingSession: "Sessiya yoxlanilir...",
    adminLogin: "Admin girisi",
    useEnvCredentials: ".env faylindaki melumatlardan istifade edin",
    login: "Login",
    password: "Sifre",
    signIn: "Daxil ol",
    invalidCredentials: "Yanlis login ve ya sifre.",
    restaurantAdmin: "Restoran admin paneli",
    refresh: "Yenile",
    logout: "Cixis",
    activeOrders: "Aktiv sifarisler",
    orderHistory: "Sifaris tarixcesi",
    menu: "Menyu",
    qr: "QR",
    order: "Sifaris",
    table: "Masa",
    noOrders: "Hec bir sifaris yoxdur.",
    allTables: "Butun masalar",
    historySortedByLatest: "Siralanma: en son odenilenler once",
    allDishes: "Butun yemekler",
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
    qrTitle: "QR menyu linkleri (5 masa)",
    tableLabel: "Masa",
    edit: "Redakte et",
    delete: "Sil",
    uploadingImage: "Sekil yuklenir...",
    uploadFailed: "Yukleme ugursuz oldu.",
    saveDishFailed: "Yemek saxlanmadi.",
    addCategoryFailed: "Kateqoriya elave olunmadi.",
    saving: "Saxlanilir...",
    statusNew: "yeni",
    statusPreparing: "hazirlanir",
    statusReady: "hazirdir",
    statusPaid: "odenilib",
    waiterCalls: "Ofisiant cagirislari",
    noWaiterCalls: "Aktiv cagiris yoxdur",
    callFromTable: "Masadan cagiris",
    markAsResolved: "Hell edildi kimi isaretle",
    resolved: "hell edildi",
  },
};

type Props = {
  restaurantSlug?: string;
};

export function AdminDashboard({ restaurantSlug }: Props) {
  const [language, setLanguage] = useState<AdminLanguage>("en");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [authError, setAuthError] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantDesign, setRestaurantDesign] = useState<RestaurantDesign>(defaultAdminDesign);

  const [tab, setTab] = useState<"active-orders" | "order-history" | "waiter-calls">("active-orders");

  const [historyTableFilter, setHistoryTableFilter] = useState("all");
  const [waiterCalls, setWaiterCalls] = useState<Array<{ id: number; tableNumber: string; status: string; createdAt: string }>>([]);

  // Legacy states (not used for RESTAURANT_ADMIN)
  const [categories, setCategories] = useState<CategoryWithDishes[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishForm, setDishForm] = useState<DishForm>(emptyDishForm);
  const [editingDishId, setEditingDishId] = useState<number | null>(null);
  const [savingDish, setSavingDish] = useState(false);
  const [categoryEn, setCategoryEn] = useState("");
  const [categoryRu, setCategoryRu] = useState("");
  const [categoryAz, setCategoryAz] = useState("");
  const [busyMessage, setBusyMessage] = useState("");
  const [menuUrl, setMenuUrl] = useState("");
  const [tableQrs, setTableQrs] = useState<Array<{ table: string; url: string; dataUrl: string }>>([]);
  const [isPageVisible, setIsPageVisible] = useState(true);

  const t = dictionary[language];
  const design = restaurantDesign;

  const loadPublicRestaurantTheme = useCallback(async () => {
    if (!restaurantSlug) {
      return;
    }

    try {
      const response = await fetch(`/api/public/restaurant?slug=${encodeURIComponent(restaurantSlug)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        restaurant?: {
          name?: string;
          settings?: string | null;
        };
      };

      if (data.restaurant?.name) {
        setRestaurantName(data.restaurant.name);
      }

      setRestaurantDesign(parseRestaurantDesign(data.restaurant?.settings));
    } catch {
      // Keep current fallback theme when public theme fetch fails.
    }
  }, [restaurantSlug]);

  const applyLoggedOutTheme = useCallback(() => {
    setRestaurantId(null);
    setUserRole(null);

    if (restaurantSlug) {
      void loadPublicRestaurantTheme();
      return;
    }

    setRestaurantName("");
    setRestaurantDesign(defaultAdminDesign);
  }, [loadPublicRestaurantTheme, restaurantSlug]);

  function getOrderItemName(item: Order["items"][number]) {
    if (language === "ru") {
      return item.nameRu;
    }

    if (language === "az") {
      return item.nameAz;
    }

    return item.nameEn;
  }

  function getStatusLabel(status: (typeof statuses)[number]) {
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

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/me");
      if (response.ok) {
        const data = await response.json();

        if (data.role !== "RESTAURANT_ADMIN") {
          setAuthenticated(false);
          applyLoggedOutTheme();
          return;
        }

        if (!data.restaurantId || !data.restaurant) {
          setAuthenticated(false);
          applyLoggedOutTheme();
          return;
        }

        if (restaurantSlug && data.restaurant?.slug && data.restaurant.slug !== restaurantSlug) {
          setAuthenticated(false);
          applyLoggedOutTheme();
          return;
        }

        setAuthenticated(true);
        setUserRole(data.role);
        setRestaurantId(data.restaurantId);
        setRestaurantDesign(parseRestaurantDesign(data.restaurant?.settings));
        if (data.restaurant?.name) {
          setRestaurantName(data.restaurant.name);
        }
      }
    } finally {
      setLoadingAuth(false);
    }
  }, [applyLoggedOutTheme, restaurantSlug]);

  const loadOrders = useCallback(async () => {
    if (!restaurantId) return;
    const response = await fetch(`/api/orders?restaurantId=${restaurantId}`);
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setOrders(data);
  }, [restaurantId]);

  const loadWaiterCalls = useCallback(async () => {
    if (!restaurantId) return;
    const response = await fetch(`/api/waiter-call?restaurantId=${restaurantId}`);
    if (!response.ok) {
      return;
    }
    const data = (await response.json()) as { calls: Array<{ id: number; tableNumber: string; status: string; createdAt: string }> };
    setWaiterCalls(data.calls || []);
  }, [restaurantId]);

  const loadMenu = useCallback(async () => {
    if (!restaurantId) return;

    const [categoriesResponse, dishesResponse] = await Promise.all([
      fetch(`/api/categories?restaurantId=${restaurantId}`),
      fetch(`/api/dishes?restaurantId=${restaurantId}`),
    ]);

    if (categoriesResponse.ok) {
      setCategories(await categoriesResponse.json());
    }

    if (dishesResponse.ok) {
      setDishes(await dishesResponse.json());
    }
  }, [restaurantId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOrders(), loadMenu(), loadWaiterCalls()]);
  }, [loadMenu, loadOrders, loadWaiterCalls]);

  useEffect(() => {
    void loadPublicRestaurantTheme();
  }, [loadPublicRestaurantTheme]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    void refreshAll();

    const pollIntervalMs = isPageVisible ? 8000 : 30000;

    const interval = window.setInterval(() => {
      void loadOrders();
      void loadWaiterCalls();
    }, pollIntervalMs);

    return () => window.clearInterval(interval);
  }, [authenticated, isPageVisible, loadOrders, loadWaiterCalls, refreshAll]);

  useEffect(() => {
    if (!authenticated || typeof window === "undefined") {
      return;
    }

    const url = `${window.location.origin}/`;
    setMenuUrl(url);

    const generateQr = async () => {
      const QRCode = await import("qrcode");

      const response = await fetch("/api/admin/qr-links", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { links: Array<{ table: string; url: string }> };
      const tableEntries = await Promise.all(
        data.links.map(async (entry) => {
          const dataUrl = await QRCode.toDataURL(entry.url, {
            width: 280,
            margin: 1,
            color: {
              dark: "#1f3b2e",
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

      setTableQrs(tableEntries);
    };

    void generateQr();
  }, [authenticated]);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      id: category.id,
      label: `${category.nameEn} / ${category.nameRu} / ${category.nameAz}`,
    }));
  }, [categories]);

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "paid"),
    [orders],
  );

  const paidOrders = useMemo(() => {
    return orders
      .filter((order) => order.status === "paid")
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [orders]);

  const historyTableOptions = useMemo(() => {
    const values = Array.from(new Set(paidOrders.map((order) => order.tableNumber)));

    return values.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  }, [paidOrders]);

  const filteredPaidOrders = useMemo(() => {
    if (historyTableFilter === "all") {
      return paidOrders;
    }

    return paidOrders.filter((order) => order.tableNumber === historyTableFilter);
  }, [historyTableFilter, paidOrders]);

  async function onLogin(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, restaurantSlug }),
    });

    if (!response.ok) {
      setAuthError(t.invalidCredentials);
      return;
    }

    const data = await response.json();

    if (data.role !== "RESTAURANT_ADMIN" || !data.restaurantId) {
      setAuthError(t.invalidCredentials);
      return;
    }

    await checkSession();
    void refreshAll();
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    applyLoggedOutTheme();
  }

  async function updateOrderStatus(orderId: number, status: string) {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    await loadOrders();
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

  async function resolveWaiterCall(callId: number) {
    await fetch(`/api/waiter-call/${callId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    await loadWaiterCalls();
  }

  async function saveDish(event: React.FormEvent) {
    event.preventDefault();
    if (!restaurantId) {
      setBusyMessage("Restaurant context is missing.");
      return;
    }
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
        restaurantId,
        imagePositionX: Number(dishForm.imagePositionX),
        imagePositionY: Number(dishForm.imagePositionY),
      };

      const isEdit = editingDishId !== null;
      const endpoint = isEdit ? `/api/dishes/${editingDishId}` : "/api/dishes";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Failed to save dish.");
      }

      setDishForm(emptyDishForm);
      setEditingDishId(null);
      await loadMenu();
    } catch (error) {
      setBusyMessage(error instanceof Error ? error.message : t.saveDishFailed);
    } finally {
      setSavingDish(false);
    }
  }

  function editDish(dish: Dish) {
    setEditingDishId(dish.id);
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
  }

  async function removeDish(dishId: number) {
    await fetch(`/api/dishes/${dishId}`, { method: "DELETE" });
    await loadMenu();
  }

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!restaurantId) {
      setBusyMessage("Restaurant context is missing.");
      return;
    }

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: categoryEn,
        nameRu: categoryRu,
        nameAz: categoryAz,
        restaurantId,
      }),
    });

    if (!response.ok) {
      setBusyMessage(t.addCategoryFailed);
      return;
    }

    setCategoryEn("");
    setCategoryRu("");
    setCategoryAz("");
    await loadMenu();
  }

  if (loadingAuth) {
    return (
      <main
        className="flex min-h-screen w-full items-center justify-center px-4"
        style={{
          color: design.textColor,
          backgroundImage: `linear-gradient(180deg, ${design.backgroundFrom} 0%, ${design.backgroundTo} 100%)`,
        }}
      >
        <p className="text-sm" style={{ color: design.mutedTextColor }}>{t.checkingSession}</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main
        className="flex min-h-screen w-full items-center justify-center px-4"
        style={{
          color: design.textColor,
          backgroundImage: `linear-gradient(180deg, ${design.backgroundFrom} 0%, ${design.backgroundTo} 100%)`,
        }}
      >
        <form
          onSubmit={onLogin}
          className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
          style={{ borderColor: design.borderColor, background: design.panelColor }}
        >
          <h1 className="font-serif text-3xl" style={{ color: design.textColor }}>{t.adminLogin}</h1>
          <p className="mt-1 text-sm" style={{ color: design.mutedTextColor }}>
            {restaurantSlug ? `${t.useEnvCredentials} | /${restaurantSlug}/admin` : t.useEnvCredentials}
          </p>

          <div className="mt-3 flex rounded-full border p-1" style={{ borderColor: design.borderColor, background: design.controlSurfaceColor }}>
            {(["en", "ru", "az"] as AdminLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className="min-h-10 flex-1 rounded-full px-3 text-sm"
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

          <div className="mt-5 space-y-3">
            <input
              className="w-full rounded-xl border px-3 py-2"
              style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder={t.login}
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder={t.password}
            />
          </div>

          {authError ? <p className="mt-3 text-sm" style={{ color: design.errorColor }}>{authError}</p> : null}

          <button
            type="submit"
            className="mt-4 w-full rounded-xl px-4 py-2 font-medium"
            style={{ background: design.primaryColor, color: design.accentTextColor, borderRadius: design.buttonRadius }}
          >
            {t.signIn}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen w-full px-3 py-5 sm:px-6 sm:py-8"
      style={{
        color: design.textColor,
        backgroundImage: `linear-gradient(180deg, ${design.backgroundFrom} 0%, ${design.backgroundTo} 100%)`,
      }}
    >
      <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 sm:p-5" style={{ borderColor: design.borderColor, background: design.panelColor }}>
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl">{t.restaurantAdmin}</h1>
          {restaurantName ? <p className="text-sm" style={{ color: design.mutedTextColor }}>{restaurantName}</p> : null}
        </div>
        <div className="flex w-full rounded-full border p-1 sm:w-auto" style={{ borderColor: design.borderColor, background: design.controlSurfaceColor }}>
          {(["en", "ru", "az"] as AdminLanguage[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className="min-h-10 flex-1 rounded-full px-3 text-sm sm:flex-none"
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
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            type="button"
            onClick={refreshAll}
            className="min-h-11 flex-1 rounded-xl border px-4 py-2 sm:flex-none"
            style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor, borderRadius: design.buttonRadius }}
          >
            {t.refresh}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="min-h-11 flex-1 rounded-xl px-4 py-2 sm:flex-none"
            style={{ background: design.primaryColor, color: design.accentTextColor, borderRadius: design.buttonRadius }}
          >
            {t.logout}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {([
          ["active-orders", t.activeOrders, null],
          ["order-history", t.orderHistory, null],
          ["waiter-calls", t.waiterCalls, waiterCalls.length],
        ] as const).map(([key, label, badgeCount]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="relative min-h-11 rounded-full px-4 py-2 text-sm"
            style={
              tab === key
                ? { background: design.activeChipBackground, color: design.activeChipTextColor }
                : { background: design.inactiveChipBackground, color: design.inactiveChipTextColor }
            }
          >
            {label}
            {badgeCount && badgeCount > 0 ? (
              <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white shadow-lg animate-pulse ring-2 ring-dark-950">
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "active-orders" ? (
        <section className="space-y-4">
          {activeOrders.length === 0 ? (
            <p className="rounded-2xl border p-4" style={{ borderColor: design.borderColor, background: design.panelColor, color: design.mutedTextColor }}>{t.noOrders}</p>
          ) : null}

          {activeOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: design.borderColor, background: design.panelColor }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl" style={{ color: design.textColor }}>Order #{order.id}</h2>
                  <p className="text-sm" style={{ color: design.mutedTextColor }}>{t.table} {order.tableNumber} | {formatCurrency(order.total, design.currencyMode)}</p>
                </div>

                <select
                  value={order.status}
                  onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                  className="min-h-11 w-full rounded-lg border px-3 py-2 sm:w-auto"
                  style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <ul className="mt-3 space-y-2 text-sm" style={{ color: design.textColor }}>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {getOrderItemName(item)} x{item.quantity} ({formatCurrency(item.price, design.currencyMode)})
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "order-history" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-4" style={{ borderColor: design.borderColor, background: design.panelColor }}>
            <label className="text-sm" style={{ color: design.textColor }}>
              {t.table}
              <select
                value={historyTableFilter}
                onChange={(event) => setHistoryTableFilter(event.target.value)}
                className="ml-2 min-h-10 rounded-lg border px-3 py-2"
                style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
              >
                <option value="all">{t.allTables}</option>
                {historyTableOptions.map((tableNumber) => (
                  <option key={tableNumber} value={tableNumber}>
                    {tableNumber}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-xs" style={{ color: design.mutedTextColor }}>{t.historySortedByLatest}</p>
          </div>

          {filteredPaidOrders.length === 0 ? (
            <p className="rounded-2xl border p-4" style={{ borderColor: design.borderColor, background: design.panelColor, color: design.mutedTextColor }}>{t.noOrders}</p>
          ) : null}

          {filteredPaidOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: design.borderColor, background: design.panelColor }}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl" style={{ color: design.textColor }}>Order #{order.id}</h2>
                  <p className="text-sm" style={{ color: design.mutedTextColor }}>{t.table} {order.tableNumber} | {formatCurrency(order.total, design.currencyMode)}</p>
                </div>

                <select
                  value={order.status}
                  onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                  className="min-h-11 w-full rounded-lg border px-3 py-2 sm:w-auto"
                  style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.textColor }}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <ul className="mt-3 space-y-2 text-sm" style={{ color: design.textColor }}>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {getOrderItemName(item)} x{item.quantity} ({formatCurrency(item.price, design.currencyMode)})
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "waiter-calls" ? (
        <section className="space-y-4">
          {waiterCalls.length === 0 ? (
            <p className="rounded-2xl border p-4" style={{ borderColor: design.borderColor, background: design.panelColor, color: design.mutedTextColor }}>{t.noWaiterCalls}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {waiterCalls.map((call) => (
                <article
                  key={call.id}
                  className="relative rounded-2xl border p-4 shadow-lg animate-pulse"
                  style={{ borderColor: design.borderColor, background: `linear-gradient(135deg, ${design.panelColor} 0%, ${design.controlSurfaceColor} 100%)` }}
                >
                  <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full" style={{ background: design.primaryColor }} />
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-2xl" style={{ color: design.primaryColor }}>
                        {t.callFromTable} #{call.tableNumber}
                      </h2>
                      <p className="mt-1 text-sm" style={{ color: design.mutedTextColor }}>
                        {new Date(call.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => resolveWaiterCall(call.id)}
                      className="min-h-10 rounded-lg border px-4 py-2 text-sm transition"
                      style={{ borderColor: design.borderColor, background: design.controlSurfaceColor, color: design.successColor }}
                    >
                      {t.markAsResolved}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {busyMessage ? <p className="mt-4 text-sm" style={{ color: design.mutedTextColor }}>{busyMessage}</p> : null}
      </div>
    </main>
  );
}
