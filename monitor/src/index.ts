import { neon } from "@neondatabase/serverless";
import { buildMenuSnapshot, snapshotKeyFor } from "../../src/lib/menu-snapshot";

// Uptime watchdog for the guest menus.
//
// On 12 August 2026 the live menus were failing roughly 9 requests in 20 for an
// unknown length of time, and nobody knew — it surfaced only because someone
// happened to request the same page dozens of times in a row. Opening a menu
// once and seeing it work says almost nothing when the failure rate is 45%.
//
// So this checks every menu on a schedule, several times per run, and reports a
// FAILURE RATE rather than a single pass/fail. It messages Telegram when a menu
// changes state — starts failing, or recovers — and stays silent otherwise.

// Minimal local shapes instead of the generated Cloudflare types, which also
// bring in the Workers `Request` and break the app's build (see
// src/types/cloudflare.d.ts).
type KvStore = {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
};

type ScheduledEvent = { scheduledTime: number };
type WaitUntilContext = { waitUntil(promise: Promise<unknown>): void };

/** Direct Worker-to-Worker channel to the app. See wrangler.jsonc. */
type ServiceBinding = { fetch(input: string, init?: RequestInit): Promise<Response> };

/** Only the one method the snapshot refresh needs. */
type ObjectStore = {
  put(key: string, value: string, options?: { httpMetadata?: Record<string, string> }): Promise<unknown>;
};

type Env = {
  APP: ServiceBinding;
  MEDIA_BUCKET: ObjectStore;
  MONITOR_STATE: KvStore;
  SITE_URL: string;
  DATABASE_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  /** Shared secret for triggering a check by hand over HTTP. */
  MONITOR_TRIGGER_TOKEN?: string;
};

/**
 * Requests per menu per run. One request cannot see an intermittent fault.
 *
 * Was 4, fired back to back, which meant 20 full server-rendered pages hitting a
 * single app isolate within a couple of seconds. Cloudflare kept killing that
 * isolate with `exceededResources` — and the kills landed on these very requests
 * while spaced-out checks from outside the account sailed through, including
 * during runs where all 20 died. A watchdog that triggers the outage it reports
 * is worse than no watchdog, so the burst is gone: half as many requests, spread
 * out instead of stacked.
 */
const SAMPLES = 2;

/**
 * Alert above this share of failed samples. One slow request is not an outage.
 *
 * Tied to SAMPLES: at 2 samples this means both must fail before a menu counts as
 * down, which keeps the old "a single blip is not an outage" behaviour. Raising
 * SAMPLES without revisiting this makes the monitor twitchier, not sharper.
 */
const FAILURE_THRESHOLD = 0.5;

/**
 * Pause between requests. The point is the gap, not the total: it gives the app
 * isolate room to finish and collect one render before the next arrives.
 */
const SAMPLE_SPACING_MS = 1500;

const STATE_KEY = "menu-status";

type MenuState = Record<string, { down: boolean; since: string }>;

/**
 * Returns what Telegram actually said, rather than assuming it worked.
 *
 * This used to swallow failures and report success anyway, which is the worst
 * possible bug in a monitoring tool: it would have gone on claiming to watch the
 * menus while sending nothing at all.
 */
async function sendTelegram(env: Env, text: string): Promise<{ ok: boolean; detail: string }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return { ok: false, detail: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const body = (await response.json()) as { ok?: boolean; description?: string };

    if (response.ok && body.ok) {
      return { ok: true, detail: "delivered" };
    }

    const detail = body.description ?? `HTTP ${response.status}`;
    console.error("Telegram rejected the message:", detail);
    return { ok: false, detail };
  } catch (error) {
    return { ok: false, detail: String(error).slice(0, 200) };
  }
}

/**
 * Slugs of restaurants currently served to guests — the ones worth alerting on.
 *
 * Retried, because Neon's `Control plane request failed` is a wake-up hiccup that
 * a second attempt usually survives. Without this, one unlucky cold start sent a
 * "the database is unreachable" alert for a database that was fine — and an alert
 * that cries wolf is an alert people stop reading.
 */
