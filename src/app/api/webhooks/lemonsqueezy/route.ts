import { parseSubscriptionEvent, verifyWebhookSignature } from "@/lib/billing";
import { applySubscriptionFromBilling } from "@/lib/menu-query";
import { NextRequest, NextResponse } from "next/server";

// Where a payment becomes a working menu.
//
// Lemon Squeezy posts here whenever a subscription changes. This route is
// deliberately thin — verify, parse, write, answer — because it is the one piece
// that cannot be exercised without a live request. The judgement lives in
// src/lib/billing.ts, which scripts/check-billing.ts covers.
//
// No Prisma: this runs on the guest-facing Worker, and the WASM engine is what
// put it near its memory ceiling. See src/lib/db.ts.

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // The signature is over the exact bytes sent. Parsing first and re-serialising
  // would change them — key order, whitespace — and every signature would fail.
  const rawBody = await request.text();

  const isSigned = verifyWebhookSignature(
    rawBody,
    request.headers.get("x-signature"),
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  );

  if (!isSigned) {
    // Deliberately terse. Telling an attacker whether the secret is unset, the
    // signature was malformed, or it simply did not match hands them a probe.
    console.warn("Rejected a Lemon Squeezy webhook with a bad or missing signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const event = parseSubscriptionEvent(body);

  // Not an event this app acts on: an order webhook, an unfamiliar subscription
  // state, a shape that does not parse. Answer 200 anyway — a non-2xx tells
  // Lemon Squeezy to retry for hours something that will never succeed.
  if (!event) {
    return NextResponse.json({ ignored: true });
  }

  try {
    const result = await applySubscriptionFromBilling(event);

    if (!result.matched) {
      // A real subscription this app cannot place. Worth shouting about: it
      // means somebody is paying and their menu is not being switched on.
      console.error(
        `Lemon Squeezy ${event.eventName} for subscription ${event.subscriptionId} matched no restaurant.`,
      );
      return NextResponse.json({ ignored: true, reason: "no matching restaurant" });
    }

    console.log(
      `Lemon Squeezy ${event.eventName}: restaurant ${result.restaurantId} is now ${event.status}.`,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    // The database is down, not the webhook's fault. A 500 makes Lemon Squeezy
    // retry, which is exactly what should happen.
    console.error("Failed to apply a Lemon Squeezy webhook:", String(error).slice(0, 200));
    return NextResponse.json({ error: "Could not apply the update." }, { status: 500 });
  }
}
