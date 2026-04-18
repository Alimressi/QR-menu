import { getUserRestaurantId, isAdminRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createTableAccessKey } from "@/lib/qr-token";
import { getRestaurantTableCountFromSettings } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = getUserRestaurantId(request);
  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant context is missing." }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { slug: true, settings: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const tableCount = getRestaurantTableCountFromSettings(restaurant.settings);

  const links = Array.from({ length: tableCount }, (_, index) => {
    const table = String(index + 1);
    const accessKey = createTableAccessKey(table, restaurant.slug);
    const url = `${baseUrl}/${restaurant.slug}?table=${encodeURIComponent(table)}&ak=${encodeURIComponent(accessKey)}`;

    return {
      table,
      url,
    };
  });

  return NextResponse.json({ links });
}
