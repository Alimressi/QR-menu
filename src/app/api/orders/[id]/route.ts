import { isAdminRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = new Set(["new", "preparing", "ready", "paid"]);

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!Number.isInteger(orderId)) {
      return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body?.status || "").trim();

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
