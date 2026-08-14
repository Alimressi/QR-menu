import { findActiveOrderWithItems } from "@/lib/orders-query";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const tableNumber = request.nextUrl.searchParams.get("tableNumber")?.trim() || "";
  const restaurantId = Number(request.nextUrl.searchParams.get("restaurantId"));

  if (!tableNumber) {
    return NextResponse.json({ error: "tableNumber is required." }, { status: 400 });
  }

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
  }

  const order = await findActiveOrderWithItems(tableNumber, restaurantId);

  return NextResponse.json({ order: order || null });
}
