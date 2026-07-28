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

// Base URL works in both Cloudflare Workers (NEXT_PUBLIC_BASE_URL set) and local dev.
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
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

  // Read straight from Prisma — the API self-fetch is unreliable on the Worker and
  // used to return null here, so the tab/preview title fell back to the raw slug
  // ("lumiere" instead of "Lumière").
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, logoUrl: true, settings: true },
  });

  if (!restaurant) {
    return { title: slug };
  }

  const settings = getPublicSettingsFromRaw(restaurant.settings);
  const description =
    (typeof settings?.brandSubtitle === "string" && settings.brandSubtitle.trim()) ||
    "Elegant bar & lounge QR menu. Craft cocktails, fine dishes, timeless atmosphere.";

  // Give social crawlers a real preview image: the restaurant logo if it has one,
  // otherwise its first dish photo. Without og:image LinkedIn refuses to save the
  // link to "Featured".
  let image = restaurant.logoUrl ?? null;
  if (!image) {
    const dish = await prisma.dish.findFirst({
      where: { restaurantId: restaurant.id },
      select: { imageUrl: true },
      orderBy: { id: "asc" },
    });
    image = dish?.imageUrl ?? null;
  }
  const images = image ? [{ url: image, alt: restaurant.name }] : undefined;

  return {
    title: restaurant.name,
    description,
    openGraph: {
      title: restaurant.name,
      description,
      url: `/${slug}`,
      siteName: restaurant.name,
      type: "website",
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: restaurant.name,
      description,
      images: image ? [image] : undefined,
    },
  };
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
