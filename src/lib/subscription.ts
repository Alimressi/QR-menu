// Whether a tenant is currently paid up, and what guests see when it is not.
//
// Suspending a restaurant never deletes anything: the menu, photos, theme and
// admin account all stay exactly as they were, so switching a client back on is
// a single field change rather than a re-onboarding.

export const RESTAURANT_STATUSES = ["trial", "active", "past_due", "disabled"] as const;

export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];

export function isRestaurantStatus(value: unknown): value is RestaurantStatus {
  return typeof value === "string" && (RESTAURANT_STATUSES as readonly string[]).includes(value);
}

type SubscriptionFields = {
  status?: string | null;
  trialEndsAt?: Date | string | null;
};

/**
 * The status that actually applies right now.
 *
 * A trial is only a trial until its end date — after that it behaves as unpaid
 * without anyone having to run a job to flip it. An unrecognised value is
 * treated as "active" so a bad write can never take a paying client's menu down.
 */
export function getEffectiveStatus(restaurant: SubscriptionFields): RestaurantStatus {
  const status = restaurant.status;

  if (!isRestaurantStatus(status)) {
    return "active";
  }

  if (status === "trial") {
    const endsAt = restaurant.trialEndsAt ? new Date(restaurant.trialEndsAt) : null;
    const expired = endsAt !== null && !Number.isNaN(endsAt.getTime()) && endsAt.getTime() <= Date.now();
    return expired ? "past_due" : "trial";
  }

  return status;
}

/** True when guests should see the menu and be able to order. */
export function isRestaurantServable(restaurant: SubscriptionFields): boolean {
  const effective = getEffectiveStatus(restaurant);
  return effective === "trial" || effective === "active";
}

/** Days left in a trial, or null when not on one. Negative means it lapsed. */
export function getTrialDaysLeft(restaurant: SubscriptionFields): number | null {
  if (restaurant.status !== "trial" || !restaurant.trialEndsAt) {
    return null;
  }

  const endsAt = new Date(restaurant.trialEndsAt);
  if (Number.isNaN(endsAt.getTime())) {
    return null;
  }

  return Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Length of the free trial a newly created restaurant starts on. */
export const TRIAL_DAYS = 14;

/**
 * Read the two subscription fields off a super-admin request body.
 *
 * A key that is absent stays absent in the result, so a PATCH that does not
 * mention subscription never overwrites it. An unrecognised status is dropped
 * rather than stored, keeping the column to the four known values.
 */
export function parseSubscriptionInput(body: { status?: unknown; trialEndsAt?: unknown }): {
  status?: RestaurantStatus;
  trialEndsAt?: Date | null;
} {
  const parsed: { status?: RestaurantStatus; trialEndsAt?: Date | null } = {};

  if (isRestaurantStatus(body.status)) {
    parsed.status = body.status;
  }

  if (body.trialEndsAt === null || body.trialEndsAt === "") {
    parsed.trialEndsAt = null;
  } else if (typeof body.trialEndsAt === "string") {
    const date = new Date(body.trialEndsAt);
    if (!Number.isNaN(date.getTime())) {
      parsed.trialEndsAt = date;
    }
  }

  return parsed;
}

/** Guest-facing notice shown in place of the menu, in all three menu languages. */
export const SUSPENDED_NOTICE = {
  az: {
    title: "Menyu müvəqqəti əlçatmaz",
    body: "Zəhmət olmasa ofisiantla əlaqə saxlayın.",
  },
  ru: {
    title: "Меню временно недоступно",
    body: "Пожалуйста, обратитесь к официанту.",
  },
  en: {
    title: "Menu temporarily unavailable",
    body: "Please ask a member of staff for assistance.",
  },
} as const;
