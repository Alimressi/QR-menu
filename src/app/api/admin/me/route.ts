import { getCurrentUserInfo, isAdminSessionActive } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const isAuthenticated = await isAdminSessionActive();
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userInfo = await getCurrentUserInfo();
    
    if (!userInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If RESTAURANT_ADMIN, fetch restaurant details
    let restaurant = null;
    if (userInfo.role === "RESTAURANT_ADMIN" && userInfo.restaurantId) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: userInfo.restaurantId },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          settings: true,
        },
      });
    }

    return NextResponse.json({
      role: userInfo.role,
      restaurantId: userInfo.restaurantId,
      restaurant,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    );
  }
}
