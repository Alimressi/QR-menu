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
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
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
  /** Optional. Without it the compute-hours check quietly does not run. */
  NEON_API_KEY?: string;
  NEON_PROJECT_ID?: string;
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
/** The day the look-ahead last spoke, so it speaks at most once per day. */
const WARNED_KEY = "warned-on";
/** Yesterday's compute reading, so today's can be turned into a rate. */
const COMPUTE_SAMPLE_KEY = "compute-sample";
/** Free-plan egress allowance, in GB. */
const TRANSFER_LIMIT_GB = 5;

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
// ---- The daily look ahead -------------------------------------------------
//
// The outage alerts above say a menu is already broken. These say one is going
// to break, which is the message worth having: on 6 September the free
// database allowance was on course to run out on the 28th, and nothing in this
// worker would have mentioned it.
//
// Sent once a day and only when something is actually wrong. A monitor that
// writes every morning to say all is well is a monitor nobody reads.

/** Free-plan ceiling for Neon storage. */
const DB_SIZE_LIMIT_MB = 512;
/** Warn while there is still time to act, not when the wall is reached. */
const DB_SIZE_WARN_RATIO = 0.7;
/** A snapshot older than this means the safety net has quietly stopped. */
const SNAPSHOT_STALE_HOURS = 24;
/** A trial worth mentioning before it lapses on a paying-to-be client. */
const TRIAL_WARN_DAYS = 5;
/** The free plan's monthly compute allowance, in CU-hours. */
const CU_HOURS_LIMIT = 100;
/** Speak when the month is on course to end above this share of it. */
const CU_HOURS_WARN_RATIO = 0.8;

/**
 * Compute hours used this billing period, and where the month is heading.
 *
 * This is the one that nearly bit: on 6 September the project was 21.64 hours
 * into a 100-hour month on day six, which projects to 108 — and nothing said
 * so. A projection is the useful form. "Used 78 of 100" invites waiting;
 * "on course for 108, out on the 26th" is a date to act before.
 *
 * Projected from the recent rate, not from the period average. The difference
 * is not academic: on 7 September the average since the 1st still forecast 114
 * hours and an allowance gone by the 27th, while the previous day had actually
 * used 0.56 — the six days before a fix were dragging the mean. An average
 * cannot tell "we are burning too much" from "we were, and stopped", and the
 * second is the answer you get after doing something about the first.
 *
 * The rate comes from the change since yesterday's reading, kept in KV. With no
 * previous sample there is nothing to compare against, so the first run only
 * records one.
 *
 * Needs an API key. Without one this returns nothing rather than complaining
 * every morning about a key that may never be set on purpose.
 */
async function neonWarnings(env: Env): Promise<string[]> {
  if (!env.NEON_API_KEY || !env.NEON_PROJECT_ID) {
    return [];
  }

  const response = await fetch(`https://console.neon.tech/api/v2/projects/${env.NEON_PROJECT_ID}`, {
    headers: { Authorization: `Bearer ${env.NEON_API_KEY}`, Accept: "application/json" },
  });

  if (!response.ok) {
    return [`🗄 Neon usage unreadable (HTTP ${response.status}). The API key may have expired.`];
  }

  const body = (await response.json()) as {
    project?: {
      compute_time_seconds?: number;
      data_transfer_bytes?: number;
      consumption_period_start?: string;
      consumption_period_end?: string;
    };
  };
  const project = body.project;

  if (!project?.compute_time_seconds || !project.consumption_period_start || !project.consumption_period_end) {
    return [];
  }

  const used = project.compute_time_seconds / 3600;
  const start = new Date(project.consumption_period_start).getTime();
  const end = new Date(project.consumption_period_end).getTime();
  const elapsed = Date.now() - start;

  const transferGb = (project.data_transfer_bytes ?? 0) / 1024 ** 3;

  const previous = (await env.MONITOR_STATE.get(COMPUTE_SAMPLE_KEY, "json")) as
    | { at: number; hours: number; transferGb?: number }
    | null;

  await env.MONITOR_STATE.put(
    COMPUTE_SAMPLE_KEY,
    JSON.stringify({ at: Date.now(), hours: used, transferGb }),
  );

  // Nothing to compare against yet, or the samples are too close together for
  // the difference to mean anything.
  const sinceSample = previous ? Date.now() - previous.at : 0;
  if (!previous || sinceSample < 12 * 3_600_000) {
    return [];
  }

  const perDay = ((used - previous.hours) / sinceSample) * 86_400_000;
  const daysLeft = (end - Date.now()) / 86_400_000;
  const projected = used + Math.max(0, perDay) * daysLeft;

  const warnings: string[] = [];

  if (projected >= CU_HOURS_LIMIT * CU_HOURS_WARN_RATIO) {
    const daysToLimit = perDay > 0 ? (CU_HOURS_LIMIT - used) / perDay : Infinity;
    const runsOutOn =
      projected > CU_HOURS_LIMIT
        ? new Date(Date.now() + daysToLimit * 86_400_000).toISOString().slice(0, 10)
        : null;

    warnings.push(
      `🗄 Neon compute: ${used.toFixed(1)} of ${CU_HOURS_LIMIT} CU-hours used, ` +
        `${perDay.toFixed(2)}/day lately, on course for ${projected.toFixed(0)} this period` +
        (runsOutOn ? ` — the allowance runs out around ${runsOutOn}.` : "."),
    );
  }

  // Egress. Menu photos are served by Cloudflare, not Postgres, so this rises
  // with admin work rather than with guests — but it is a hard monthly ceiling
  // like the others, and nothing else would mention it.
  if (previous.transferGb !== undefined) {
    const gbPerDay = ((transferGb - previous.transferGb) / sinceSample) * 86_400_000;
    const projectedGb = transferGb + Math.max(0, gbPerDay) * daysLeft;

    if (projectedGb >= TRANSFER_LIMIT_GB * 0.8) {
      warnings.push(
        `🌐 Neon egress: ${transferGb.toFixed(2)} of ${TRANSFER_LIMIT_GB} GB used, ` +
          `on course for ${projectedGb.toFixed(1)} this period.`,
      );
    }
  }

  return warnings;
}

