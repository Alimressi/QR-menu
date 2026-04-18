import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.waiterCall.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create first restaurant (Nine Lives Bar)
  const restaurant = await prisma.restaurant.create({
    data: {
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

  const restaurantId = restaurant.id;

  // 1. Salads
  const salads = await prisma.category.create({
    data: {
      nameEn: "Salads",
      nameRu: "Салаты",
      nameAz: "Salatlar",
      restaurantId,
    },
  });

  // 2. Soups
  const soups = await prisma.category.create({
    data: {
      nameEn: "Soups",
      nameRu: "Супы",
      nameAz: "Şorbalar",
      restaurantId,
    },
  });

  // 3. Appetizers
  const appetizers = await prisma.category.create({
    data: {
      nameEn: "Appetizers",
      nameRu: "Закуски",
      nameAz: "Qəlyanaltılar",
      restaurantId,
    },
  });

  // 4. Sandwiches & Burgers
  const sandwiches = await prisma.category.create({
    data: {
      nameEn: "Sandwiches & Burgers",
      nameRu: "Сэндвичи и бургеры",
      nameAz: "Sendviçlər və burgerlər",
      restaurantId,
    },
  });

  // 5. Pasta
  const pasta = await prisma.category.create({
    data: {
      nameEn: "Pasta",
      nameRu: "Паста",
      nameAz: "Pasta",
      restaurantId,
    },
  });

  // 6. Sushi
  const sushi = await prisma.category.create({
    data: {
      nameEn: "Sushi",
      nameRu: "Суши",
      nameAz: "Suşi",
      restaurantId,
    },
  });

  // 7. Main Course
  const mainCourse = await prisma.category.create({
    data: {
      nameEn: "Main Course",
      nameRu: "Основные блюда",
      nameAz: "Əsas yeməklər",
      restaurantId,
    },
  });

  // 8. Pizza
  const pizza = await prisma.category.create({
    data: {
      nameEn: "Pizza",
      nameRu: "Пицца",
      nameAz: "Pizza",
      restaurantId,
    },
  });

  // 9. Signature Cocktails
  const signatureCocktails = await prisma.category.create({
    data: {
      nameEn: "Signature Cocktails",
      nameRu: "Авторские коктейли",
      nameAz: "İmza kokteylləri",
      restaurantId,
    },
  });

  // 10. Classic Cocktails
  const classicCocktails = await prisma.category.create({
    data: {
      nameEn: "Classic Cocktails",
      nameRu: "Классические коктейли",
      nameAz: "Klassik kokteyllər",
      restaurantId,
    },
  });

  // Sample dishes for each category
  await prisma.dish.createMany({
    data: [
      // Salads
      {
        nameEn: "Caesar Salad",
        nameRu: "Салат Цезарь",
        nameAz: "Sezar salatı",
        descriptionEn: "Romaine lettuce, parmesan, croutons, Caesar dressing.",
        descriptionRu: "Салат романо, пармезан, крутоны, соус Цезарь.",
        descriptionAz: "Romaine salatı, parmezan, kruuton, Sezar sousu.",
        price: 18,
        imageUrl: "/images/dish-1.svg",
        categoryId: salads.id,
        restaurantId,
      },
      {
        nameEn: "Greek Salad",
        nameRu: "Греческий салат",
        nameAz: "Yunan salatı",
        descriptionEn: "Tomatoes, cucumbers, olives, feta cheese, olive oil.",
        descriptionRu: "Помидоры, огурцы, оливки, сыр фета, оливковое масло.",
        descriptionAz: "Pomidor, xiyar, zeytun, feta pendiri, zeytun yağı.",
        price: 16,
        imageUrl: "/images/dish-2.svg",
        categoryId: salads.id,
        restaurantId,
      },
      // Soups
      {
        nameEn: "Cream of Mushroom",
        nameRu: "Грибной крем-суп",
        nameAz: "Göbələk krem şorbası",
        descriptionEn: "Wild mushrooms, cream, herbs, truffle oil.",
        descriptionRu: "Лесные грибы, сливки, травы, трюфельное масло.",
        descriptionAz: "Meşə göbələkləri, krem, otlar, trüf yağı.",
        price: 14,
        imageUrl: "/images/dish-3.svg",
        categoryId: soups.id,
        restaurantId,
      },
      // Appetizers
      {
        nameEn: "Bruschetta Trio",
        nameRu: "Трио брускетт",
        nameAz: "Bruşetta triosu",
        descriptionEn: "Tomato basil, mushroom truffle, smoked salmon.",
        descriptionRu: "Томат базилик, грибы трюфель, копченый лосось.",
        descriptionAz: "Pomidor reyhan, göbələk trüf, hisə verilmiş qızılbalıq.",
        price: 22,
        imageUrl: "/images/dish-4.svg",
        categoryId: appetizers.id,
        restaurantId,
      },
      // Sandwiches & Burgers
      {
        nameEn: "Classic Burger",
        nameRu: "Классический бургер",
        nameAz: "Klassik burger",
        descriptionEn: "Beef patty, cheddar, lettuce, tomato, house sauce.",
        descriptionRu: "Говяжья котлета, чеддер, салат, помидор, фирменный соус.",
        descriptionAz: "Mal əti kotleti, çedder, salat, pomidor, ev sousu.",
        price: 24,
        imageUrl: "/images/dish-1.svg",
        categoryId: sandwiches.id,
        restaurantId,
      },
      // Pasta
      {
        nameEn: "Carbonara",
        nameRu: "Карбонара",
        nameAz: "Karbonara",
        descriptionEn: "Spaghetti, pancetta, egg yolk, parmesan, black pepper.",
        descriptionRu: "Спагетти, панчетта, яичный желток, пармезан, черный перец.",
        descriptionAz: "Spagetti, pançetta, yumurta sarısı, parmezan, qara istiot.",
        price: 26,
        imageUrl: "/images/dish-2.svg",
        categoryId: pasta.id,
        restaurantId,
      },
      // Sushi
      {
        nameEn: "Philadelphia Roll",
        nameRu: "Ролл Филадельфия",
        nameAz: "Filadelfiya rolu",
        descriptionEn: "Salmon, cream cheese, cucumber, avocado.",
        descriptionRu: "Лосось, сливочный сыр, огурец, авокадо.",
        descriptionAz: "Qızılbalıq, krem pendir, xiyar, avokado.",
        price: 20,
        imageUrl: "/images/dish-3.svg",
        categoryId: sushi.id,
        restaurantId,
      },
      // Main Course
      {
        nameEn: "Grilled Ribeye",
        nameRu: "Рибай на гриле",
        nameAz: "Qril ribay",
        descriptionEn: "Prime ribeye, roasted vegetables, red wine reduction.",
        descriptionRu: "Прайм рибай, овощи на гриле, соус из красного вина.",
        descriptionAz: "Prime ribay, qril tərəvəzlər, qırmızı şərab sousu.",
        price: 45,
        imageUrl: "/images/dish-4.svg",
        categoryId: mainCourse.id,
        restaurantId,
      },
      // Pizza
      {
        nameEn: "Margherita",
        nameRu: "Маргарита",
        nameAz: "Margerita",
        descriptionEn: "San Marzano tomatoes, mozzarella, fresh basil.",
        descriptionRu: "Томаты Сан Марцано, моцарелла, свежий базилик.",
        descriptionAz: "San Marzano pomidorları, mozzarella, təzə reyhan.",
        price: 22,
        imageUrl: "/images/dish-1.svg",
        categoryId: pizza.id,
        restaurantId,
      },
      // Signature Cocktails
      {
        nameEn: "Nine Lives Special",
        nameRu: "Nine Lives Special",
        nameAz: "Nine Lives Special",
        descriptionEn: "Gin, elderflower, cucumber, lime, tonic.",
        descriptionRu: "Джин, бузина, огурец, лайм, тоник.",
        descriptionAz: "Cin, qarağat, xiyar, laym, tonik.",
        price: 18,
        imageUrl: "/images/dish-2.svg",
        categoryId: signatureCocktails.id,
        restaurantId,
      },
      // Classic Cocktails
      {
        nameEn: "Old Fashioned",
        nameRu: "Олд Фэшнд",
        nameAz: "Old Fashioned",
        descriptionEn: "Bourbon, bitters, sugar, orange peel.",
        descriptionRu: "Бурбон, биттер, сахар, апельсиновая цедра.",
        descriptionAz: "Bourbon, bitter, şəkər, portağal qabığı.",
        price: 20,
        imageUrl: "/images/dish-3.svg",
        categoryId: classicCocktails.id,
        restaurantId,
      },
    ],
  });

  // Keep Frank by Basta available even when only the base seed is executed.
  await prisma.restaurant.upsert({
    where: { slug: "frank-by-basta" },
    update: {
      name: "Frank by Basta",
      settings: JSON.stringify({
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
      }),
    },
    create: {
      name: "Frank by Basta",
      slug: "frank-by-basta",
      logoUrl: null,
      settings: JSON.stringify({
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
      }),
    },
  });
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
