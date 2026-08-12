import { resolveTenantScope } from "@/lib/auth";
import prisma from "@/lib/prisma";
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

type Params = {
  params: Promise<{ id: string }>;
};

// Resolve the dish and confirm the caller is allowed to touch it. The tenant is
// derived from the dish row itself and checked against the signed session, so a
// restaurant admin can only ever reach their own dishes.
async function authorizeDish(request: NextRequest, rawId: string) {
  const scope = resolveTenantScope(request);
  if (!scope.ok) {
    return { ok: false as const, status: scope.status, error: scope.error };
  }

  const dishId = Number(rawId);
  if (!Number.isInteger(dishId)) {
    return { ok: false as const, status: 400 as const, error: "Invalid dish id." };
  }

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    select: { id: true, restaurantId: true },
  });

  if (!dish) {
    return { ok: false as const, status: 404 as const, error: "Dish not found." };
  }

  if (scope.role === "RESTAURANT_ADMIN" && dish.restaurantId !== scope.restaurantId) {
    return { ok: false as const, status: 403 as const, error: "Forbidden: restaurant mismatch." };
  }

  return { ok: true as const, dishId, restaurantId: dish.restaurantId };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await authorizeDish(request, id);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dishId } = auth;

  try {
    const body = await request.json();
    const imagePositionX = parseNumber(body?.imagePositionX);
    const imagePositionY = parseNumber(body?.imagePositionY);
    const clampPosition = (value: number) => Math.min(150, Math.max(-50, value));
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
      imagePositionX: Number.isFinite(imagePositionX) ? clampPosition(imagePositionX) : 50,
      imagePositionY: Number.isFinite(imagePositionY) ? clampPosition(imagePositionY) : 50,
      soldOut: body?.soldOut === true,
    };

    if (!fallbackName) return NextResponse.json({ error: "At least one dish name language is required." }, { status: 400 });
    if (!data.imageUrl) return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
    if (!Number.isFinite(data.price)) return NextResponse.json({ error: "price must be a valid number." }, { status: 400 });
    if (!Number.isInteger(data.categoryId)) return NextResponse.json({ error: "categoryId is required." }, { status: 400 });

    // Moving a dish into a category owned by another restaurant would leak it
    // onto that restaurant's menu — pin the category to the dish's own tenant.
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, restaurantId: auth.restaurantId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category does not belong to this restaurant." },
        { status: 403 },
      );
    }

    const dish = await prisma.$transaction(async (tx) => {
      await tx.dish.update({
        where: { id: dishId },
        data,
      });

      await tx.dishOption.deleteMany({ where: { dishId } });

      if (options.length > 0) {
        await tx.dishOption.createMany({
          data: options.map((option) => ({
            dishId,
            nameEn: option.nameEn,
            nameRu: option.nameRu,
            nameAz: option.nameAz,
            price: option.price,
          })),
        });
      }

      return tx.dish.findUnique({
        where: { id: dishId },
        include: {
          options: {
            orderBy: { id: "asc" },
          },
        },
      });
    });

    return NextResponse.json(dish);
  } catch {
    return NextResponse.json({ error: "Failed to update dish." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await authorizeDish(request, id);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await prisma.dish.delete({ where: { id: auth.dishId } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete dish." }, { status: 500 });
  }
}
