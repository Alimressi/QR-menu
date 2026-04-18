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

    const userInfo = await validateAdminCredentials(login, password);

    if (!userInfo) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    let restaurantId: number | undefined;

    if (userInfo.role === "RESTAURANT_ADMIN") {
      if (restaurantSlug) {
        const restaurant = await prisma.restaurant.findUnique({
          where: { slug: restaurantSlug },
          select: { id: true },
        });

        if (!restaurant) {
          return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
        }

        restaurantId = restaurant.id;
      } else if (requestedRestaurantId) {
        restaurantId = requestedRestaurantId;
      } else {
        const firstRestaurant = await prisma.restaurant.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
        if (!firstRestaurant) {
          return NextResponse.json({ error: "No restaurants found." }, { status: 404 });
        }
        restaurantId = firstRestaurant.id;
      }
    }

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
