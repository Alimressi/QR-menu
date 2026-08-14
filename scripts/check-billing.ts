/**
 * The billing webhook's judgement, without the network.
 *
 * The signature check is the entire security model of the endpoint: get it wrong
 * and anyone who finds the URL can switch their own subscription on, or switch a
 * competitor's off. The status mapping decides whether a paying restaurant keeps
 * serving guests. Both are pure functions, so there is no reason not to pin them.
 *
 * Run: npm run check:billing
 */
import crypto from "crypto";
import {
  buildCheckoutUrl,
  mapLemonSqueezyStatus,
  parseSubscriptionEvent,
  verifyWebhookSignature,
} from "@/lib/billing";

let failures = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

const SECRET = "test-signing-secret";
const sign = (body: string, secret = SECRET) =>
  crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");

/**
 * Change the last digit to a definitely different one.
 *
 * Appending a fixed character instead would produce the original signature
 * whenever it already ended in that character — a check that passes about
 * fifteen times in sixteen and looks like a real failure the one time it does not.
 */
const flipLastHexDigit = (signature: string) =>
  signature.slice(0, -1) + (signature.endsWith("a") ? "b" : "a");

function payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    meta: { event_name: "subscription_updated", custom_data: { restaurant_id: "7" } },
    data: {
      id: "sub_123",
      attributes: { status: "active", customer_id: 4242, trial_ends_at: null },
    },
    ...overrides,
  });
}

console.log("signature verification");
const body = payload();
check("a correctly signed body is accepted", verifyWebhookSignature(body, sign(body), SECRET));
check("uppercase hex is accepted", verifyWebhookSignature(body, sign(body).toUpperCase(), SECRET));
check("surrounding whitespace is tolerated", verifyWebhookSignature(body, ` ${sign(body)} `, SECRET));

console.log("\nsignature rejection — each of these is someone trying");
check("a body altered after signing", !verifyWebhookSignature(payload({ tampered: true }), sign(body), SECRET));
check("a signature from a different secret", !verifyWebhookSignature(body, sign(body, "other-secret"), SECRET));
check("no signature header at all", !verifyWebhookSignature(body, null, SECRET));
check("an empty signature", !verifyWebhookSignature(body, "", SECRET));
check("a truncated signature", !verifyWebhookSignature(body, sign(body).slice(0, -2), SECRET));
check("a signature with one byte changed", !verifyWebhookSignature(body, flipLastHexDigit(sign(body)), SECRET));
check("non-hex rubbish", !verifyWebhookSignature(body, "not-a-signature", SECRET));
check("no secret configured on our side", !verifyWebhookSignature(body, sign(body), undefined));
check("an empty secret is not a valid secret", !verifyWebhookSignature(body, sign(body), ""));

console.log("\nstatus mapping");
check("on_trial keeps them on trial", mapLemonSqueezyStatus("on_trial") === "trial");
check("active serves the menu", mapLemonSqueezyStatus("active") === "active");
check("past_due shows the notice", mapLemonSqueezyStatus("past_due") === "past_due");
check("unpaid shows the notice", mapLemonSqueezyStatus("unpaid") === "past_due");
check("paused shows the notice", mapLemonSqueezyStatus("paused") === "disabled");
check("expired shows the notice", mapLemonSqueezyStatus("expired") === "disabled");
check(
  "cancelled keeps serving — they have paid to the end of the period",
  mapLemonSqueezyStatus("cancelled") === "active",
);
check("an unknown state changes nothing", mapLemonSqueezyStatus("something_new") === null);
check("an empty state changes nothing", mapLemonSqueezyStatus("") === null);

console.log("\nreading the event");
const parsed = parseSubscriptionEvent(JSON.parse(payload()));
check("subscription id is read", parsed?.subscriptionId === "sub_123");
check("restaurant id comes off custom data", parsed?.restaurantId === 7);
check("customer id is stringified", parsed?.customerId === "4242");
check("status is mapped", parsed?.status === "active");
check("no trial end when not on trial", parsed?.trialEndsAt === null);

const onTrial = parseSubscriptionEvent(
  JSON.parse(
    payload({
      data: {
        id: 999,
        attributes: { status: "on_trial", customer_id: 1, trial_ends_at: "2026-09-01T00:00:00.000Z" },
      },
    }),
  ),
);
check("a numeric subscription id becomes a string", onTrial?.subscriptionId === "999");
check("trial end is parsed", onTrial?.trialEndsAt instanceof Date);
check("trial end is the right date", onTrial?.trialEndsAt?.toISOString() === "2026-09-01T00:00:00.000Z");
check("an unparseable trial date does not throw", parseSubscriptionEvent(
  JSON.parse(payload({ data: { id: "s", attributes: { status: "on_trial", trial_ends_at: "nope" } } })),
)?.trialEndsAt === null);

console.log("\nevents this app must ignore rather than act on");
check("an order webhook", parseSubscriptionEvent(JSON.parse(payload({ meta: { event_name: "order_created" } }))) === null);
check("a missing event name", parseSubscriptionEvent(JSON.parse(payload({ meta: {} }))) === null);
check(
  "an unknown subscription state",
  parseSubscriptionEvent(JSON.parse(payload({ data: { id: "s", attributes: { status: "invented" } } }))) === null,
);
check(
  "a missing status",
  parseSubscriptionEvent(JSON.parse(payload({ data: { id: "s", attributes: {} } }))) === null,
);
check("a missing subscription id", parseSubscriptionEvent(JSON.parse(payload({ data: { attributes: { status: "active" } } }))) === null);

