import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set for the Nine Lives import.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type CategorySeed = {
  nameEn: string;
  nameRu: string;
  nameAz: string;
};

type DishSeed = {
  nameEn: string;
  nameRu: string;
  nameAz: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  price: number;
  imageUrl: string;
  categoryNameEn: string;
};

const categories: CategorySeed[] = [
  { nameEn: "Salads", nameRu: "Салаты", nameAz: "Salatlar" },
  { nameEn: "Soups", nameRu: "Супы", nameAz: "Şorbalar" },
  { nameEn: "Appetizers", nameRu: "Закуски", nameAz: "Qəlyanaltılar" },
  { nameEn: "Sandwiches & Burgers", nameRu: "Сэндвичи и бургеры", nameAz: "Sendviçlər və burgerlər" },
  { nameEn: "Pasta", nameRu: "Паста", nameAz: "Pasta" },
  { nameEn: "Sushi", nameRu: "Суши", nameAz: "Suşi" },
  { nameEn: "Main Course", nameRu: "Основные блюда", nameAz: "Əsas yeməklər" },
  { nameEn: "Pizza Menu", nameRu: "Пицца", nameAz: "Pizza" },
  { nameEn: "Signature Cocktails", nameRu: "Авторские коктейли", nameAz: "İmza kokteylləri" },
  { nameEn: "Classic Cocktails", nameRu: "Классические коктейли", nameAz: "Klassik kokteyllər" },
  { nameEn: "Sour", nameRu: "Сауэр-коктейли", nameAz: "Sour kokteylləri" },
  { nameEn: "Hot Alcohol", nameRu: "Горячие алкогольные напитки", nameAz: "İsti alkoqollu içkilər" },
  { nameEn: "Whiskey", nameRu: "Виски", nameAz: "Viski" },
  { nameEn: "Vodka", nameRu: "Водка", nameAz: "Votka" },
  { nameEn: "Tequila", nameRu: "Текила", nameAz: "Tekila" },
  { nameEn: "Gin", nameRu: "Джин", nameAz: "Cin" },
  { nameEn: "Rum", nameRu: "Ром", nameAz: "Rom" },
  { nameEn: "Liqueurs", nameRu: "Ликеры", nameAz: "Likörlər" },
  { nameEn: "Aperitive", nameRu: "Аперитивы", nameAz: "Aperitiflər" },
  { nameEn: "Beer", nameRu: "Пиво", nameAz: "Pivə" },
  { nameEn: "Shot Section", nameRu: "Шоты", nameAz: "Shotlar" },
  { nameEn: "Lemonades", nameRu: "Лимонады", nameAz: "Limonadlar" },
  { nameEn: "Soft Drinks", nameRu: "Безалкогольные напитки", nameAz: "Sərinləşdirici içkilər" },
  { nameEn: "Coffee", nameRu: "Кофе", nameAz: "Qəhvə" },
  { nameEn: "Ice Coffee", nameRu: "Айс-кофе", nameAz: "Buzlu qəhvə" },
  { nameEn: "Dessert", nameRu: "Десерты", nameAz: "Desertlər" },
  { nameEn: "Local Red Wines", nameRu: "Местные красные вина", nameAz: "Yerli qırmızı şərablar" },
  { nameEn: "Local White Wine", nameRu: "Местные белые вина", nameAz: "Yerli ağ şərablar" },
  { nameEn: "Local Rose Wine", nameRu: "Местные розовые вина", nameAz: "Yerli roze şərablar" },
  { nameEn: "Wines", nameRu: "Вина", nameAz: "Şərablar" },
  { nameEn: "Classic Wines", nameRu: "Классические вина", nameAz: "Klassik şərablar" },
  { nameEn: "Sparkling Wines", nameRu: "Игристые вина", nameAz: "Köpüklü şərablar" },
];

