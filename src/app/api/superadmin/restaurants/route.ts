import { isSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDefaultRestaurantSettings } from "@/lib/restaurant";
import { TRIAL_DAYS, parseSubscriptionInput } from "@/lib/subscription";
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

    // Never cached: this is what the edit form reads back after a save. Without
    // an explicit header the browser applies heuristic caching and the form
    // repopulates from a stale copy, silently showing pre-edit values.
    return NextResponse.json({ restaurants }, { headers: { "Cache-Control": "no-store" } });
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

    // A new restaurant starts on a 14-day trial unless the caller says otherwise,
    // matching how these are sold. Existing restaurants are untouched.
    const subscription = parseSubscriptionInput(body);
    const status = subscription.status ?? "trial";
    const trialEndsAt =
      subscription.trialEndsAt !== undefined
        ? subscription.trialEndsAt
        : status === "trial"
          ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
          : null;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const normalizedAdminLogin = String(adminLogin || "").trim();
    const normalizedAdminPassword = String(adminPassword || "").trim();

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
        status,
        trialEndsAt,
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
