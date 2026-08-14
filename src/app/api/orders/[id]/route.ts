import { resolveTenantScope } from "@/lib/auth";
import { findOrderRestaurantId, updateOrderStatus } from "@/lib/orders-query";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = new Set(["new", "preparing", "ready", "paid"]);

export async function PATCH(request: NextRequest, { params }: Params) {
  const scope = resolveTenantScope(request);
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }

    const ownerRestaurantId = await findOrderRestaurantId(orderId);

    if (ownerRestaurantId === null) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (scope.role === "RESTAURANT_ADMIN" && ownerRestaurantId !== scope.restaurantId) {
      return NextResponse.json({ error: "Forbidden: restaurant mismatch." }, { status: 403 });
    }

    const body = await request.json();
    const status = String(body?.status || "").trim();

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const order = await updateOrderStatus(orderId, status);

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
