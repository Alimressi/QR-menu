export type Language = "en" | "ru" | "az";

export type DishOption = {
  id: number;
  dishId: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
  price: number; // Доплата за опцию
};

export type Dish = {
  id: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  price: number;
  imageUrl: string;
  imagePositionX: number;
  imagePositionY: number;
  categoryId: number;
  /** On today's stop list — shown in the menu but not orderable. */
  soldOut?: boolean;
  options?: DishOption[];
};

export type CategoryWithDishes = {
  id: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
  dishes: Dish[];
};

export type OrderItem = {
  id: number;
  /** When this line appeared. Later than the order means a second round. */
  createdAt?: string;
  /** Moves when the quantity is topped up on an existing line. */
  updatedAt?: string;
  dishId: number;
  optionId?: number;
  quantity: number;
  price: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
  optionNameEn?: string;
  optionNameRu?: string;
  optionNameAz?: string;
};

export type Order = {
  id: number;
  /**
   * Per-restaurant running number shown to staff: 1, 2, 3... in the order
   * placed. `id` is a global sequence across every restaurant, so it reads with
   * gaps that look like lost orders. Absent on endpoints that do not compute it.
   */
  displayNumber?: number;
  tableNumber: string;
  status: "new" | "preparing" | "ready" | "paid";
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};
