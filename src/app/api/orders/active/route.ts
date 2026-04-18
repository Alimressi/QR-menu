import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_ORDER_STATUSES = ["new", "preparing"];

export async function GET(request: NextRequest) {
  const tableNumber = request.nextUrl.searchParams.get("tableNumber")?.trim() || "";
  const restaurantId = Number(request.nextUrl.searchParams.get("restaurantId"));

  if (!tableNumber) {
    return NextResponse.json({ error: "tableNumber is required." }, { status: 400 });
  }

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      tableNumber,
      restaurantId,
      status: {
        in: ACTIVE_ORDER_STATUSES,
      },
    },
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ order: order || null });
}
