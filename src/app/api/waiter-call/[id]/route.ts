import { resolveTenantScope } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_STATUSES = new Set(["active", "resolved"]);

export async function PATCH(request: NextRequest, { params }: Params) {
  // This route had no authentication at all: anyone could resolve (or re-open)
  // any restaurant's waiter calls by id.
  const scope = resolveTenantScope(request);
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  try {
    const { id } = await params;
    const callId = Number(id);

    if (!Number.isInteger(callId)) {
      return NextResponse.json({ error: "Invalid call id." }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body?.status || "").trim();

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const existing = await prisma.waiterCall.findUnique({
      where: { id: callId },
      select: { restaurantId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Waiter call not found." }, { status: 404 });
    }

    if (scope.role === "RESTAURANT_ADMIN" && existing.restaurantId !== scope.restaurantId) {
      return NextResponse.json({ error: "Forbidden: restaurant mismatch." }, { status: 403 });
    }

    const call = await prisma.waiterCall.update({
      where: { id: callId },
      data: {
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, call });
  } catch {
    return NextResponse.json({ error: "Failed to update waiter call" }, { status: 500 });
  }
}
