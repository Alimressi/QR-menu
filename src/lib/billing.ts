import crypto from "crypto";
import { TRIAL_DAYS, type RestaurantStatus } from "./subscription";

// Lemon Squeezy is the merchant of record: they take the card, they handle tax
// and refunds, and this app never sees a card number. What arrives here is a
// signed webhook saying what happened to a subscription.
//
// Everything in this file is a pure function on purpose. The webhook route is
// the part that cannot be tested without a live Cloudflare request, so it is
// kept as thin as possible and all the judgement lives here, where
// scripts/check-billing.ts can exercise it in milliseconds.

/**
 * Verify the X-Signature header.
 *
 * This is the whole security model. Without it the endpoint is an unauthenticated
 * "make my restaurant active forever" button for anyone who guesses the URL.
 *
 * The comparison is timing-safe. A plain `===` leaks how much of the signature
 * was correct through response timing, which is enough to recover a valid one
 * byte at a time given patience.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !signatureHeader) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.trim().toLowerCase();

  // timingSafeEqual throws on a length mismatch, which would itself be a signal.
  if (received.length !== expected.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

/** The Lemon Squeezy subscription states this app has to answer for. */
const LEMON_SQUEEZY_STATUSES = [
  "on_trial",
  "active",
  "paused",
  "past_due",
  "unpaid",
  "cancelled",
  "expired",
] as const;

export type LemonSqueezyStatus = (typeof LEMON_SQUEEZY_STATUSES)[number];

/**
 * Translate their subscription state into ours.
 *
 * Driven by the subscription's own `status` rather than the event name, because
 * the event name tells you what happened while the status tells you where things
 * stand — and after a burst of out-of-order webhooks only the second one is safe
 * to act on.
 *
 * The judgement calls worth knowing:
 *
 *   cancelled  A guest cancelled but has paid until the end of the period. They
 *              keep their menu until Lemon Squeezy sends `expired`. Cutting a
 *              paying customer off early is the worse mistake.
 *   paused     Their own doing, and reversible. Show the notice, keep the data.
 *   unpaid     Retries have run out. Same as past_due from a guest's point of
 *              view: the menu shows a notice, nothing is deleted.
 */
export function mapLemonSqueezyStatus(status: string): RestaurantStatus | null {
  switch (status) {
    case "on_trial":
      return "trial";
    case "active":
    case "cancelled":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
    case "expired":
      return "disabled";
    default:
      // An unknown state must not silently disable a paying restaurant. The
      // route logs it and changes nothing.
      return null;
  }
}

export type SubscriptionEvent = {
  eventName: string;
  subscriptionId: string;
  customerId: string | null;
  restaurantId: number | null;
  status: RestaurantStatus;
  /** Only set while the subscription is genuinely on trial. */
  trialEndsAt: Date | null;
};

type Payload = {
  meta?: { event_name?: unknown; custom_data?: { restaurant_id?: unknown } };
  data?: {
    id?: unknown;
    attributes?: {
      status?: unknown;
      trial_ends_at?: unknown;
      customer_id?: unknown;
    };
  };
};

/**
 * Read a subscription webhook into the few facts this app acts on.
 *
 * Returns null for anything that is not an actionable subscription event —
 * order webhooks, unknown states, malformed bodies. The caller answers 200 to
 * those: a webhook this app does not care about is not a failure, and replying
 * with an error would have Lemon Squeezy retry it for hours.
 */
export function parseSubscriptionEvent(body: unknown): SubscriptionEvent | null {
  const payload = body as Payload;
  const eventName = payload?.meta?.event_name;

  if (typeof eventName !== "string" || !eventName.startsWith("subscription_")) {
    return null;
  }

  const subscriptionId = payload?.data?.id;
  if (typeof subscriptionId !== "string" && typeof subscriptionId !== "number") {
    return null;
  }

  const rawStatus = payload?.data?.attributes?.status;
  if (typeof rawStatus !== "string") {
    return null;
  }

  const status = mapLemonSqueezyStatus(rawStatus);
  if (status === null) {
    return null;
  }

  const rawRestaurantId = payload?.meta?.custom_data?.restaurant_id;
  const restaurantId = Number(rawRestaurantId);

  const rawCustomerId = payload?.data?.attributes?.customer_id;

  const rawTrialEnds = payload?.data?.attributes?.trial_ends_at;
  let trialEndsAt: Date | null = null;

  if (status === "trial" && typeof rawTrialEnds === "string") {
    const parsed = new Date(rawTrialEnds);
    if (!Number.isNaN(parsed.getTime())) {
      trialEndsAt = parsed;
    }
  }

  return {
    eventName,
    subscriptionId: String(subscriptionId),
    customerId:
      typeof rawCustomerId === "string" || typeof rawCustomerId === "number"
        ? String(rawCustomerId)
        : null,
    restaurantId: Number.isInteger(restaurantId) && restaurantId > 0 ? restaurantId : null,
    status,
    trialEndsAt,
  };
}

/**
 * Where to send a restaurant to start paying.
 *
 * `restaurant_id` rides along as custom data and comes back on the webhook,
 * which is what ties a payment to a tenant. Everything else about the plan —
 * price, currency, trial length — lives in Lemon Squeezy, not here.
 */
export function buildCheckoutUrl(storeUrl: string, variantId: string, restaurantId: number): string {
  const base = storeUrl.replace(/\/+$/, "");
  const url = new URL(`${base}/checkout/buy/${encodeURIComponent(variantId)}`);

  url.searchParams.set("checkout[custom][restaurant_id]", String(restaurantId));

  return url.toString();
}

/** Trial end for a restaurant created here rather than through a checkout. */
export function defaultTrialEndsAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}
