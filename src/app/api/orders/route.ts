import { isAdminRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getRestaurantServiceModeFromSettings } from "@/lib/restaurant";
import { verifyQrSessionToken } from "@/lib/qr-token";
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_ORDER_STATUSES = ["new", "preparing"];

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  const orders = await prisma.order.findMany({
    where: restaurantId ? { restaurantId: Number(restaurantId) } : undefined,
    include: {
      items: {
        orderBy: { id: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tableNumber = String(body?.tableNumber || "").trim();
    const qrToken = String(body?.qrToken || "").trim();
    const providedRestaurantId = Number(body?.restaurantId);
    const rawItems = Array.isArray(body?.items) ? body.items : [];
    type NormalizedItem = { dishId: number; quantity: number };

    if (!tableNumber || rawItems.length === 0) {
      return NextResponse.json({ error: "Table number and items are required." }, { status: 400 });
    }

    if (!qrToken) {
      return NextResponse.json({ error: "Please scan the QR code on your table." }, { status: 400 });
    }

    const verifiedSession = verifyQrSessionToken(qrToken);

    if (!verifiedSession) {
      return NextResponse.json({ error: "QR session is invalid or expired. Please scan again." }, { status: 401 });
    }

    if (verifiedSession.tableNumber !== tableNumber) {
      return NextResponse.json({ error: "QR session does not match selected table." }, { status: 400 });
    }

    const restaurantId = providedRestaurantId || verifiedSession.restaurantId;
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required." }, { status: 400 });
    }

    if (providedRestaurantId && providedRestaurantId !== verifiedSession.restaurantId) {
      return NextResponse.json({ error: "QR session does not belong to this restaurant." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settings: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    if (getRestaurantServiceModeFromSettings(restaurant.settings) === "lite") {
      return NextResponse.json({ error: "Ordering is unavailable in Lite mode." }, { status: 403 });
    }

    const latestPaidOrder = await prisma.order.findFirst({
      where: {
        tableNumber,
        restaurantId,
        status: "paid",
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (latestPaidOrder && latestPaidOrder.updatedAt.getTime() >= verifiedSession.issuedAt) {
      return NextResponse.json(
        { error: "QR session is closed after payment. Please scan the table QR again." },
        { status: 401 },
      );
    }

    const normalizedItems: NormalizedItem[] = [];

    for (const item of rawItems) {
      const dishId = Number((item as { dishId?: unknown }).dishId);
      const quantity = Number((item as { quantity?: unknown }).quantity);

      if (Number.isInteger(dishId) && Number.isInteger(quantity) && quantity > 0) {
        normalizedItems.push({ dishId, quantity });
      }
    }

    if (normalizedItems.length === 0) {
      return NextResponse.json({ error: "Invalid order items." }, { status: 400 });
    }

    const dishIds = [...new Set<number>(normalizedItems.map((item) => item.dishId))];
    const dishes = await prisma.dish.findMany({ 
      where: { 
        id: { in: dishIds },
        restaurantId,
      } 
    });

    if (dishes.length !== dishIds.length) {
      return NextResponse.json({ error: "Some dishes are unavailable." }, { status: 400 });
    }

    const dishMap = new Map(dishes.map((dish) => [dish.id, dish]));

    const items = normalizedItems.map((item) => {
      const dish = dishMap.get(item.dishId);

      if (!dish) {
        throw new Error("Dish not found during order creation.");
      }

      return {
        dishId: dish.id,
        quantity: item.quantity,
        price: dish.price,
        nameEn: dish.nameEn,
        nameRu: dish.nameRu,
        nameAz: dish.nameAz,
      };
    });

    const existingOrder = await prisma.order.findFirst({
      where: {
        tableNumber,
        restaurantId,
        status: {
          in: ACTIVE_ORDER_STATUSES,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!existingOrder) {
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = await prisma.order.create({
        data: {
          tableNumber,
          restaurantId,
          total,
          items: {
            create: items,
          },
        },
        include: {
          items: {
            orderBy: { id: "asc" },
          },
        },
      });

      return NextResponse.json({ order, mergedIntoExisting: false }, { status: 201 });
    }

    const existingItemsMap = new Map(existingOrder.items.map((item) => [item.dishId, item]));

    const newItemsToCreate = items.filter((item) => !existingItemsMap.has(item.dishId));

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const existingItem = existingItemsMap.get(item.dishId);

        if (existingItem) {
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + item.quantity,
            },
          });
        }
      }

      if (newItemsToCreate.length > 0) {
        await tx.orderItem.createMany({
          data: newItemsToCreate.map((item) => ({
            orderId: existingOrder.id,
            dishId: item.dishId,
            quantity: item.quantity,
            price: item.price,
            nameEn: item.nameEn,
            nameRu: item.nameRu,
            nameAz: item.nameAz,
          })),
        });
      }

      const allOrderItems = await tx.orderItem.findMany({
        where: { orderId: existingOrder.id },
      });

      const recalculatedTotal = allOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          total: recalculatedTotal,
        },
      });
    });

    const updatedOrder = await prisma.order.findUnique({
      where: { id: existingOrder.id },
      include: {
        items: {
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder, mergedIntoExisting: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
