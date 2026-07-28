import { MenuClient } from "@/components/menu-client";
import prisma from "@/lib/prisma";
import { getPublicSettingsFromRaw } from "@/lib/restaurant";
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

  // The restaurant (name + theme) comes straight from Prisma: a Worker fetching
  // its own URL is unreliable, so the self-fetch used to return null and the page
  // fell back to the dark default theme, flashing before the client corrected it.
  // Categories (the bulk) still use the cached edge API.
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true, settings: true },
  });
  const categories = restaurant ? await fetchCategories(restaurant.id) : [];
  // Credentials live in the same settings blob and would otherwise be serialized
  // into the client props (visible in the page's RSC payload) — strip them here.
  const settings = getPublicSettingsFromRaw(restaurant?.settings);

  // Paint the page background from the restaurant theme server-side, so the very
  // first frame is the right colour instead of flashing the global dark default.
  const bgFrom = (settings?.backgroundFrom as string) || "#0a0a0a";
  const bgTo = (settings?.backgroundTo as string) || "#0d0d0d";
  const pageBackground = `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`;

  return (
    <div className="min-h-screen pb-10" style={{ background: pageBackground }}>
      <style dangerouslySetInnerHTML={{ __html: `body{background:${pageBackground}}` }} />
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
