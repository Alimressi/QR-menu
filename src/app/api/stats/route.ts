import { statEventKey } from "@/lib/stats-buffer";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

// Counts a menu being opened, or a dish being tapped to look at.
//
// Called by the guest menu, never blocking it: the page has already rendered by
// the time this fires, and the response is ignored. That is deliberate — the
// render path is the one measured in CPU milliseconds against a hard limit, and
// a vanity counter has no business inside it.
//
// The event goes to R2, not to Postgres. Neon wakes for a five-minute minimum on
// any query, so writing here directly meant a busy evening kept the database
// awake for the whole of it; the monitor folds the pile into Postgres every half
// hour, while it is already awake for its own probes. See src/lib/stats-buffer.ts
// for the arithmetic that made that necessary.
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

    const { env } = await getCloudflareContext({ async: true });
    const bucket = env.MEDIA_BUCKET;

    if (!bucket) {
      // `next dev` without the Cloudflare proxy has no bindings. Counting is not
      // worth failing a local page over.
      return NextResponse.json({ ok: false }, { status: 202 });
    }

    // Empty body on purpose: the key is the record. See stats-buffer.ts.
    //
    // The random suffix is what keeps two guests tapping the same dish in the
    // same second from becoming one event — without it the second write would
    // overwrite the first and the count would silently be short.
    await bucket.put(
      statEventKey({ day: today(), restaurantId, dishId }, crypto.randomUUID()),
      "",
    );

    return NextResponse.json({ ok: true });
  } catch {
    // A lost count is not worth an error in a guest's console. The dish may have
    // been deleted a second ago, or R2 may be having a moment; either way the
    // menu in front of them is fine and nothing here is worth telling them.
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
