import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const call = await prisma.waiterCall.update({
      where: { id: Number(id) },
      data: {
        status,
        resolvedAt: status === "resolved" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, call });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update waiter call" },
      { status: 500 }
    );
  }
}
