import { getSql, withRetry } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Counts a menu being opened, or a dish being tapped to look at.
//
// Called by the guest menu, never blocking it: the page has already rendered by
// the time this fires, and the response is ignored. That is deliberate — the
// render path is the one measured in CPU milliseconds against a hard limit, and
// a vanity counter has no business inside it.
//
// The light neon() driver for the same reason. Prisma would boot a 1.9 MB WASM
// engine to add one to an integer.
//
// Unauthenticated, like the menu it counts. Someone determined could inflate a
// restaurant's numbers; the counter is there to tell an owner whether Tuesday
// was busier than Monday, and nothing is spent or granted on the strength of
// it. Worth knowing, not worth a login.

/** UTC, "YYYY-MM-DD". The bucket every count is added into. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const restaurantId = Number(body?.restaurantId);
    const rawDishId = body?.dishId;
    const dishId = rawDishId === undefined || rawDishId === null ? null : Number(rawDishId);

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
    }

    if (dishId !== null && (!Number.isInteger(dishId) || dishId <= 0)) {
      return NextResponse.json({ error: "dishId must be a dish." }, { status: 400 });
    }

    const sql = getSql();
    const day = today();

    // ON CONFLICT rather than read-then-write: one round trip, and two guests
    // opening the same menu in the same millisecond both get counted.
    //
    // A dish tap counts as a dish tap only. The menu open was already counted
    // when the page loaded, and counting it twice would make every tap look
    // like a fresh visit.
    await withRetry(() =>
      dishId === null
        ? sql`
            INSERT INTO "MenuOpenStat" ("restaurantId", "day", "count")
            VALUES (${restaurantId}, ${day}, 1)
            ON CONFLICT ("restaurantId", "day")
            DO UPDATE SET "count" = "MenuOpenStat"."count" + 1
          `
        : sql`
            INSERT INTO "DishViewStat" ("restaurantId", "dishId", "day", "count")
            VALUES (${restaurantId}, ${dishId}, ${day}, 1)
            ON CONFLICT ("restaurantId", "dishId", "day")
            DO UPDATE SET "count" = "DishViewStat"."count" + 1
          `,
    );

    return NextResponse.json({ ok: true });
  } catch {
    // A lost count is not worth an error in a guest's console. The dish may have
    // been deleted a second ago, or the database may be waking up; either way
    // the menu in front of them is fine and nothing here is worth telling them.
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
