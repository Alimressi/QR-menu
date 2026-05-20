import { MenuClient } from "@/components/menu-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  // Fetch from the cached edge API — no Prisma/WASM needed in SSR.
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/public/restaurant?slug=${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) {
      const data = (await res.json()) as { restaurant?: { name?: string } };
      if (data.restaurant?.name) {
        return { title: data.restaurant.name };
      }
    }
  } catch {
    // fallback below
  }
  return { title: slug };
}

export default async function RestaurantPage({ params }: Params) {
  const { slug } = await params;

  // No DB queries in SSR — eliminates Prisma WASM cold-start CPU spikes (CF Error 1102).
  // MenuClient fetches all data client-side from cached API routes.
  return (
    <div className="min-h-screen pb-10">
      <MenuClient categories={[]} restaurantSlug={slug} />
    </div>
  );
}
