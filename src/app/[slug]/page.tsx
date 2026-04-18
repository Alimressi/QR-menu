import { MenuClient } from "@/components/menu-client";
import prisma from "@/lib/prisma";
import { getRestaurantSettings } from "@/lib/restaurant";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function RestaurantPage({ params }: Params) {
  const { slug } = await params;

  // Get restaurant by slug
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    notFound();
  }

  // Get categories and dishes for this restaurant
  const categories = await prisma.category.findMany({
    where: { restaurantId: restaurant.id },
    include: {
      dishes: {
        where: { restaurantId: restaurant.id },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });

  const settings = await getRestaurantSettings(slug);

  return (
    <div className="min-h-screen pb-10">
      <MenuClient 
        categories={categories} 
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        settings={settings}
        logoUrl={restaurant.logoUrl}
        restaurantName={restaurant.name}
      />
    </div>
  );
}