const dishes: DishSeed[] = [
  {
    nameEn: "Caesar Salad",
    nameRu: "Салат Цезарь",
    nameAz: "Sezar salatı",
    descriptionEn: "Romaine lettuce, parmesan, croutons, Caesar dressing.",
    descriptionRu: "Салат романо, пармезан, крутоны, соус Цезарь.",
    descriptionAz: "Romaine salatı, parmezan, kruuton, Sezar sousu.",
    price: 18,
    imageUrl: "/uploads/caesar-salad.webp",
    categoryNameEn: "Salads",
  },
  {
    nameEn: "Greek Salad",
    nameRu: "Греческий салат",
    nameAz: "Yunan salatı",
    descriptionEn: "Tomatoes, cucumbers, olives, feta cheese, olive oil.",
    descriptionRu: "Помидоры, огурцы, оливки, сыр фета, оливковое масло.",
    descriptionAz: "Pomidor, xiyar, zeytun, feta pendiri, zeytun yağı.",
    price: 16,
    imageUrl: "/uploads/greek-salad.webp",
    categoryNameEn: "Salads",
  },
  {
    nameEn: "Cream of Mushroom",
    nameRu: "Грибной крем-суп",
    nameAz: "Göbələk krem şorbası",
    descriptionEn: "Wild mushrooms, cream, herbs, truffle oil.",
    descriptionRu: "Лесные грибы, сливки, травы, трюфельное масло.",
    descriptionAz: "Meşə göbələkləri, krem, otlar, trüf yağı.",
    price: 14,
    imageUrl: "/images/dish-3.svg",
    categoryNameEn: "Soups",
  },
  {
    nameEn: "Bruschetta Trio",
    nameRu: "Трио брускетт",
    nameAz: "Bruşetta triosu",
    descriptionEn: "Tomato basil, mushroom truffle, smoked salmon.",
    descriptionRu: "Томат базилик, грибы трюфель, копченый лосось.",
    descriptionAz: "Pomidor reyhan, göbələk trüf, hisə verilmiş qızılbalıq.",
    price: 22,
    imageUrl: "/images/dish-4.svg",
    categoryNameEn: "Appetizers",
  },
  {
    nameEn: "Classic Burger",
    nameRu: "Классический бургер",
    nameAz: "Klassik burger",
    descriptionEn: "Beef patty, cheddar, lettuce, tomato, house sauce.",
    descriptionRu: "Говяжья котлета, чеддер, салат, помидор, фирменный соус.",
    descriptionAz: "Mal əti kotleti, çedder, salat, pomidor, ev sousu.",
    price: 24,
    imageUrl: "/images/dish-1.svg",
    categoryNameEn: "Sandwiches & Burgers",
  },
  {
    nameEn: "Carbonara",
    nameRu: "Карбонара",
    nameAz: "Karbonara",
    descriptionEn: "Spaghetti, pancetta, egg yolk, parmesan, black pepper.",
    descriptionRu: "Спагетти, панчетта, яичный желток, пармезан, черный перец.",
    descriptionAz: "Spagetti, pançetta, yumurta sarısı, parmezan, qara istiot.",
    price: 26,
    imageUrl: "/images/dish-2.svg",
    categoryNameEn: "Pasta",
  },
  {
    nameEn: "Philadelphia Roll",
    nameRu: "Ролл Филадельфия",
    nameAz: "Filadelfiya rolu",
    descriptionEn: "Salmon, cream cheese, cucumber, avocado.",
    descriptionRu: "Лосось, сливочный сыр, огурец, авокадо.",
    descriptionAz: "Qızılbalıq, krem pendir, xiyar, avokado.",
    price: 20,
    imageUrl: "/uploads/5f4e5864-9f1b-4224-807c-135fb76e6d2b.webp",
    categoryNameEn: "Sushi",
  },
  {
    nameEn: "Grilled Ribeye",
    nameRu: "Рибай на гриле",
    nameAz: "Qril ribay",
    descriptionEn: "Prime ribeye, roasted vegetables, red wine reduction.",
    descriptionRu: "Прайм рибай, овощи на гриле, соус из красного вина.",
    descriptionAz: "Prime ribay, qril tərəvəzlər, qırmızı şərab sousu.",
    price: 45,
    imageUrl: "/images/dish-4.svg",
    categoryNameEn: "Main Course",
  },
  {
    nameEn: "Margherita",
    nameRu: "Маргарита",
    nameAz: "Margerita",
    descriptionEn: "San Marzano tomatoes, mozzarella, fresh basil.",
    descriptionRu: "Томаты Сан-Марцано, моцарелла, свежий базилик.",
    descriptionAz: "San Marzano pomidorları, mozzarella, təzə reyhan.",
    price: 22,
    imageUrl: "/images/dish-1.svg",
    categoryNameEn: "Pizza Menu",
  },
  {
    nameEn: "Nine Lives Special",
    nameRu: "Nine Lives Special",
    nameAz: "Nine Lives Special",
    descriptionEn: "Gin, elderflower, cucumber, lime, tonic.",
    descriptionRu: "Джин, бузина, огурец, лайм, тоник.",
    descriptionAz: "Cin, qarağat, xiyar, laym, tonik.",
    price: 18,
    imageUrl: "/images/dish-2.svg",
    categoryNameEn: "Signature Cocktails",
  },
  {
    nameEn: "Old Fashioned",
    nameRu: "Олд Фэшнд",
    nameAz: "Old Fashioned",
    descriptionEn: "Bourbon, bitters, sugar, orange peel.",
    descriptionRu: "Бурбон, биттер, сахар, апельсиновая цедра.",
    descriptionAz: "Bourbon, bitter, şəkər, portağal qabığı.",
    price: 20,
    imageUrl: "/images/dish-3.svg",
    categoryNameEn: "Classic Cocktails",
  },
  {
    nameEn: "Latte",
    nameRu: "Латте",
    nameAz: "Latte",
    descriptionEn: "Espresso with steamed milk and silky foam.",
    descriptionRu: "Эспрессо с молоком и нежной пеной.",
    descriptionAz: "Espresso, buğda südü və yumşaq köpük.",
    price: 8,
    imageUrl: "/uploads/4e152140-d5b6-4c0d-bc0c-1b55debcdb9c.webp",
    categoryNameEn: "Coffee",
  },
  {
    nameEn: "Chicken Pilaf",
    nameRu: "Плов с курицей",
    nameAz: "Toyuqlu plov",
    descriptionEn: "Rice pilaf with chicken, carrots, onion, and spices.",
    descriptionRu: "Плов с курицей, морковью, луком и специями.",
    descriptionAz: "Toyuq, kök, soğan və ədviyyatlarla hazırlanmış plov.",
    price: 24,
    imageUrl: "/uploads/85a62951-ea15-4a12-8e5b-e3af66e3459f.webp",
    categoryNameEn: "Main Course",
  },
];

