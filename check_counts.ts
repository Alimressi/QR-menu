import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const restaurantSlug = 'ninelives'
  
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    include: {
      _count: {
        select: {
          categories: true,
          dishes: true,
          orders: true,
          waiterCalls: true,
        }
      }
    }
  })

  if (!restaurant) {
    console.error(`Restaurant with slug '${restaurantSlug}' not found.`)
    process.exit(1)
  }

  const orderItemsCount = await prisma.orderItem.count({
    where: {
      order: {
        restaurantId: restaurant.id
      }
    }
  })

  console.log('Counts for restaurant:', restaurant.name, '(' + restaurantSlug + ')')
  console.log('Categories:', restaurant._count.categories)
  console.log('Dishes:', restaurant._count.dishes)
  console.log('Orders:', restaurant._count.orders)
  console.log('OrderItems:', orderItemsCount)
  console.log('WaiterCalls:', restaurant._count.waiterCalls)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
