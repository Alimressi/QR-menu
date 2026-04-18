import { isAdminSessionActive } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createTableAccessKey } from "@/lib/qr-token";
import { getRestaurantTableCountFromSettings } from "@/lib/restaurant";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  try {
    // Check if admin is logged in
    const isAuthenticated = await isAdminSessionActive();
    if (!isAuthenticated) {
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin;
    const tableCount = getRestaurantTableCountFromSettings(restaurant.settings);

    const results = await Promise.all(
      Array.from({ length: tableCount }, async (_, index) => {
        const table = String(index + 1);
        const accessKey = createTableAccessKey(table, restaurant.slug);
        const url = `${baseUrl}/${restaurant.slug}?table=${encodeURIComponent(table)}&ak=${encodeURIComponent(accessKey)}`;

        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        return {
          table,
          url,
          dataUrl,
        };
      })
    );

    return NextResponse.json({ qrCodes: results });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate QR codes" }, { status: 500 });
  }
}
