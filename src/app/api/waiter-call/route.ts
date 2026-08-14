import { resolveTenantScope } from "@/lib/auth";
import { createWaiterCall, findActiveWaiterCalls, findRestaurantForOrdering } from "@/lib/orders-query";
import { getRestaurantServiceModeFromSettings } from "@/lib/restaurant";
import { isRestaurantServable } from "@/lib/subscription";
import { NextRequest, NextResponse } from "next/server";

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

    const restaurant = await findRestaurantForOrdering(restaurantId);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (!isRestaurantServable(restaurant)) {
      return NextResponse.json({ error: "This menu is temporarily unavailable" }, { status: 403 });
    }

    if (getRestaurantServiceModeFromSettings(restaurant.settings) === "lite") {
      return NextResponse.json({ error: "Waiter call is unavailable in Lite mode" }, { status: 403 });
    }

    const call = await createWaiterCall(tableNumber, restaurantId);

    return NextResponse.json({ success: true, call });
  } catch {
    return NextResponse.json(
      { error: "Failed to create waiter call" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Staff-only view: was previously unauthenticated and would happily list any
    // restaurant's open calls to anyone who guessed the id.
    const scope = resolveTenantScope(request, searchParams.get("restaurantId"));
    if (!scope.ok) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const calls = await findActiveWaiterCalls(scope.restaurantId || null);

    return NextResponse.json({ calls });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
