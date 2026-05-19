import { AdminDashboard } from "@/components/admin-dashboard";
import prisma from "@/lib/prisma";
import type { Metadata } from "next";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!restaurant) {
    return {
      title: "Admin",
    };
  }

  return {
    title: `${restaurant.name} Admin`,
  };
}

export default async function RestaurantAdminPage({ params }: Params) {
  const { slug } = await params;

  return <AdminDashboard restaurantSlug={slug} />;
}
