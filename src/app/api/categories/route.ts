import { requireTenantScope } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isRestaurantServableById } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  // Public endpoint: a suspended tenant must not have its menu readable here,
  // or the notice on the menu page would be cosmetic. no-store so a suspension
  // (or a reactivation) is never held in the edge cache.
  if (restaurantId && !(await isRestaurantServableById(Number(restaurantId)))) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }

  try {
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
        // Only cache non-empty responses. An empty array likely means a cold-start
        // DB failure — caching it would poison the edge for 5 minutes.
        "Cache-Control":
          categories.length > 0
            ? "public, s-maxage=300, stale-while-revalidate=600"
            : "no-store",
      },
    });
  } catch {
    // Prisma WASM cold-start failure — return empty with no-store so the client
    // fallback can retry on a warm isolate instead of getting a cached 500.
    return NextResponse.json([], {
      headers: { "Cache-Control": "no-store" },
    });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const scope = requireTenantScope(request, body?.restaurantId);
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  try {
    const rawNameEn = String(body?.nameEn || "").trim();
    const rawNameRu = String(body?.nameRu || "").trim();
    const rawNameAz = String(body?.nameAz || "").trim();
    const fallbackName = rawNameAz || rawNameEn || rawNameRu;

    const nameEn = rawNameEn || fallbackName;
    const nameRu = rawNameRu || fallbackName;
    const nameAz = rawNameAz || fallbackName;

    if (!fallbackName) {
      return NextResponse.json({ error: "At least one language name is required." }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { nameEn, nameRu, nameAz, restaurantId: scope.restaurantId },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
