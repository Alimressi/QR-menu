import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DishSeed = {
  nameEn: string;
  nameRu: string;
  nameAz: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  price: number;
  imageUrl: string;
};

type CategorySeed = {
  nameEn: string;
  nameRu: string;
  nameAz: string;
  dishes: DishSeed[];
};

const categoriesSeed: CategorySeed[] = [
  {
    nameEn: "Starters",
    nameRu: "Стартеры",
    nameAz: "Başlanğıclar",
    dishes: [
      {
        nameEn: "Smoky Wings",
        nameRu: "Копченые крылышки",
        nameAz: "Hisli qanadlar",
        descriptionEn: "Chicken wings in spicy BBQ glaze with sesame.",
        descriptionRu: "Куриные крылышки в остром BBQ-глейзе с кунжутом.",
        descriptionAz: "Acılı BBQ sousunda toyuq qanadları, küncütlə.",
        price: 14,
        imageUrl: "/images/dish-1.svg",
      },
      {
        nameEn: "Truffle Fries",
        nameRu: "Трюфельный фри",
        nameAz: "Trufel fri",
        descriptionEn: "Crispy fries, truffle oil, parmesan and herbs.",
        descriptionRu: "Хрустящий картофель фри, трюфельное масло, пармезан и травы.",
        descriptionAz: "Xırtıldayan fri, trufel yağı, parmezan və göyərti.",
        price: 11,
        imageUrl: "/images/dish-2.svg",
      },
    ],
  },
  {
    nameEn: "Burgers",
    nameRu: "Бургеры",
    nameAz: "Burgerlər",
    dishes: [
      {
        nameEn: "Frank Smash Burger",
        nameRu: "Смэш бургер Frank",
        nameAz: "Frank smash burger",
        descriptionEn: "Double beef smash, cheddar, pickles, signature sauce.",
        descriptionRu: "Двойной смэш из говядины, чеддер, огурчики и фирменный соус.",
        descriptionAz: "İkiqat mal əti smash, çedder, turşu və xüsusi sous.",
        price: 21,
        imageUrl: "/images/dish-3.svg",
      },
      {
        nameEn: "Hot Honey Chicken Burger",
        nameRu: "Бургер с курицей и острым медом",
        nameAz: "Acı ballı toyuq burgeri",
        descriptionEn: "Crispy chicken, hot honey glaze, slaw and brioche bun.",
        descriptionRu: "Хрустящая курица, острый медовый соус, коул-слоу и бриошь.",
        descriptionAz: "Xırtıldayan toyuq, acı bal sousu, salat və briyoş bulkası.",
        price: 19,
        imageUrl: "/images/dish-4.svg",
      },
    ],
  },
  {
    nameEn: "Grill",
    nameRu: "Гриль",
    nameAz: "Qril",
    dishes: [
      {
        nameEn: "Ribeye Steak",
        nameRu: "Стейк рибай",
        nameAz: "Ribay steyk",
        descriptionEn: "Char-grilled ribeye with pepper sauce and greens.",
        descriptionRu: "Рибай на углях с перечным соусом и зеленью.",
        descriptionAz: "Kömürdə bişmiş ribay, istiot sousu və göyərti ilə.",
        price: 39,
        imageUrl: "/images/dish-1.svg",
      },
      {
        nameEn: "BBQ Baby Ribs",
        nameRu: "BBQ ребрышки",
        nameAz: "BBQ qabırğaları",
        descriptionEn: "Slow-cooked pork ribs with smoky house BBQ sauce.",
        descriptionRu: "Томленые свиные ребрышки в дымном фирменном BBQ соусе.",
        descriptionAz: "Aşağı odda bişmiş donuz qabırğaları, hisli xüsusi BBQ sousu ilə.",
        price: 32,
        imageUrl: "/images/dish-2.svg",
      },
    ],
  },
  {
    nameEn: "Drinks",
    nameRu: "Напитки",
    nameAz: "İçkilər",
    dishes: [
      {
        nameEn: "House Lemonade",
        nameRu: "Фирменный лимонад",
        nameAz: "Xüsusi limonad",
        descriptionEn: "Fresh citrus lemonade with mint.",
        descriptionRu: "Свежий цитрусовый лимонад с мятой.",
        descriptionAz: "Nanəli təzə sitrus limonadı.",
        price: 7,
        imageUrl: "/images/dish-3.svg",
      },
      {
        nameEn: "Cold Brew Cola",
        nameRu: "Холодная кола",
        nameAz: "Soyuq kola",
        descriptionEn: "Classic cola with ice and lime.",
        descriptionRu: "Классическая кола со льдом и лаймом.",
        descriptionAz: "Buz və laym ilə klassik kola.",
        price: 6,
        imageUrl: "/images/dish-4.svg",
      },
    ],
  },
];

const frankTheme = {
  brandName: "Frank by Basta",
  brandSubtitle: "Urban grill and comfort food with signature vibe.",
  primaryColor: "#c73a2d",
  accentTextColor: "#fff3e5",
  backgroundFrom: "#111111",
  backgroundTo: "#1f1a18",
  surfaceColor: "#1c1715",
  textColor: "#f5e9db",
  mutedTextColor: "#c5ac93",
  borderColor: "#5c322b",
  buttonRadius: "14px",
  cardRadius: "18px",
  tableCount: 10,
  panelColor: "#171312",
  overlayColor: "#090909",
  controlSurfaceColor: "#2a201d",
  activeChipBackground: "#c73a2d",
  activeChipTextColor: "#fff3e5",
  inactiveChipBackground: "#2a201d",
  inactiveChipTextColor: "#dbc4ae",
  dividerColor: "#5c322b",
  successColor: "#2ea66a",
  errorColor: "#d9534f",
  categoryTitleColor: "#ffd9b5",
  qtyButtonBackground: "#2a201d",
  qtyButtonTextColor: "#f5e9db",
  qtyButtonBorderColor: "#6b3c33",
  currencyMode: "symbol",
} as const;

async function main() {
  const frank = await prisma.restaurant.upsert({
    where: { slug: "frank-by-basta" },
    update: {
      name: "Frank by Basta",
      settings: JSON.stringify(frankTheme),
    },
    create: {
      name: "Frank by Basta",
      slug: "frank-by-basta",
      logoUrl: null,
      settings: JSON.stringify(frankTheme),
    },
  });

  await prisma.orderItem.deleteMany({
    where: {
      order: {
        restaurantId: frank.id,
      },
    },
  });

  await prisma.order.deleteMany({ where: { restaurantId: frank.id } });
  await prisma.waiterCall.deleteMany({ where: { restaurantId: frank.id } });
  await prisma.dish.deleteMany({ where: { restaurantId: frank.id } });
  await prisma.category.deleteMany({ where: { restaurantId: frank.id } });

  for (const categorySeed of categoriesSeed) {
    const category = await prisma.category.create({
      data: {
        nameEn: categorySeed.nameEn,
        nameRu: categorySeed.nameRu,
        nameAz: categorySeed.nameAz,
        restaurantId: frank.id,
      },
    });

    await prisma.dish.createMany({
      data: categorySeed.dishes.map((dish) => ({
        ...dish,
        categoryId: category.id,
        restaurantId: frank.id,
      })),
    });
  }

  const categoryCount = await prisma.category.count({ where: { restaurantId: frank.id } });
  const dishCount = await prisma.dish.count({ where: { restaurantId: frank.id } });

  console.log(`Frank by Basta is ready: ${categoryCount} categories, ${dishCount} dishes, tableCount=10`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
