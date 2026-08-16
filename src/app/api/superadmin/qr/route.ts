import { isSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { publicOriginFrom } from "@/lib/public-origin";
import { createTableAccessKey } from "@/lib/qr-token";
import { getRestaurantTableCountFromSettings } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Super admin only: this mints table access keys for an arbitrary
    // restaurant. A restaurant admin has /api/admin/qr-links, which is scoped to
    // their own venue.
    if (!isSuperAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = Number(searchParams.get("restaurantId"));

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true, settings: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Never NEXT_PUBLIC_BASE_URL: it is baked in at build time and would put
    // localhost into every printed QR code. See src/lib/public-origin.ts.
    const baseUrl = publicOriginFrom(request);
    const tableCount = getRestaurantTableCountFromSettings(restaurant.settings);

    const results = Array.from({ length: tableCount }, (_, index) => {
      const table = String(index + 1);
      const accessKey = createTableAccessKey(table, restaurant.slug);
      const url = `${baseUrl}/${restaurant.slug}?table=${encodeURIComponent(table)}&ak=${encodeURIComponent(accessKey)}`;

      return {
        table,
        url,
      };
    });

    return NextResponse.json({ qrCodes: results });
  } catch {
    return NextResponse.json({ error: "Failed to generate QR codes" }, { status: 500 });
  }
}
