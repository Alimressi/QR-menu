import { validateAdminCredentials, setAdminSessionCookie } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body?.login || "").trim();
    const password = String(body?.password || "");
    const restaurantSlug = String(body?.restaurantSlug || "").trim();
    const requestedRestaurantId = Number(body?.restaurantId);

    if (!login || !password) {
      return NextResponse.json({ error: "Login and password are required." }, { status: 400 });
    }

    let targetRestaurant: { id: number; settings: string | null } | null = null;

    if (restaurantSlug) {
      targetRestaurant = await prisma.restaurant.findUnique({
        where: { slug: restaurantSlug },
        select: { id: true, settings: true },
      });
    } else if (requestedRestaurantId) {
      targetRestaurant = await prisma.restaurant.findUnique({
        where: { id: requestedRestaurantId },
        select: { id: true, settings: true },
      });
    } else {
      targetRestaurant = await prisma.restaurant.findFirst({
        orderBy: { id: "asc" },
        select: { id: true, settings: true },
      });
    }

    if (!targetRestaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const userInfo = await validateAdminCredentials(login, password, targetRestaurant.settings);

    if (!userInfo) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const restaurantId = userInfo.role === "RESTAURANT_ADMIN" ? targetRestaurant.id : undefined;

    await setAdminSessionCookie(userInfo.role, restaurantId);

    return NextResponse.json({ 
      ok: true, 
      role: userInfo.role,
      restaurantId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to login." }, { status: 500 });
  }
}
