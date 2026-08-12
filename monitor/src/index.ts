import { neon } from "@neondatabase/serverless";

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

type Env = {
  MONITOR_STATE: KvStore;
  SITE_URL: string;
  DATABASE_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  /** Shared secret for triggering a check by hand over HTTP. */
  MONITOR_TRIGGER_TOKEN?: string;
};

/** Requests per menu per run. One request cannot see an intermittent fault. */
const SAMPLES = 4;

/** Alert above this share of failed samples. One slow request is not an outage. */
const FAILURE_THRESHOLD = 0.25;

const STATE_KEY = "menu-status";

type MenuState = Record<string, { down: boolean; since: string }>;

async function sendTelegram(env: Env, text: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.error("Telegram is not configured; skipping notification.");
    return;
  }

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

  if (!response.ok) {
    console.error("Telegram rejected the message:", response.status, await response.text());
  }
}

/** Slugs of restaurants currently served to guests — the ones worth alerting on. */
async function getServableSlugs(env: Env): Promise<string[]> {
  const sql = neon(env.DATABASE_URL);

  const rows = (await sql`
    SELECT "slug"
    FROM "Restaurant"
    WHERE "status" IN ('active', 'trial')
    ORDER BY "id" ASC
  `) as Array<Record<string, unknown>>;

  return rows.map((row) => String(row.slug));
}

async function measure(url: string): Promise<{ failures: number; lastStatus: number }> {
  let failures = 0;
  let lastStatus = 0;

  for (let index = 0; index < SAMPLES; index += 1) {
    try {
      const response = await fetch(url, {
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

async function runCheck(env: Env): Promise<string> {
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

  for (const slug of slugs) {
    const url = `${env.SITE_URL}/${slug}`;
    const { failures, lastStatus } = await measure(url);
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
      await sendTelegram(env, "🔔 <b>QR Menu monitor</b>\nTest message — notifications are working.");
      return new Response("Test message sent.\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const summary = await runCheck(env);

    return new Response(`${summary}\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
