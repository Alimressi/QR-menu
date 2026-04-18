import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log("=== Тестирование API ===\n");
  
  try {
    // 1. Проверяем подключение к БД
    console.log("1. Проверка подключения к БД...");
    const restaurantCount = await prisma.restaurant.count();
    console.log(`   ✅ Ресторанов в БД: ${restaurantCount}`);
    
    // 2. Получаем список ресторанов
    console.log("\n2. Получаем рестораны...");
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log(`   ✅ Найдено ресторанов: ${restaurants.length}`);
    
    for (const r of restaurants) {
      console.log(`   - ID ${r.id}: ${r.name} (slug: ${r.slug})`);
    }
    
    // 3. Проверяем схему
    console.log("\n3. Проверка структуры ресторана...");
    if (restaurants.length > 0) {
      const first = restaurants[0];
      console.log("   Поля:", Object.keys(first).join(", "));
    }
    
    console.log("\n=== ✅ Всё работает! ===");
  } catch (error) {
    console.error("\n=== ❌ Ошибка ===");
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
