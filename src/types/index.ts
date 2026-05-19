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
  tableNumber: string;
  status: "new" | "preparing" | "ready" | "paid";
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};
