import { AdminDashboard } from "@/components/admin-dashboard";

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function RestaurantAdminPage({ params }: Params) {
  const { slug } = await params;

  return <AdminDashboard restaurantSlug={slug} />;
}
