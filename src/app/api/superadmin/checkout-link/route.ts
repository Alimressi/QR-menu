import { isSuperAdmin } from "@/lib/auth";
import { buildCheckoutUrl } from "@/lib/billing";
import { findRestaurantStatusById } from "@/lib/menu-query";
import { NextRequest, NextResponse } from "next/server";

// The link a restaurant follows to start paying.
//
// Built here rather than in the browser so the store and variant stay one
// runtime setting instead of something inlined into a bundle at build time —
// NEXT_PUBLIC_* is undefined during the build on this Worker, which is the trap
// NEXT_PUBLIC_BASE_URL already fell into (see src/app/[slug]/page.tsx).
//
// Super admin only. The URL itself is not a secret — anyone can open a checkout
// — but the restaurant_id it carries decides which tenant a payment switches on,
// so handing out pre-built links for arbitrary ids is not something a stranger
// gets to do.

export async function GET(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storeUrl = process.env.LEMON_SQUEEZY_STORE_URL;
  const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

  if (!storeUrl || !variantId) {
    return NextResponse.json(
      { error: "Billing is not configured: LEMON_SQUEEZY_STORE_URL or LEMON_SQUEEZY_VARIANT_ID is unset." },
      { status: 503 },
    );
  }

  const restaurantId = Number(new URL(request.url).searchParams.get("restaurantId"));

  if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
    return NextResponse.json({ error: "restaurantId is required." }, { status: 400 });
  }

  // A link for a restaurant that does not exist would take a payment nobody
  // could apply: the webhook would find no tenant and the money would sit there.
  const restaurant = await findRestaurantStatusById(restaurantId);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  return NextResponse.json(
    { url: buildCheckoutUrl(storeUrl, variantId, restaurantId) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
