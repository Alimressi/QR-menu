import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// GamePoint's printed menu (three boards: snacks/burgers, drinks, and the VIP
// spirits board) applied over what the database already held.
//
// Existing dishes are updated in place rather than replaced, because each one
// already carries a photo at /images/dishes/dish-<id>.jpg and that filename is
// its id. Categories are renamed and dishes moved between them for the same
// reason: it keeps every id, and with it every photo.
//
// Usage: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/update-gamepoint-menu.ts

type DishSpec = { id?: number; az: string; price: number; desc?: string };
type CategorySpec = { az: string; ru: string; en: string; dishes: DishSpec[] };

// In the order the boards read: left column top to bottom, then right.
const MENU: CategorySpec[] = [
  {
    az: "Qəlyanaltılar", ru: "Закуски", en: "Snacks",
    dishes: [
      { id: 225, az: "Popkorn", price: 2.5 },
      { id: 226, az: "Araxis", price: 4 },
      { id: 227, az: "Fri Kartof", price: 3.9 },
      { id: 228, az: "Nuggets", price: 6 },
      { id: 229, az: "Fıstıq", price: 8 },
      { id: 230, az: "Suxari", price: 4 },
      { id: 231, az: "Cips", price: 4 },
      { id: 232, az: "Kənd Sayağı Kartof", price: 4.5 },
      { id: 233, az: "Düşbərə", price: 5.5 },
      { id: 234, az: "Sacaqlı Pendir", price: 4 },
      { id: 235, az: "Qızardılmış Gürza", price: 6 },
      { id: 236, az: "Ət Basdırma", price: 7 },
      { id: 237, az: "İveria Sosisləri", price: 6 },
    ],
  },
  {
    az: "Pizzalar", ru: "Пиццы", en: "Pizzas",
    dishes: [
      { az: "Marqarita Pizza", price: 12 },
      { az: "Toyuqlu Pizza", price: 14 },
      { az: "Sucuklu Pizza", price: 16 },
      { az: "Qarışıq Pizza", price: 18 },
    ],
  },
  {
    az: "Kombolar", ru: "Комбо", en: "Combos",
    dishes: [
      { id: 256, az: "Chicken Roll + Fri + Cola 500 ml", price: 9 },
      { id: 257, az: "Vetçinalı Sendviç + Fri + Cola 500 ml", price: 8.5 },
      { id: 258, az: "Çay + Qəlyan + Şokolad", price: 20 },
      { id: 259, az: "Nuggets Burger + Fri + Cola 500 ml", price: 10.5 },
      { id: 260, az: "Saurma + Fri + Cola 500 ml", price: 8.5 },
      { id: 261, az: "Nuggets + Fri + Cola 0.5 L", price: 10 },
      { id: 262, az: "Chicken Barbekü Burger + Fri + Cola 0.5 L", price: 10.5 },
      { id: 263, az: "Cheese Burger + Fri + Cola 500 ml", price: 12.5 },
    ],
  },
  {
    az: "Sendviç / Burger", ru: "Сэндвичи и бургеры", en: "Sandwiches & Burgers",
    dishes: [
      { id: 238, az: "Sosisli Pendirli Tost", price: 4.5 },
      { id: 239, az: "Sosisli Tost", price: 4 },
      { id: 240, az: "Vetçinalı Sendviç", price: 4.5 },
      { id: 241, az: "Nuggets Burger", price: 5.5 },
      { id: 242, az: "Chicken Barbekü Burger", price: 6 },
      { id: 243, az: "Chicken Roll", price: 5 },
      { id: 244, az: "Saurma", price: 4.9 },
      { id: 245, az: "Hotdog", price: 4.9 },
      { id: 246, az: "Cheese Burger", price: 7 },
    ],
  },
  {
    az: "Qəlyanlar", ru: "Кальяны", en: "Hookah",
    dishes: [
      { id: 247, az: "Qəlyan Caskada", price: 15 },
      { id: 248, az: "Qəlyan Almada", price: 18 },
      { id: 249, az: "Qəlyan Qreyfrutda", price: 20 },
    ],
  },
  {
    az: "Pivə", ru: "Пиво", en: "Beer",
    dishes: [
      { id: 250, az: "Xirdalan Sadə", price: 5 },
      { id: 251, az: "Xirdalan No Filter", price: 5 },
      { id: 252, az: "Xirdalan 0", price: 5 },
      { id: 253, az: "Xirdalan Draft", price: 6 },
      { id: 254, az: "Calsberg", price: 6.5 },
      { id: 255, az: "Blanc 1664", price: 7 },
    ],
  },
  {
    az: "Setlər", ru: "Сеты", en: "Sets",
    dishes: [
      { id: 300, az: "Set 32 AZN", price: 32, desc: "Çay, şokolad, qəlyan, 2 saat VIP kabinet" },
      {
        id: 301, az: "Set 48 AZN", price: 48,
        desc: "Şaurma 4 ədəd, kartof fri 4 ədəd, Coca Cola 0.3 l 4 ədəd, çay, şokolad, qəlyan, 2 saat VIP kabinet",
      },
      {
        id: 302, az: "Set 70 AZN", price: 70,
        desc: "Burger nuggets 4 ədəd, kartof fri 4 ədəd, Coca Cola 0.3 l 4 ədəd, cips 2 ədəd, çay, mürəbbə, qəlyan, 2 saat VIP kabinet",
      },
    ],
  },
  {
    az: "Soyuq İçkilər", ru: "Холодные напитки", en: "Cold Drinks",
    dishes: [
      { id: 264, az: "Cola / Fanta / Sprite 330 ml", price: 3.5 },
      { id: 265, az: "Cola / Fanta / Sprite 300 ml", price: 1.5 },
      { id: 266, az: "Cola / Fanta / Sprite 500 ml", price: 2.5 },
      { id: 267, az: "Cola / Fanta / Sprite 1 L", price: 3.9 },
      { id: 268, az: "Fuse Tea Banka", price: 3.5 },
      { id: 269, az: "Fuse Tea 1 L", price: 4 },
      { id: 270, az: "Red Bull", price: 6 },
      { id: 271, az: "Sirab Qazlı", price: 2.5 },
      { id: 272, az: "Bizon", price: 2 },
      { id: 273, az: "Bizon Cyber", price: 2.5 },
      { id: 274, az: "Bizon White Diamond", price: 2.5 },
      { id: 275, az: "Ayran", price: 1.5 },
      { id: 276, az: "Sirab 500 ml", price: 2 },
      { id: 277, az: "Hand Made Limonad", price: 5.5 },
    ],
  },
  {
    az: "İsti İçkilər", ru: "Горячие напитки", en: "Hot Drinks",
    dishes: [
      { id: 278, az: "Çay Sadə", price: 4 },
      { id: 279, az: "Çay Fincan", price: 1.5 },
      { id: 280, az: "Amerikan", price: 4 },
      { id: 281, az: "Südlü Qəhvə", price: 4 },
      { id: 282, az: "İsti Şokolad", price: 5 },
      { id: 283, az: "Kakao Marshmallow", price: 5 },
    ],
  },
  {
    az: "Mürəbbə", ru: "Варенье", en: "Preserves",
    dishes: [
      { id: 288, az: "Snickers", price: 6 },
      { id: 289, az: "Bounty", price: 6 },
      { id: 290, az: "Ağ Gilas", price: 5 },
      { id: 291, az: "Çiyələk", price: 5 },
      { id: 292, az: "Plombir", price: 6 },
    ],
  },
  {
    az: "Smoothie", ru: "Смузи", en: "Smoothie",
    dishes: [
      { id: 284, az: "Milkshake", price: 6.5 },
      { id: 285, az: "Banana və Karamell", price: 7.5 },
      { id: 286, az: "Giləmeyvəli", price: 7.5 },
      { id: 287, az: "Çiyələk və Qarağat", price: 7.5 },
    ],
  },
  {
    az: "Şirniyyat", ru: "Сладкое", en: "Sweets",
    dishes: [
      { id: 293, az: "Şokolad", price: 4.5 },
      { id: 294, az: "Snickers", price: 3.5 },
      { id: 295, az: "Ballı Tort", price: 7 },
      { id: 296, az: "Profiterol", price: 7 },
      { id: 297, az: "Qarışıq Ləbləbi", price: 12 },
      { id: 298, az: "Dondurma", price: 6 },
      { id: 299, az: "Kukers", price: 5 },
    ],
  },
  {
    az: "Spirtli İçkilər", ru: "Крепкий алкоголь", en: "Spirits",
    dishes: [
      { az: "Jameson 1 litr", price: 85 },
      { az: "Jagermeister 1 litr", price: 80 },
      { az: "Tekilla Sierra 1 litr", price: 80 },
      { az: "Jack Daniels 500 ml", price: 65 },
      { az: "Meysəri", price: 33 },
    ],
  },
  {
    az: "VIP Setlər", ru: "VIP сеты", en: "VIP Sets",
    dishes: [
      {
        az: "Jameson Seti", price: 139,
        desc: "Jameson 1 litr, meyvə assorti, qəlyan saxsı, 4 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet",
      },
      {
        az: "Jagermeister Seti", price: 129,
        desc: "Jagermeister 1 litr, meyvə assorti, qəlyan saxsı, 4 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet",
      },
      {
        az: "Sierra Tekilla Seti", price: 129,
        desc: "Sierra Tekilla 1 litr, meyvə assorti, qəlyan saxsı, 4 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet",
      },
      {
        az: "Şərab Seti", price: 75,
        desc: "Meysəri, meyvə assorti, qəlyan saxsı, 3 saat VIP kabinet",
      },
      {
        az: "Jack Daniel Seti 0.5", price: 99,
        desc: "Meyvə assorti, qəlyan saxsı, 2 ədəd Red Bull, meyvə şirəsi 1 litr, 3 saat VIP kabinet",
      },
    ],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL must be set.");

  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: "gamepoint" }, select: { id: true } });
  if (!restaurant) throw new Error('No restaurant with slug "gamepoint".');

  const oldCategories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  // Reuse the category rows there are, in id order, so the sections keep the
  // order the board reads in; add rows for the sections the board gained.
  const categoryIds: number[] = [];
  for (const [index, category] of MENU.entries()) {
    const existing = oldCategories[index];
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { nameAz: category.az, nameRu: category.ru, nameEn: category.en },
      });
      categoryIds.push(existing.id);
    } else {
      const created = await prisma.category.create({
        data: { restaurantId: restaurant.id, nameAz: category.az, nameRu: category.ru, nameEn: category.en },
      });
      categoryIds.push(created.id);
    }
  }

  // The guest menu lists dishes newest first, so each is stamped a second older
  // than the one above it to hold the board's order.
  const firstStampedAt = Date.now();
  let position = 0;
  let updated = 0;
  let created = 0;

  for (const [index, category] of MENU.entries()) {
    for (const dish of category.dishes) {
      const data = {
        categoryId: categoryIds[index],
        nameAz: dish.az,
        nameRu: dish.az,
        nameEn: dish.az,
        descriptionAz: dish.desc ?? "",
        descriptionRu: dish.desc ?? "",
        descriptionEn: dish.desc ?? "",
        price: dish.price,
        createdAt: new Date(firstStampedAt - position * 1000),
      };
      position += 1;

      if (dish.id) {
        await prisma.dish.update({ where: { id: dish.id }, data });
        updated += 1;
      } else {
        await prisma.dish.create({ data: { ...data, restaurantId: restaurant.id, imageUrl: "" } });
        created += 1;
      }
    }
  }

  const wanted = new Set(MENU.flatMap((c) => c.dishes.map((d) => d.id)).filter(Boolean) as number[]);
  const strays = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id, id: { notIn: [...wanted] } },
    select: { id: true, nameAz: true, categoryId: true },
  });
  const orphaned = strays.filter((dish) => !categoryIds.includes(dish.categoryId));
  if (orphaned.length > 0) {
    console.log("Dishes left over from the old menu:", orphaned.map((d) => `${d.id} ${d.nameAz}`).join(", "));
  }

  const surplus = oldCategories.slice(MENU.length);
  if (surplus.length > 0) {
    await prisma.category.deleteMany({ where: { id: { in: surplus.map((c) => c.id) } } });
  }

  const total = await prisma.dish.count({ where: { restaurantId: restaurant.id } });
  console.log(`gamepoint: ${updated} dishes updated, ${created} added — ${total} in ${MENU.length} categories.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