async function dailyWarnings(env: Env): Promise<string[]> {
  const warnings: string[] = [];
  const sql = neon(env.DATABASE_URL);

  // Storage. Far from the ceiling today, and the one limit that creeps up on
  // its own as restaurants are added rather than as guests arrive.
  try {
    const rows = (await sql`
      SELECT pg_database_size(current_database()) / 1024 / 1024 AS mb
    `) as Array<{ mb: number }>;
    const usedMb = Math.round(Number(rows[0]?.mb ?? 0));

    if (usedMb > DB_SIZE_LIMIT_MB * DB_SIZE_WARN_RATIO) {
      warnings.push(`💾 Database ${usedMb} MB of ${DB_SIZE_LIMIT_MB} MB.`);
    }
  } catch (error) {
    warnings.push(`💾 Could not read the database size: ${String(error).slice(0, 120)}`);
  }

  // Subscriptions. A lapsed one replaces a paying client's menu with a notice,
  // and the first anybody hears of it is usually the client.
  try {
    const rows = (await sql`
      SELECT "slug", "status", "trialEndsAt"
      FROM "Restaurant"
      WHERE "status" <> 'active'
      ORDER BY "id" ASC
    `) as Array<{ slug: string; status: string; trialEndsAt: string | null }>;

    for (const row of rows) {
      if (row.status === "past_due" || row.status === "disabled") {
        warnings.push(`💳 ${row.slug} is ${row.status} — guests see the suspended notice.`);
        continue;
      }

      if (row.status === "trial" && row.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(row.trialEndsAt).getTime() - Date.now()) / 86_400_000);

        if (daysLeft <= TRIAL_WARN_DAYS) {
          warnings.push(
            daysLeft < 0
              ? `💳 ${row.slug} trial ended ${-daysLeft} day(s) ago.`
              : `💳 ${row.slug} trial ends in ${daysLeft} day(s).`,
          );
        }
      }
    }
  } catch (error) {
    warnings.push(`💳 Could not read restaurant statuses: ${String(error).slice(0, 120)}`);
  }

  return warnings;
}

/** Whether every menu still has a snapshot fresh enough to serve from. */
async function staleSnapshots(env: Env, slugs: string[]): Promise<string[]> {
  const stale: string[] = [];

  for (const slug of slugs) {
    try {
      const object = await env.MEDIA_BUCKET.get(snapshotKeyFor(slug));

      if (!object) {
        stale.push(`${slug} (none)`);
        continue;
      }

      const body = (await object.json()) as { savedAt?: string };
      const savedAt = body.savedAt ? new Date(body.savedAt).getTime() : 0;
      const hours = (Date.now() - savedAt) / 3_600_000;

      if (!savedAt || hours > SNAPSHOT_STALE_HOURS) {
        stale.push(`${slug} (${Math.round(hours)}h)`);
      }
    } catch {
      stale.push(`${slug} (unreadable)`);
    }
  }

  return stale;
}

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

/**
 * One request, asked over both channels when the first does not answer.
 *
 * `publicOk` is the one that decides whether anyone is told. See runCheck.
 */
