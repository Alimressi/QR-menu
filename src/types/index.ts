export type Language = "en" | "ru" | "az";

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
  quantity: number;
  price: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
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
