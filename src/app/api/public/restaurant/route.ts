import prisma from "@/lib/prisma";
import { stripSensitiveSettings } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = String(searchParams.get("slug") || "").trim();

  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      settings: true,
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  // Strip admin credentials out of the settings blob before it leaves the server.
  const publicRestaurant = {
    ...restaurant,
    settings: stripSensitiveSettings(restaurant.settings),
  };

  return NextResponse.json({ restaurant: publicRestaurant }, {
    headers: {
      // Cache at the edge for 5 min; serve stale for up to 10 min while revalidating.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
