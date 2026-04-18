import prisma from "@/lib/prisma";
import { getRestaurantServiceModeFromSettings } from "@/lib/restaurant";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tableNumber = String(body?.tableNumber || "").trim();
    const restaurantId = Number(body?.restaurantId);

    if (!tableNumber || !restaurantId) {
      return NextResponse.json(
        { error: "Table number and restaurant ID are required" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settings: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (getRestaurantServiceModeFromSettings(restaurant.settings) === "lite") {
      return NextResponse.json({ error: "Waiter call is unavailable in Lite mode" }, { status: 403 });
    }

    const call = await prisma.waiterCall.create({
      data: {
        tableNumber,
        restaurantId,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, call });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create waiter call" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    const calls = await prisma.waiterCall.findMany({
      where: { 
        status: "active",
        ...(restaurantId ? { restaurantId: Number(restaurantId) } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ calls });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