async function getServableSlugs(env: Env): Promise<string[]> {
  const sql = neon(env.DATABASE_URL);
  const delaysMs = [500, 1500, 3000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delaysMs.length; attempt += 1) {
    try {
      const rows = (await sql`
        SELECT "slug"
        FROM "Restaurant"
        WHERE "status" IN ('active', 'trial')
        ORDER BY "id" ASC
      `) as Array<Record<string, unknown>>;

      return rows.map((row) => String(row.slug));
    } catch (error) {
      lastError = error;

      if (attempt < delaysMs.length) {
        await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt]));
      }
    }
  }

  throw lastError;
}

/**
 * Refresh the last-known-good copy of every menu in R2.
 *
 * This used to happen inside the app, on the guest page, after the response was
 * sent. It cost the app isolate an 85 KB serialised menu per render and its
 * `exceededResources` kill rate went from 0% to 81% within the hour. Here it
 * runs in a Worker that carries no Next.js, is already awake on a schedule, and
 * can fail without a single guest noticing.
 *
 * Best effort throughout: a menu that cannot be snapshotted leaves the previous
 * one in place, which is exactly what a fallback should do.
 */
async function refreshSnapshots(env: Env, slugs: string[]): Promise<string> {
  // The shared query layer reads its connection string from process.env, which is
  // how the app's runtime supplies it. Set it explicitly rather than depending on
  // the Workers runtime mirroring bindings into process.env for us.
  process.env.DATABASE_URL ||= env.DATABASE_URL;

  let saved = 0;
  let skipped = 0;

  for (const slug of slugs) {
    try {
      const snapshot = await buildMenuSnapshot(slug);

      if (!snapshot) {
        skipped += 1;
        continue;
      }

      await env.MEDIA_BUCKET.put(snapshotKeyFor(slug), JSON.stringify(snapshot), {
        httpMetadata: { contentType: "application/json", cacheControl: "no-store" },
      });

      saved += 1;
    } catch (error) {
      skipped += 1;
      console.error(`snapshot failed for ${slug}:`, String(error).slice(0, 200));
    }
  }

  return `snapshots: ${saved} saved, ${skipped} skipped`;
}

async function measure(env: Env, url: string): Promise<{ failures: number; lastStatus: number }> {
  let failures = 0;
  let lastStatus = 0;

  for (let index = 0; index < SAMPLES; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, SAMPLE_SPACING_MS));
    }

    try {
      const response = await env.APP.fetch(url, {
        headers: { "User-Agent": "qr-menu-monitor" },
        // Never let an edge cache answer for the origin we are testing.
        cache: "no-store",
      });

      lastStatus = response.status;
      if (!response.ok) {
        failures += 1;
      }
    } catch {
      failures += 1;
      lastStatus = 0;
    }
  }

  return { failures, lastStatus };
}

/**
 * @param simulateDownSlug Treat this restaurant as failing, whatever it really
 *   does. A fire drill: it exercises the whole chain — state change, message
 *   wording, delivery — without waiting for a real outage. The next normal run
 *   then reports the recovery, so the drill cleans up after itself.
 */
