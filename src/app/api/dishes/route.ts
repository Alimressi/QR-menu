import { requireTenantScope } from "@/lib/auth";
import { findDishesWithCategory } from "@/lib/menu-query";
// Prisma stays for the admin-only POST below. The public GET must never touch it:
// loading the WASM engine is what put this Worker near its memory ceiling.
import prisma from "@/lib/prisma";
import { isRestaurantServableById } from "@/lib/restaurant";
import { NextRequest, NextResponse } from "next/server";

function parseNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");

  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

function normalizeDishOptions(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as Array<{ nameEn: string; nameRu: string; nameAz: string; price: number }>;
  }

  const normalized: Array<{ nameEn: string; nameRu: string; nameAz: string; price: number }> = [];

  for (const rawOption of input) {
    const rawNameEn = String((rawOption as { nameEn?: unknown })?.nameEn || "").trim();
    const rawNameRu = String((rawOption as { nameRu?: unknown })?.nameRu || "").trim();
    const rawNameAz = String((rawOption as { nameAz?: unknown })?.nameAz || "").trim();
    const fallbackName = rawNameAz || rawNameEn || rawNameRu;
    const price = parseNumber((rawOption as { price?: unknown })?.price);

    if (!fallbackName || !Number.isFinite(price)) {
      continue;
    }

    normalized.push({
      nameEn: rawNameEn || fallbackName,
      nameRu: rawNameRu || fallbackName,
      nameAz: rawNameAz || fallbackName,
      price,
    });
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = Number.parseInt(String(searchParams.get("restaurantId") ?? ""), 10);

  // Mandatory. This route is public, and it used to fall back to an unfiltered
  // findMany when the parameter was missing — a bare GET /api/dishes returned
  // every dish of every restaurant to anyone. It also made the admin menu editor
  // show all tenants' dishes whenever no restaurant was selected.
  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json(
      { error: "restaurantId is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Same public-data gate as /api/categories.
  if (!(await isRestaurantServableById(restaurantId))) {
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const dishes = await findDishesWithCategory(restaurantId);

    // Matches /api/categories: ?fresh=1 is the admin-side, never-cached variant.
    return NextResponse.json(dishes, {
      headers: {
        "Cache-Control": searchParams.get("fresh") === "1" ? "no-store" : "public, s-maxage=60",
      },
    });
  } catch {
    // Cold-start failure: empty and uncached, so the client retries on a warm
    // isolate instead of getting a cached 500. Mirrors /api/categories.
    return NextResponse.json([], { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // The tenant comes from the signed session, never from the body. A restaurant
  // admin passing someone else's restaurantId is rejected outright.
  const scope = requireTenantScope(request, body?.restaurantId);
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  try {
    const imagePositionX = parseNumber(body?.imagePositionX);
    const imagePositionY = parseNumber(body?.imagePositionY);
    const clampPosition = (value: number) => Math.min(150, Math.max(-50, value));

    const restaurantId = scope.restaurantId;
    const price = parseNumber(body?.price);
    const categoryId = Number.parseInt(String(body?.categoryId ?? ""), 10);

    const rawNameEn = String(body?.nameEn || "").trim();
    const rawNameRu = String(body?.nameRu || "").trim();
    const rawNameAz = String(body?.nameAz || "").trim();
    const fallbackName = rawNameAz || rawNameEn || rawNameRu;

    const rawDescriptionEn = String(body?.descriptionEn || "").trim();
    const rawDescriptionRu = String(body?.descriptionRu || "").trim();
    const rawDescriptionAz = String(body?.descriptionAz || "").trim();
    const fallbackDescription = rawDescriptionAz || rawDescriptionEn || rawDescriptionRu;
    const options = normalizeDishOptions(body?.options);

    const data = {
      nameEn: rawNameEn || fallbackName,
      nameRu: rawNameRu || fallbackName,
      nameAz: rawNameAz || fallbackName,
      descriptionEn: rawDescriptionEn || fallbackDescription,
      descriptionRu: rawDescriptionRu || fallbackDescription,
      descriptionAz: rawDescriptionAz || fallbackDescription,
      imageUrl: String(body?.imageUrl || "").trim(),
      price,
      categoryId,
      restaurantId,
      imagePositionX: Number.isFinite(imagePositionX) ? clampPosition(imagePositionX) : 50,
      imagePositionY: Number.isFinite(imagePositionY) ? clampPosition(imagePositionY) : 50,
      soldOut: body?.soldOut === true,
    };

    if (!fallbackName) return NextResponse.json({ error: "At least one dish name language is required." }, { status: 400 });
    if (!data.imageUrl) return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
    if (!Number.isFinite(data.price)) return NextResponse.json({ error: "price must be a valid number." }, { status: 400 });
    if (!Number.isInteger(data.categoryId)) return NextResponse.json({ error: "categoryId is required." }, { status: 400 });

    // The category is a second way into another tenant's data — a dish filed
    // under a foreign category would surface on that restaurant's menu.
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, restaurantId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category does not belong to this restaurant." },
        { status: 403 },
      );
    }

    const dish = await prisma.dish.create({
      data: {
        ...data,
        options: options.length > 0 ? { create: options } : undefined,
      },
      include: {
        options: {
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json(dish, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create dish." }, { status: 500 });
  }
}
