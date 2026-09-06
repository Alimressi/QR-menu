import { isSuperAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// The breakdown behind the number on a restaurant card: how many times the menu
// was opened over the last seven days, and which dishes were tapped to look at.
//
// Separate from the restaurants listing on purpose. The listing renders on every
// visit to the panel and wants to stay one query; this runs only when somebody
// actually clicks the counter, which is rarely.

const WINDOW_DAYS = 7;

export async function GET(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = Number(request.nextUrl.searchParams.get("restaurantId"));

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
  }

  try {
    const since = new Date(Date.now() - (WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [opensByDay, dishRows] = await Promise.all([
      prisma.menuOpenStat.findMany({
        where: { restaurantId, day: { gte: since } },
        orderBy: { day: "asc" },
        select: { day: true, count: true },
      }),
      prisma.dishViewStat.groupBy({
        by: ["dishId"],
        where: { restaurantId, day: { gte: since } },
        _sum: { count: true },
        orderBy: { _sum: { count: "desc" } },
        take: 10,
      }),
    ]);

    // Names come from the dishes themselves rather than being copied into the
    // stats table: a dish renamed yesterday should read by its current name.
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishRows.map((row) => row.dishId) } },
      select: { id: true, nameAz: true, nameRu: true, nameEn: true },
    });
    const byId = new Map(dishes.map((dish) => [dish.id, dish]));

    return NextResponse.json(
      {
        opens: opensByDay.reduce((total, row) => total + row.count, 0),
        byDay: opensByDay,
        topDishes: dishRows
          // A dish deleted since it was tapped keeps its count out of the list
          // rather than showing a blank row.
          .filter((row) => byId.has(row.dishId))
          .map((row) => ({
            dishId: row.dishId,
            name: byId.get(row.dishId)?.nameAz ?? "",
            count: row._sum.count ?? 0,
          })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET /api/superadmin/stats failed:", error);
    return NextResponse.json({ error: "Failed to read stats." }, { status: 500 });
  }
}