async function runCheck(env: Env, simulateDownSlug?: string): Promise<string> {
  let slugs: string[];

  try {
    slugs = await getServableSlugs(env);
  } catch (error) {
    // The database being unreachable is itself an outage worth hearing about.
    await sendTelegram(env, `🔴 <b>QR Menu</b>\nCannot read the restaurant list from the database.\n<code>${String(error).slice(0, 200)}</code>`);
    return "database unreachable";
  }

  if (slugs.length === 0) {
    return "no servable restaurants";
  }

  const previous = ((await env.MONITOR_STATE.get(STATE_KEY, "json")) as MenuState | null) ?? {};
  const next: MenuState = {};
  const lines: string[] = [];

  for (const [index, slug] of slugs.entries()) {
    // Menus are spaced apart too, or the gap inside measure() would just be
    // undone at every boundary between one menu and the next.
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, SAMPLE_SPACING_MS));
    }

    const url = `${env.SITE_URL}/${slug}`;
    const measured = await measure(env, url);
    const simulated = simulateDownSlug === slug;
    const { failures, lastStatus } = simulated ? { failures: SAMPLES, lastStatus: 500 } : measured;
    const rate = failures / SAMPLES;
    const down = rate > FAILURE_THRESHOLD;
    const wasDown = previous[slug]?.down ?? false;

    next[slug] = {
      down,
      since: down === wasDown ? (previous[slug]?.since ?? new Date().toISOString()) : new Date().toISOString(),
    };

    lines.push(`${slug}: ${SAMPLES - failures}/${SAMPLES} ok${down ? ` (HTTP ${lastStatus})` : ""}`);

    if (down && !wasDown) {
      await sendTelegram(
        env,
        `🔴 <b>${slug}</b> is failing\n${failures} of ${SAMPLES} requests failed (HTTP ${lastStatus}).\n${url}`,
      );
    }

    if (!down && wasDown) {
      const since = previous[slug]?.since;
      const minutes = since ? Math.round((Date.now() - new Date(since).getTime()) / 60000) : null;
      await sendTelegram(
        env,
        `🟢 <b>${slug}</b> recovered${minutes !== null ? ` after ~${minutes} min` : ""}.\n${url}`,
      );
    }
  }

  await env.MONITOR_STATE.put(STATE_KEY, JSON.stringify(next));

  // After the checks, never before: a slow or failing snapshot refresh must not
  // delay the thing people actually get alerted by.
  lines.push(await refreshSnapshots(env, slugs));

  return lines.join("\n");
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: WaitUntilContext) {
    ctx.waitUntil(runCheck(env).then((summary) => console.log(summary)));
  },

  // Manual trigger, for testing the setup and for checking on demand:
  //   curl "https://qr-menu-monitor.<subdomain>.workers.dev/?token=..."
  // ?test=1 also sends a Telegram message so you can confirm the bot works.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!env.MONITOR_TRIGGER_TOKEN || token !== env.MONITOR_TRIGGER_TOKEN) {
      return new Response("Not found", { status: 404 });
    }

    // Finding your own chat id otherwise means reading raw JSON from the
    // Telegram API. This does that part and prints just the number.
    if (url.searchParams.get("chatid") === "1") {
      if (!env.TELEGRAM_BOT_TOKEN) {
        return new Response("Set TELEGRAM_BOT_TOKEN first.\n", { status: 400 });
      }

      const updates = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`,
      ).then((response) => response.json() as Promise<{ result?: unknown[] }>);

      const chats = new Map<string, string>();

      for (const update of updates.result ?? []) {
        const chat = (update as { message?: { chat?: { id?: unknown; first_name?: unknown; title?: unknown } } })
          .message?.chat;

        if (chat && chat.id !== undefined) {
          chats.set(String(chat.id), String(chat.title ?? chat.first_name ?? ""));
        }
      }

      if (chats.size === 0) {
        return new Response(
          "No messages found.\n\nSend your bot any message in Telegram first, then reload this page.\n",
          { headers: { "Content-Type": "text/plain; charset=utf-8" } },
        );
      }

      const lines = [...chats].map(([id, name]) => `TELEGRAM_CHAT_ID = ${id}${name ? `   (${name})` : ""}`);

      return new Response(`${lines.join("\n")}\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.searchParams.get("test") === "1") {
      const result = await sendTelegram(
        env,
        "🔔 <b>QR Menu monitor</b>\nTest message — notifications are working.",
      );

      // Telegram's own wording is far more useful than a generic failure:
      // "chat not found" means you have not pressed Start in the bot yet,
      // "Unauthorized" means the token is wrong or was revoked.
      return new Response(
        result.ok ? "Delivered to Telegram.\n" : `NOT delivered.\nTelegram said: ${result.detail}\n`,
        {
          status: result.ok ? 200 : 502,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }

    const summary = await runCheck(env, url.searchParams.get("simulate") ?? undefined);

    return new Response(`${summary}\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
