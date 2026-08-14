import { findRestaurantBySlug } from "@/lib/menu-query";
import { stripSensitiveSettings } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = String(searchParams.get("slug") || "").trim();

  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }

  const restaurant = await findRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  // Strip admin credentials out of the settings blob before it leaves the server.
  // Subscription fields are dropped here too: this response is public, and the
  // shape it has always had is id/name/slug/logoUrl/settings.
  const publicRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    logoUrl: restaurant.logoUrl,
    settings: stripSensitiveSettings(restaurant.settings),
  };

  return NextResponse.json({ restaurant: publicRestaurant }, {
    headers: {
      // Cache at the edge for 5 min; serve stale for up to 10 min while revalidating.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
