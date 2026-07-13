import { isSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

function getDefaultRestaurantSettings() {
  return {
    serviceMode: "pro",
    brandName: "Nine Lives",
    brandSubtitle: "Craft cocktails. Fine dishes. Timeless atmosphere.",
    primaryColor: "#b8944f",
    accentTextColor: "#120e08",
    backgroundFrom: "#0a0a0a",
    backgroundTo: "#0d0d0d",
    surfaceColor: "rgba(18,18,18,0.86)",
    textColor: "#f0e8d0",
    mutedTextColor: "#c9b28d",
    borderColor: "rgba(201,169,98,0.35)",
    buttonRadius: "14px",
    cardRadius: "20px",
    panelColor: "#161616",
    overlayColor: "#000000",
    controlSurfaceColor: "#2a2a2a",
    activeChipBackground: "#b8944f",
    activeChipTextColor: "#120e08",
    inactiveChipBackground: "#1f1f1f",
    inactiveChipTextColor: "#f0e8d0",
    dividerColor: "rgba(201,169,98,0.35)",
    successColor: "#34d399",
    errorColor: "#f87171",
    categoryTitleColor: "#f0e8d0",
    qtyButtonBackground: "#2a2a2a",
    qtyButtonTextColor: "#f0e8d0",
    qtyButtonBorderColor: "rgba(201,169,98,0.35)",
    currencyMode: "manat",
  };
}

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

    let normalizedSettings: Record<string, unknown> = getDefaultRestaurantSettings();
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      normalizedSettings = {
        ...normalizedSettings,
        ...(settings as Record<string, unknown>),
      };
    }

    // Use the actual restaurant name as brand name (caller didn't override it).
    if (!normalizedSettings.brandName || normalizedSettings.brandName === "Nine Lives") {
      normalizedSettings.brandName = name;
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
  } catch {
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
