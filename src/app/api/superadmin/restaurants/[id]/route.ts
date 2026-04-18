import { isSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/superadmin/restaurants/[id] - Get single restaurant
export async function GET(request: NextRequest, { params }: Params) {
  try {
    if (!isSuperAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const restaurantId = Number(id);

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        categories: {
          include: {
            dishes: true,
          },
        },
        _count: {
          select: {
            orders: true,
            waiterCalls: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch restaurant" },
      { status: 500 }
    );
  }
}

// PATCH /api/superadmin/restaurants/[id] - Update restaurant
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    if (!isSuperAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const restaurantId = Number(id);
    const body = await request.json();

    const { name, slug, logoUrl, settings, adminLogin, adminPassword } = body;

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settings: true },
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    let mergedSettings: Record<string, unknown> = {};
    if (existingRestaurant.settings) {
      try {
        const parsed = JSON.parse(existingRestaurant.settings) as Record<string, unknown>;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          mergedSettings = parsed;
        }
      } catch {
        mergedSettings = {};
      }
    }

    if (settings !== undefined) {
      if (settings === null) {
        mergedSettings = {};
      } else if (typeof settings === "object" && !Array.isArray(settings)) {
        mergedSettings = {
          ...mergedSettings,
          ...(settings as Record<string, unknown>),
        };
      }
    }

    const normalizedAdminLogin = String(adminLogin || "").trim();
    const normalizedAdminPassword = String(adminPassword || "");

    if (normalizedAdminLogin) {
      mergedSettings.adminLogin = normalizedAdminLogin;
    }

    if (normalizedAdminPassword) {
      mergedSettings.adminPasswordHash = await bcrypt.hash(normalizedAdminPassword, 10);
      delete mergedSettings.adminPassword;
    }

    // Check if new slug is unique (if changing)
    if (slug) {
      const existing = await prisma.restaurant.findFirst({
        where: {
          slug,
          id: { not: restaurantId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(logoUrl !== undefined && { logoUrl }),
        settings: JSON.stringify(mergedSettings),
      },
    });

    return NextResponse.json({ restaurant });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}

// DELETE /api/superadmin/restaurants/[id] - Delete restaurant
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    if (!isSuperAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const restaurantId = Number(id);

    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete restaurant" },
      { status: 500 }
    );
  }
}
