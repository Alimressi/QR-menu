import { isSuperAdmin, getCurrentUserInfo } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// GET /api/superadmin/restaurants - List all restaurants
export async function GET(request: NextRequest) {
  try {
    if (!isSuperAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: {
            categories: true,
            dishes: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

// POST /api/superadmin/restaurants - Create new restaurant
export async function POST(request: NextRequest) {
  try {
    if (!isSuperAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, logoUrl, settings, adminLogin, adminPassword } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const normalizedAdminLogin = String(adminLogin || "").trim();
    const normalizedAdminPassword = String(adminPassword || "");

    if (!normalizedAdminLogin || !normalizedAdminPassword) {
      return NextResponse.json(
        { error: "Admin login and password are required." },
        { status: 400 }
      );
    }

    let normalizedSettings: Record<string, unknown> = {};
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      normalizedSettings = settings as Record<string, unknown>;
    }

    normalizedSettings.adminLogin = normalizedAdminLogin;
    normalizedSettings.adminPasswordHash = await bcrypt.hash(normalizedAdminPassword, 10);
    delete normalizedSettings.adminPassword;

    // Check if slug is unique
    const existing = await prisma.restaurant.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        slug,
        logoUrl: logoUrl || null,
        settings: JSON.stringify(normalizedSettings),
      },
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