type Probe = {
  publicOk: boolean;
  bindingOk: boolean;
  status: number;
  via: "public" | "binding";
};

/**
 * Ask for a menu the way a guest does, and only fall back to the private
 * channel if Cloudflare refuses.
 *
 * On 15 August 2026 the service binding reported all five menus down for eleven
 * hours while the same pages, requested from outside, returned 200 in under a
 * second. Every one of those binding invocations was killed with
 * `exceededResources` before it made a single database call. Whatever that is,
 * it is not what a guest experiences — and a watchdog that measures a channel no
 * customer uses will keep raising alarms nobody can act on.
 *
 * So the public URL comes first: it goes through DNS, TLS and the edge, which is
 * the whole path a phone at a table takes. Cloudflare blocks some Worker-to-
 * Worker requests on a shared workers.dev subdomain (Error 1042), and until this
 * app has its own domain that block may still apply — hence the fallback, and
 * hence `via`, which says in the logs which channel actually answered.
 */
async function probe(env: Env, url: string): Promise<Probe> {
  // The public request can only ever CONFIRM health, never declare an outage.
  //
  // A Worker asking for its own account's workers.dev address does not reach the
  // app: the first version of this check trusted the answer and reported 404 for
  // all five menus while every one of them was serving guests normally in under
  // a second. Detecting Cloudflare's Error 1042 was not enough — the refusal
  // arrives as an ordinary-looking 404, indistinguishable from a menu that is
  // genuinely missing.
  //
  // So a good answer here is believed, and a bad one is never acted on alone.
  // When this app has its own domain the public path will start working and this
  // becomes the real end-to-end check, through DNS, TLS and the edge, which is
  // the whole path a phone at a table takes.
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "qr-menu-monitor" },
      // Never let an edge cache answer for the origin we are testing.
      cache: "no-store",
    });

    // Drain the body: reading only the status leaves the stream hanging, and an
    // empty body behind a 200 is a broken menu that used to count as healthy.
    const body = await response.text();

    if (response.ok && body.length > 0) {
      return { publicOk: true, bindingOk: true, status: response.status, via: "public" };
    }
  } catch {
    // Fall through: ask the private channel so the logs still say something.
  }

  const response = await env.APP.fetch(url, {
    headers: { "User-Agent": "qr-menu-monitor" },
    cache: "no-store",
  });

  const body = await response.text();

  return {
    publicOk: false,
    bindingOk: response.ok && body.length > 0,
    status: response.status,
    via: "binding",
  };
}

type Measurement = {
  /** Failures as judged by the channel a guest actually uses. */
  publicFailures: number;
  /** Failures over the private channel, kept for the log only. */
  bindingFailures: number;
  /** True if the public channel answered properly at least once. */
  publicAnswered: boolean;
  lastStatus: number;
  via: string;
};

async function measure(env: Env, url: string): Promise<Measurement> {
  let publicFailures = 0;
  let bindingFailures = 0;
  let publicAnswered = false;
  let lastStatus = 0;
  let via = "public";

  for (let index = 0; index < SAMPLES; index += 1) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, SAMPLE_SPACING_MS));
    }

    try {
      const result = await probe(env, url);

      lastStatus = result.status;
      via = result.via;

      if (result.publicOk) {
        publicAnswered = true;
      } else {
        publicFailures += 1;
      }

      if (!result.bindingOk) {
        bindingFailures += 1;
      }
    } catch {
      publicFailures += 1;
      bindingFailures += 1;
      lastStatus = 0;
    }
  }

  return { publicFailures, bindingFailures, publicAnswered, lastStatus, via };
}

/**
 * @param simulateDownSlug Treat this restaurant as failing, whatever it really
 *   does. A fire drill: it exercises the whole chain — state change, message
 *   wording, delivery — without waiting for a real outage. The next normal run
 *   then reports the recovery, so the drill cleans up after itself.
 */
