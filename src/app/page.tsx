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
        include: {
          options: {
            orderBy: {
              id: "asc",
            },
          },
        },
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

  // First-frame background from the restaurant theme (avoids the dark default flash).
  const bgFrom = settings?.backgroundFrom || "#0a0a0a";
  const bgTo = settings?.backgroundTo || "#0d0d0d";
  const pageBackground = `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`;

  return (
    <div className="min-h-screen pb-10" style={{ background: pageBackground }}>
      <style dangerouslySetInnerHTML={{ __html: `body{background:${pageBackground}}` }} />
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
