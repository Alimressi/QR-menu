import { MenuClient } from "@/components/menu-client";
import prisma from "@/lib/prisma";
import { getRestaurantSettings } from "@/lib/restaurant";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const defaultRestaurant = await prisma.restaurant.findFirst({
    orderBy: { id: "asc" },
    select: { id: true, slug: true, name: true, logoUrl: true },
  });

  if (!defaultRestaurant) {
    return (
      <div className="min-h-screen p-6 text-gold-100">
        <p>No restaurants found. Create one in super admin panel.</p>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    where: { restaurantId: defaultRestaurant.id },
    include: {
      dishes: {
        where: { restaurantId: defaultRestaurant.id },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const settings = await getRestaurantSettings(defaultRestaurant.slug);

  return (
    <div className="min-h-screen pb-10">
      <MenuClient
        categories={categories}
        restaurantId={defaultRestaurant.id}
        restaurantSlug={defaultRestaurant.slug}
        settings={settings}
        logoUrl={defaultRestaurant.logoUrl}
        restaurantName={defaultRestaurant.name}
      />
    </div>
  );
}
