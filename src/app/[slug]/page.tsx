import { MenuClient } from "@/components/menu-client";
import type { CategoryWithDishes } from "@/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ slug: string }>;
};

type RestaurantApiData = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: string | null;
};

// Base URL works in both Cloudflare Workers (NEXT_PUBLIC_BASE_URL set) and local dev.
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
}

async function fetchRestaurant(slug: string): Promise<RestaurantApiData | null> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/public/restaurant?slug=${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { restaurant?: RestaurantApiData };
    return data.restaurant ?? null;
  } catch {
    return null;
  }
}

async function fetchCategories(restaurantId: number): Promise<CategoryWithDishes[]> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/categories?restaurantId=${restaurantId}`,
    );
    if (!res.ok) return [];
    return (await res.json()) as CategoryWithDishes[];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await fetchRestaurant(slug);
  return { title: restaurant?.name ?? slug };
}

export default async function RestaurantPage({ params }: Params) {
  const { slug } = await params;

  // SSR via cached edge API — avoids direct Prisma WASM in SSR while still
  // delivering fully-rendered HTML to every device (including mobile Safari).
  // Cloudflare caches /api/public/restaurant and /api/categories for 5 min,
  // so only the first request per edge PoP hits the DB.
  const restaurant = await fetchRestaurant(slug);
  const categories = restaurant ? await fetchCategories(restaurant.id) : [];
  const settings = restaurant?.settings
    ? (JSON.parse(restaurant.settings) as Record<string, unknown>)
    : undefined;

  return (
    <div className="min-h-screen pb-10">
      <MenuClient
        categories={categories}
        restaurantSlug={slug}
        restaurantId={restaurant?.id}
        settings={settings as Parameters<typeof MenuClient>[0]["settings"]}
        restaurantName={restaurant?.name}
        logoUrl={restaurant?.logoUrl}
      />
    </div>
  );
}
