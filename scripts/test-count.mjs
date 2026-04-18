import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  console.log("=== Тест _count ===\n");
  
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            categories: true,
            dishes: true,
            orders: true,
          },
        },
      },
    });
    
    console.log(`Найдено ресторанов: ${restaurants.length}\n`);
    
    for (const r of restaurants) {
      console.log(`Ресторан: ${r.name}`);
      console.log(`  _count:`, r._count);
      console.log(`  categories: ${r._count?.categories || 0}`);
      console.log(`  dishes: ${r._count?.dishes || 0}`);
      console.log(`  orders: ${r._count?.orders || 0}`);
      console.log();
    }
    
    console.log("=== ✅ Тест завершён ===");
  } catch (error) {
    console.error("\n=== ❌ Ошибка ===");
    console.error(error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
