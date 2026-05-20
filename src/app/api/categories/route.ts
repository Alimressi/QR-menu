import { isAdminRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  const categories = await prisma.category.findMany({
    where: restaurantId ? { restaurantId: Number(restaurantId) } : undefined,
    include: {
      dishes: {
        include: {
          options: {
            orderBy: { id: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(categories, {
    headers: {
      // Cache at the edge for 5 min; serve stale for up to 10 min while revalidating.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const rawNameEn = String(body?.nameEn || "").trim();
    const rawNameRu = String(body?.nameRu || "").trim();
    const rawNameAz = String(body?.nameAz || "").trim();
    const fallbackName = rawNameAz || rawNameEn || rawNameRu;

    const nameEn = rawNameEn || fallbackName;
    const nameRu = rawNameRu || fallbackName;
    const nameAz = rawNameAz || fallbackName;
    const restaurantId = Number(body?.restaurantId);

    if (!fallbackName) {
      return NextResponse.json({ error: "At least one language name is required." }, { status: 400 });
    }

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID is required." }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { nameEn, nameRu, nameAz, restaurantId },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
