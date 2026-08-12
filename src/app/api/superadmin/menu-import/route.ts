import { requireTenantScope } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Creates a whole menu in one call, from the preview the super admin confirmed.
//
// Append-only on purpose: it never deletes anything that is already there. A
// double-click produces visible duplicates, which is annoying but recoverable —
// a "replace" mode that wiped a live menu would not be.

const MAX_CATEGORIES = 60;
const MAX_DISHES = 600;

type IncomingDish = {
  nameEn?: unknown;
  nameRu?: unknown;
  nameAz?: unknown;
  descriptionEn?: unknown;
  descriptionRu?: unknown;
  descriptionAz?: unknown;
  price?: unknown;
  imageUrl?: unknown;
};

type IncomingCategory = {
  nameEn?: unknown;
  nameRu?: unknown;
  nameAz?: unknown;
  dishes?: unknown;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePrice(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value ?? "").trim().replace(",", ".");
  return normalized ? Number(normalized) : Number.NaN;
}

export async function POST(request: NextRequest) {
  let body: { restaurantId?: unknown; categories?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const scope = requireTenantScope(request, body?.restaurantId);
  if (!scope.ok) {
    return NextResponse.json({ error: scope.error }, { status: scope.status });
  }

  const rawCategories = Array.isArray(body?.categories) ? (body.categories as IncomingCategory[]) : [];

  if (rawCategories.length === 0) {
    return NextResponse.json({ error: "No categories to import." }, { status: 400 });
  }

  if (rawCategories.length > MAX_CATEGORIES) {
    return NextResponse.json(
      { error: `Too many categories (max ${MAX_CATEGORIES}).` },
      { status: 400 },
    );
  }

  // Normalise everything before writing, so a bad row fails the request rather
  // than leaving a half-imported menu behind.
  const normalized: Array<{
    nameEn: string;
    nameRu: string;
    nameAz: string;
    dishes: Array<{
      nameEn: string;
      nameRu: string;
      nameAz: string;
      descriptionEn: string;
      descriptionRu: string;
      descriptionAz: string;
      price: number;
      imageUrl: string;
    }>;
  }> = [];

  let dishTotal = 0;

  for (const rawCategory of rawCategories) {
    const categoryFallback = text(rawCategory.nameAz) || text(rawCategory.nameEn) || text(rawCategory.nameRu);

    if (!categoryFallback) {
      return NextResponse.json({ error: "Every category needs a name." }, { status: 400 });
    }

    const rawDishes = Array.isArray(rawCategory.dishes) ? (rawCategory.dishes as IncomingDish[]) : [];
    const dishes: (typeof normalized)[number]["dishes"] = [];

    for (const rawDish of rawDishes) {
      const nameFallback = text(rawDish.nameAz) || text(rawDish.nameEn) || text(rawDish.nameRu);
      const price = parsePrice(rawDish.price);

      if (!nameFallback) {
        return NextResponse.json({ error: "Every dish needs a name." }, { status: 400 });
      }

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: `Invalid price for "${nameFallback}".` },
          { status: 400 },
        );
      }

      const descriptionFallback =
        text(rawDish.descriptionAz) || text(rawDish.descriptionEn) || text(rawDish.descriptionRu);

      dishes.push({
        nameEn: text(rawDish.nameEn) || nameFallback,
        nameRu: text(rawDish.nameRu) || nameFallback,
        nameAz: text(rawDish.nameAz) || nameFallback,
        descriptionEn: text(rawDish.descriptionEn) || descriptionFallback,
        descriptionRu: text(rawDish.descriptionRu) || descriptionFallback,
        descriptionAz: text(rawDish.descriptionAz) || descriptionFallback,
        price,
        // Photos are added afterwards, one dish at a time. An empty string is the
        // existing convention for a photo-less dish (see scripts/seed-uzbechka).
        imageUrl: text(rawDish.imageUrl),
      });

      dishTotal += 1;

      if (dishTotal > MAX_DISHES) {
        return NextResponse.json({ error: `Too many dishes (max ${MAX_DISHES}).` }, { status: 400 });
      }
    }

    if (dishes.length === 0) {
      continue;
    }

    normalized.push({
      nameEn: text(rawCategory.nameEn) || categoryFallback,
      nameRu: text(rawCategory.nameRu) || categoryFallback,
      nameAz: text(rawCategory.nameAz) || categoryFallback,
      dishes,
    });
  }

  if (normalized.length === 0) {
    return NextResponse.json({ error: "Nothing to import — every category was empty." }, { status: 400 });
  }

  try {
    const restaurantId = scope.restaurantId;

    // One transaction: either the whole menu lands or none of it does.
    const created = await prisma.$transaction(async (tx) => {
      let categoryCount = 0;
      let dishCount = 0;

      for (const category of normalized) {
        const row = await tx.category.create({
          data: {
            nameEn: category.nameEn,
            nameRu: category.nameRu,
            nameAz: category.nameAz,
            restaurantId,
          },
        });

        categoryCount += 1;

        await tx.dish.createMany({
          data: category.dishes.map((dish) => ({
            ...dish,
            categoryId: row.id,
            restaurantId,
          })),
        });

        dishCount += category.dishes.length;
      }

      return { categoryCount, dishCount };
    });

    return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Failed to import the menu." }, { status: 500 });
  }
}