async function ensureRestaurant() {
  return prisma.restaurant.upsert({
    where: { slug: "ninelives" },
    update: {
      name: "Nine Lives Bar",
      logoUrl: "/images/logo.svg",
      settings: JSON.stringify({
        theme: "dark",
        primaryColor: "#b8944f",
        photoSize: "normal",
      }),
    },
    create: {
      name: "Nine Lives Bar",
      slug: "ninelives",
      logoUrl: "/images/logo.svg",
      settings: JSON.stringify({
        theme: "dark",
        primaryColor: "#b8944f",
        photoSize: "normal",
      }),
    },
  });
}

async function upsertCategory(restaurantId: number, category: CategorySeed) {
  const existing = await prisma.category.findFirst({
    where: {
      restaurantId,
      nameEn: category.nameEn,
    },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: {
        nameRu: category.nameRu,
        nameAz: category.nameAz,
      },
    });
  }

  return prisma.category.create({
    data: {
      restaurantId,
      ...category,
    },
  });
}

async function upsertDish(restaurantId: number, categoryId: number, dish: DishSeed) {
  const existing = await prisma.dish.findFirst({
    where: {
      restaurantId,
      nameEn: dish.nameEn,
    },
  });

  const payload = {
    categoryId,
    nameRu: dish.nameRu,
    nameAz: dish.nameAz,
    descriptionEn: dish.descriptionEn,
    descriptionRu: dish.descriptionRu,
    descriptionAz: dish.descriptionAz,
    price: dish.price,
    imageUrl: dish.imageUrl,
    imagePositionX: 50,
    imagePositionY: 50,
  };

  if (existing) {
    return prisma.dish.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.dish.create({
    data: {
      restaurantId,
      categoryId,
      nameEn: dish.nameEn,
      nameRu: dish.nameRu,
      nameAz: dish.nameAz,
      descriptionEn: dish.descriptionEn,
      descriptionRu: dish.descriptionRu,
      descriptionAz: dish.descriptionAz,
      price: dish.price,
      imageUrl: dish.imageUrl,
      imagePositionX: 50,
      imagePositionY: 50,
    },
  });
}

async function main() {
  const restaurant = await ensureRestaurant();

  const categoryMap = new Map<string, number>();

  for (const category of categories) {
    const savedCategory = await upsertCategory(restaurant.id, category);
    categoryMap.set(savedCategory.nameEn, savedCategory.id);
  }

  for (const dish of dishes) {
    const categoryId = categoryMap.get(dish.categoryNameEn);

    if (!categoryId) {
      throw new Error(`Missing category for dish ${dish.nameEn}: ${dish.categoryNameEn}`);
    }

    await upsertDish(restaurant.id, categoryId, dish);
  }

  console.log(`[import] Nine Lives synced: ${categories.length} categories, ${dishes.length} dishes.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });