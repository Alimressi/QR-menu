import { validateAdminCredentials, setAdminSessionCookie } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body?.login || "").trim();
    const password = String(body?.password || "").trim();
    const restaurantSlug = String(body?.restaurantSlug || "").trim();
    const requestedRestaurantId = Number(body?.restaurantId);

    if (!login || !password) {
      return NextResponse.json({ error: "Login and password are required." }, { status: 400 });
    }

    let targetRestaurant: { id: number; settings: string | null } | null = null;
    let userInfo: Awaited<ReturnType<typeof validateAdminCredentials>> = null;

    if (restaurantSlug || requestedRestaurantId) {
      // Explicit restaurant context: validate against exactly that restaurant.
      targetRestaurant = restaurantSlug
        ? await prisma.restaurant.findUnique({
            where: { slug: restaurantSlug },
            select: { id: true, settings: true },
          })
        : await prisma.restaurant.findUnique({
            where: { id: requestedRestaurantId },
            select: { id: true, settings: true },
          });

      if (!targetRestaurant) {
        return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
      }

      userInfo = await validateAdminCredentials(login, password, targetRestaurant.settings);
    } else {
      // No restaurant in context (e.g. the bare /admin page): find the restaurant
      // whose admin credentials match, instead of silently defaulting to the first
      // one — which used to reject valid logins for every restaurant but that one.
      const allRestaurants = await prisma.restaurant.findMany({
        select: { id: true, settings: true },
      });

      for (const restaurant of allRestaurants) {
        const candidate = await validateAdminCredentials(login, password, restaurant.settings);
        if (candidate) {
          targetRestaurant = restaurant;
          userInfo = candidate;
          break;
        }
      }
    }

    if (!userInfo || !targetRestaurant) {
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