console.log("\nmalformed bodies never throw");
check("null", parseSubscriptionEvent(null) === null);
check("undefined", parseSubscriptionEvent(undefined) === null);
check("a string", parseSubscriptionEvent("nope") === null);
check("empty object", parseSubscriptionEvent({}) === null);
check("meta but no data", parseSubscriptionEvent({ meta: { event_name: "subscription_created" } }) === null);

console.log("\nmissing custom data is survivable, not fatal");
const noCustom = parseSubscriptionEvent(
  JSON.parse(payload({ meta: { event_name: "subscription_updated" } })),
);
check("the event still parses", noCustom !== null);
check("restaurant id is null, to be looked up by subscription id", noCustom?.restaurantId === null);
check(
  "a non-numeric restaurant id is refused",
  parseSubscriptionEvent(
    JSON.parse(payload({ meta: { event_name: "subscription_updated", custom_data: { restaurant_id: "abc" } } })),
  )?.restaurantId === null,
);
check(
  "a negative restaurant id is refused",
  parseSubscriptionEvent(
    JSON.parse(payload({ meta: { event_name: "subscription_updated", custom_data: { restaurant_id: -3 } } })),
  )?.restaurantId === null,
);

console.log("\ncheckout link");
const url = buildCheckoutUrl("https://qrmenu.lemonsqueezy.com", "12345", 7);
check("points at the variant", url.startsWith("https://qrmenu.lemonsqueezy.com/checkout/buy/12345"));
check("carries the restaurant id back to us", url.includes("checkout%5Bcustom%5D%5Brestaurant_id%5D=7"));
check(
  "a trailing slash on the store url does not double up",
  buildCheckoutUrl("https://qrmenu.lemonsqueezy.com/", "1", 2).includes(".com/checkout/buy/1"),
);

async function checkAgainstDatabase() {
  const { getSql } = await import("@/lib/db");
  const { applySubscriptionFromBilling, findRestaurantStatusById } = await import("@/lib/menu-query");

  const sql = getSql();
  const stamp = Date.now();
  const ids: number[] = [];

  try {
    const make = async (slug: string) => {
      const [row] = (await sql`
        INSERT INTO "Restaurant" ("name","slug","status","updatedAt")
        VALUES ('Billing Fixture', ${slug}, 'trial', NOW()) RETURNING "id"
      `) as Array<{ id: number }>;
      ids.push(Number(row.id));
      return Number(row.id);
    };

    const paying = await make(`zz-bill-${stamp}`);
    const other = await make(`zz-bill-other-${stamp}`);

    console.log("\nfirst webhook — the checkout tells us who they are");
    const first = await applySubscriptionFromBilling({
      subscriptionId: `sub-${stamp}`,
      customerId: "cust-1",
      restaurantId: paying,
      status: "active",
      trialEndsAt: null,
    });
    check("the restaurant is matched", first.matched && first.restaurantId === paying);
    check("their menu is switched on", (await findRestaurantStatusById(paying))?.status === "active");

    console.log("\nlater webhook — no custom data, found by subscription id");
    const renewal = await applySubscriptionFromBilling({
      subscriptionId: `sub-${stamp}`,
      customerId: "cust-1",
      restaurantId: null,
      status: "past_due",
      trialEndsAt: null,
    });
    check("still matched without custom data", renewal.matched && renewal.restaurantId === paying);
    check("the notice goes up", (await findRestaurantStatusById(paying))?.status === "past_due");
    check("nobody else was touched", (await findRestaurantStatusById(other))?.status === "trial");

    console.log("\nan edited checkout link cannot steal a subscription");
    // restaurant_id is a query parameter, so treat it as hostile: here it names
    // `other` while Lemon Squeezy has already tied this subscription to
    // `paying`. Letting custom data win would mean buying one month against a
    // competitor's id and cancelling to close their menu.
    const conflict = await applySubscriptionFromBilling({
      subscriptionId: `sub-${stamp}`,
      customerId: "cust-1",
      restaurantId: other,
      status: "active",
      trialEndsAt: null,
    });
    check("it resolves rather than erroring", conflict.matched);
    check("the established subscription link wins", conflict.restaurantId === paying);
    check("the targeted restaurant is untouched", (await findRestaurantStatusById(other))?.status === "trial");

    console.log("\na subscription for nobody");
    const orphan = await applySubscriptionFromBilling({
      subscriptionId: `sub-unknown-${stamp}`,
      customerId: null,
      restaurantId: null,
      status: "active",
      trialEndsAt: null,
    });
    check("reports no match instead of throwing", !orphan.matched && orphan.restaurantId === null);
  } finally {
    for (const id of ids) {
      await sql`DELETE FROM "Restaurant" WHERE "id" = ${id}`;
    }
    const [{ count }] = (await sql`
      SELECT COUNT(*)::int AS count FROM "Restaurant" WHERE "slug" LIKE 'zz-bill%'
    `) as Array<{ count: number }>;
    console.log(`\nfixtures removed (rows left: ${count})`);
  }
}

checkAgainstDatabase().then(() => {
  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
});
