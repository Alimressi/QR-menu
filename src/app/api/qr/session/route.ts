import { createQrSessionToken, verifyTableAccessKey } from "@/lib/qr-token";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tableNumber = String(body?.tableNumber || "").trim();
    const accessKey = String(body?.accessKey || "").trim();
    const restaurantSlug = String(body?.restaurantSlug || "").trim();

    if (!tableNumber || !accessKey || !restaurantSlug) {
      return NextResponse.json({ error: "Restaurant, table and access key are required." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
      select: { id: true, slug: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    if (!verifyTableAccessKey(tableNumber, restaurant.slug, accessKey)) {
      return NextResponse.json({ error: "Invalid QR link. Please use the table QR code." }, { status: 401 });
    }

    const sessionToken = createQrSessionToken(tableNumber, restaurant.id);

    return NextResponse.json({
      tableNumber,
      restaurantId: restaurant.id,
      sessionToken,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create QR session." }, { status: 500 });
  }
}
