import { isAdminRequest } from "@/lib/auth";
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  const dishes = await prisma.dish.findMany({
    where: restaurantId ? { restaurantId: Number(restaurantId) } : undefined,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(dishes);
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const imagePositionX = parseNumber(body?.imagePositionX);
    const imagePositionY = parseNumber(body?.imagePositionY);
    const clampPosition = (value: number) => Math.min(150, Math.max(-50, value));

    const restaurantId = Number.parseInt(String(body?.restaurantId ?? ""), 10);
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
    };

    if (!fallbackName) return NextResponse.json({ error: "At least one dish name language is required." }, { status: 400 });
    if (!data.imageUrl) return NextResponse.json({ error: "imageUrl is required." }, { status: 400 });
    if (!Number.isFinite(data.price)) return NextResponse.json({ error: "price must be a valid number." }, { status: 400 });
    if (!Number.isInteger(data.categoryId)) return NextResponse.json({ error: "categoryId is required." }, { status: 400 });
    if (!Number.isInteger(data.restaurantId) || data.restaurantId <= 0) {
      return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
    }

    const dish = await prisma.dish.create({ data });

    return NextResponse.json(dish, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create dish." }, { status: 500 });
  }
}
