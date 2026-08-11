import { requireTenantScope } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isRestaurantServableById } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = Number.parseInt(String(searchParams.get("restaurantId") ?? ""), 10);
  const fresh = searchParams.get("fresh") === "1";

  // Mandatory, for the same reason as /api/dishes: without it this used to
  // return every restaurant's categories and dishes in one public response.
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json(
      { error: "restaurantId is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Public endpoint: a suspended tenant must not have its menu readable here,
  // or the notice on the menu page would be cosmetic. no-store so a suspension
  // (or a reactivation) is never held in the edge cache.
  if (!(await isRestaurantServableById(restaurantId))) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const categories = await prisma.category.findMany({
      where: { restaurantId },
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
        // Guests get an edge-cached menu. Admin tools pass ?fresh=1, which is a
        // different cache key, so the editor never reads a 5-minute-old menu
        // back after saving — while the public URL stays cached.
        // Empty responses are never cached either: an empty array usually means a
        // cold-start DB failure, and caching it would poison the edge.
        "Cache-Control":
          fresh || categories.length === 0
            ? "no-store"
            : "public, s-maxage=300, stale-while-revalidate=600",
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
