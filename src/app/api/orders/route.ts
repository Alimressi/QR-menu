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
    type NormalizedItem = { dishId: number; quantity: number; optionId: number | null };

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
      const rawOptionId = (item as { optionId?: unknown }).optionId;
      const optionId = rawOptionId === undefined || rawOptionId === null ? null : Number(rawOptionId);

      if (
        Number.isInteger(dishId) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        (optionId === null || Number.isInteger(optionId))
      ) {
        normalizedItems.push({ dishId, quantity, optionId });
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
    const optionIds = [...new Set(normalizedItems.map((item) => item.optionId).filter((id): id is number => id !== null))];
    const options = optionIds.length > 0
      ? await prisma.dishOption.findMany({
          where: {
            id: { in: optionIds },
            dish: {
              restaurantId,
            },
          },
        })
      : [];
    const optionMap = new Map(options.map((option) => [option.id, option]));

    const items = normalizedItems.map((item) => {
      const dish = dishMap.get(item.dishId);

      if (!dish) {
        throw new Error("Dish not found during order creation.");
      }

      const selectedOption = item.optionId !== null ? optionMap.get(item.optionId) : null;

      if (item.optionId !== null && (!selectedOption || selectedOption.dishId !== dish.id)) {
        throw new Error("Dish option is invalid.");
      }

      const hasOptions = options.some((option) => option.dishId === dish.id);

      if (hasOptions && !selectedOption) {
        throw new Error("Dish option is required.");
      }

      const price = dish.price + (selectedOption?.price ?? 0);

      return {
        dishId: dish.id,
        optionId: selectedOption?.id ?? null,
        quantity: item.quantity,
        price,
        nameEn: dish.nameEn,
        nameRu: dish.nameRu,
        nameAz: dish.nameAz,
        optionNameEn: selectedOption?.nameEn ?? null,
        optionNameRu: selectedOption?.nameRu ?? null,
        optionNameAz: selectedOption?.nameAz ?? null,
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

    const existingItemsMap = new Map(existingOrder.items.map((item) => [`${item.dishId}:${item.optionId ?? "none"}`, item]));

    const newItemsToCreate = items.filter((item) => !existingItemsMap.has(`${item.dishId}:${item.optionId ?? "none"}`));

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const existingItem = existingItemsMap.get(`${item.dishId}:${item.optionId ?? "none"}`);

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
            optionId: item.optionId,
            quantity: item.quantity,
            price: item.price,
            nameEn: item.nameEn,
            nameRu: item.nameRu,
            nameAz: item.nameAz,
            optionNameEn: item.optionNameEn,
            optionNameRu: item.optionNameRu,
            optionNameAz: item.optionNameAz,
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
  } catch (error) {
    if (error instanceof Error) {
      const knownErrors = [
        "Dish option is invalid.",
        "Dish option is required.",
      ];

      if (knownErrors.includes(error.message)) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
