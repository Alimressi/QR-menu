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
  /**
   * "pending" is where an order from a QR session starts: a guest has asked, and
   * nobody at the venue has looked at it yet. Staff move it to "new" — which is
   * what the kitchen acts on — or to "rejected", which is what an order from a
   * table nobody is sitting at gets. The two ends of the list are reachable only
   * from the panel, never from the dropdown.
   */
  status: "pending" | "new" | "preparing" | "ready" | "paid" | "rejected";
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};
