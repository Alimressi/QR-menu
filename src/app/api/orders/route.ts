import { resolveTenantScope } from "@/lib/auth";
import {
  type NewOrderItem,
  createOrderWithItems,
  findActiveOrderWithItems,
  findDishOptionsForOrder,
  findDishesForOrder,
  findLatestPaidOrderUpdatedAt,
  findOrderWithItemsById,
  findOrdersWithItems,
  findRestaurantForOrdering,
  mergeItemsIntoOrder,
} from "@/lib/orders-query";
import { getRestaurantServiceModeFromSettings } from "@/lib/restaurant";
import { isRestaurantServable } from "@/lib/subscription";
import { verifyQrSessionToken } from "@/lib/qr-token";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // A restaurant admin is pinned to their own orders regardless of the query
  // string; only a super admin may widen the scope or omit it entirely.
  const scope = resolveTenantScope(request, searchParams.get("restaurantId"));
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  const orders = await findOrdersWithItems(scope.restaurantId || null);

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

    const restaurant = await findRestaurantForOrdering(restaurantId);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // A suspended tenant takes no orders: staff would not be watching the
    // dashboard, so an accepted order would simply be lost.
    if (!isRestaurantServable(restaurant)) {
      return NextResponse.json(
        { error: "This menu is temporarily unavailable. Please ask a member of staff." },
        { status: 403 },
      );
    }

    if (getRestaurantServiceModeFromSettings(restaurant.settings) === "lite") {
      return NextResponse.json({ error: "Ordering is unavailable in Lite mode." }, { status: 403 });
    }

    const latestPaidAt = await findLatestPaidOrderUpdatedAt(tableNumber, restaurantId);

    if (latestPaidAt && latestPaidAt.getTime() >= verifiedSession.issuedAt) {
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
    const dishes = await findDishesForOrder(dishIds, restaurantId);

    if (dishes.length !== dishIds.length) {
      return NextResponse.json({ error: "Some dishes are unavailable." }, { status: 400 });
    }

    // The menu greys out stop-listed dishes, but the guest's page may have been
    // open since before the kitchen ran out — and the button is not the only way
    // to reach this endpoint. Refuse here too, naming the dish so the guest knows
    // what to drop rather than being told the whole order failed.
    const soldOut = dishes.filter((dish) => dish.soldOut);

    if (soldOut.length > 0) {
      return NextResponse.json(
        {
          error: `No longer available today: ${soldOut.map((dish) => dish.nameAz).join(", ")}`,
          soldOutDishIds: soldOut.map((dish) => dish.id),
        },
        { status: 409 },
      );
    }

    const dishMap = new Map(dishes.map((dish) => [dish.id, dish]));
    const optionIds = [...new Set(normalizedItems.map((item) => item.optionId).filter((id): id is number => id !== null))];
    const options = await findDishOptionsForOrder(optionIds, restaurantId);
    const optionMap = new Map(options.map((option) => [option.id, option]));

    const items: NewOrderItem[] = normalizedItems.map((item) => {
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

    const existingOrder = await findActiveOrderWithItems(tableNumber, restaurantId);

    if (!existingOrder) {
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = await createOrderWithItems(tableNumber, restaurantId, total, items);

      return NextResponse.json({ order, mergedIntoExisting: false }, { status: 201 });
    }

    const existingItemsMap = new Map(existingOrder.items.map((item) => [`${item.dishId}:${item.optionId ?? "none"}`, item]));

    const quantityIncrements: Array<{ orderItemId: number; addQuantity: number }> = [];
    const newItemsToCreate: NewOrderItem[] = [];

    for (const item of items) {
      const existingItem = existingItemsMap.get(`${item.dishId}:${item.optionId ?? "none"}`);

      if (existingItem) {
        quantityIncrements.push({ orderItemId: existingItem.id, addQuantity: item.quantity });
      } else {
        newItemsToCreate.push(item);
      }
    }

    await mergeItemsIntoOrder(existingOrder.id, quantityIncrements, newItemsToCreate);

    const updatedOrder = await findOrderWithItemsById(existingOrder.id);

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