async function runCheck(
  env: Env,
  simulateDownSlug?: string,
  withSnapshots = true,
  withWarnings = false,
): Promise<string> {
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

  type Checked = { slug: string; url: string; measured: Measurement; simulated: boolean };
  const checked: Checked[] = [];

  for (const [index, slug] of slugs.entries()) {
    // Menus are spaced apart too, or the gap inside measure() would just be
    // undone at every boundary between one menu and the next.
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, SAMPLE_SPACING_MS));
    }

    const url = `${env.SITE_URL}/${slug}`;
    checked.push({ slug, url, measured: await measure(env, url), simulated: simulateDownSlug === slug });
  }

  // Does the public channel work AT ALL right now?
  //
  // This is the question that decides whether anyone gets woken up, and it is
  // asked across all menus rather than per menu. A Worker requesting its own
  // account's workers.dev address does not reach the app — the refusal arrives as
  // an ordinary 404 — so on this deployment the public check fails for every
  // menu, always, no matter how healthy they are.
  //
  // Judging each menu on its own could not tell that apart from a real outage,
  // and on 15-16 August it did not: the watchdog held all five "down" for twelve
  // hours and sent two rounds of false alarms while every page was serving
  // guests in under a second. An alert nobody can act on trains people to ignore
  // the next one, which is the failure that actually costs money.
  //
  // If no menu answers publicly, the channel is broken rather than the menus.
  // Alerts are suppressed and the run is logged as observation only. If at least
  // one answers, the channel demonstrably works, so a menu that fails it is
  // genuinely failing for guests, and alerts mean something again.
  //
  // Nothing needs changing when this app gets its own domain: the public check
  // will start answering and alerting resumes by itself.
  const publicChannelWorks = checked.some((entry) => entry.measured.publicAnswered);

  for (const { slug, url, measured, simulated } of checked) {
    const failures = simulated
      ? SAMPLES
      : publicChannelWorks
        ? measured.publicFailures
        : measured.bindingFailures;
    const lastStatus = simulated ? 500 : measured.lastStatus;
    const via = simulated ? "simulated" : measured.via;

    const down = failures / SAMPLES > FAILURE_THRESHOLD;
    const wasDown = previous[slug]?.down ?? false;

    // While the public channel is unusable, nothing is recorded as down. Writing
    // it would fire a "recovered" message later for an outage that never was.
    const recorded = publicChannelWorks ? down : false;

    next[slug] = {
      down: recorded,
      since:
        recorded === wasDown
          ? (previous[slug]?.since ?? new Date().toISOString())
          : new Date().toISOString(),
    };

    const note = publicChannelWorks ? "" : " [public check unavailable — not alerting]";
    lines.push(
      `${slug}: ${SAMPLES - failures}/${SAMPLES} ok via ${via}${down ? ` (HTTP ${lastStatus})` : ""}${note}`,
    );

    if (!publicChannelWorks && !simulated) {
      continue;
    }

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
  // Rebuilding six whole menus is the heaviest thing in this cycle and the
  // least urgent: a snapshot is read only when the database is down, and one an
  // hour old serves a guest exactly as well as one from a minute ago. The
  // health probes stay on the half hour; this rides every second run.
  if (withSnapshots) {
    lines.push(await refreshSnapshots(env, slugs));
  }

  // Once a day, and only if there is something to say.
  if (withWarnings) {
    const today = new Date().toISOString().slice(0, 10);
    const lastWarned = await env.MONITOR_STATE.get(WARNED_KEY);

    if (lastWarned !== today) {
      const warnings = [...(await dailyWarnings(env))];

      try {
        warnings.push(...(await neonWarnings(env)));
      } catch (error) {
        warnings.push(`🗄 Could not read Neon usage: ${String(error).slice(0, 120)}`);
      }
      const stale = await staleSnapshots(env, slugs);

      if (stale.length > 0) {
        // Worth saying plainly: nothing looks wrong while this is true, right
        // up until the database goes down and there is nothing to fall back to.
        warnings.push(`🗂 Stale fallback snapshots: ${stale.join(", ")}. A database outage would show empty menus.`);
      }

      if (warnings.length > 0) {
        await sendTelegram(env, `⚠️ <b>QR Menu — worth looking at</b>\n\n${warnings.join("\n")}`);
        lines.push(`warnings sent: ${warnings.length}`);
      } else {
        lines.push("warnings: none");
      }

      await env.MONITOR_STATE.put(WARNED_KEY, today);
    }
  }

  return lines.join("\n");
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: WaitUntilContext) {
    // On the hour, refresh the snapshots too; on the half hour, only probe.
    const at = new Date(event.scheduledTime);
    const onTheHour = at.getUTCMinutes() < 30;
    // 06:00 UTC is ten in the morning in Baku — read with coffee, not at night,
    // and early enough to act on the same day.
    const morning = at.getUTCHours() === 6 && onTheHour;
    ctx.waitUntil(runCheck(env, undefined, onTheHour, morning).then((summary) => console.log(summary)));
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

    // ?warn=1 runs the daily look-ahead now instead of waiting for the morning,
    // and ignores the once-a-day guard so it can be tested twice in a row.
    if (url.searchParams.get("warn") === "1") {
      await env.MONITOR_STATE.delete(WARNED_KEY);
    }

    const summary = await runCheck(
      env,
      url.searchParams.get("simulate") ?? undefined,
      true,
      url.searchParams.get("warn") === "1",
    );

    return new Response(`${summary}\n`, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
