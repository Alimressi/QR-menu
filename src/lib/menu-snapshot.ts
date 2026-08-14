import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { MenuRestaurant } from "./menu-query";
import type { CategoryWithDishes } from "@/types";

// A last-known-good copy of each menu, so a database outage is not a blank table.
//
// On 13 August 2026 Neon answered every query with `Control plane request failed`
// for about five and a half hours. The menu page already caught the error instead
// of throwing, but what it degraded to was an empty menu — and to a guest sitting
// at a table with a QR code, an empty menu and a dead site are the same thing.
//
// The database stays the source of truth. The snapshot is written only after a
// successful read, and read only after a failed one, so nothing here can serve
// stale data while the database is healthy: an edit in the admin panel still
// shows up on the very next load.
//
// R2 is used because it is already bound for dish photos. It needs no new
// binding, no new namespace, and no dashboard trip. The Cache API would have
// been the obvious choice and is not usable: it is a silent no-op on a
// workers.dev subdomain, which is exactly where this app is served from.

const KEY_PREFIX = "snapshots/menu";

/**
 * Do not rewrite a snapshot more often than this. Menus change a few times a
 * week; every guest scan re-reading them would be a write per page view.
 */
const MIN_WRITE_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Refuse a snapshot older than this. A menu from last month has wrong prices,
 * and wrong prices are worse than an honest "we're having trouble".
 */
const MAX_SNAPSHOT_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type MenuSnapshot = {
  restaurant: MenuRestaurant;
  categories: CategoryWithDishes[];
  /** When the snapshot was taken, for the staleness check on read. */
  savedAt: string;
};

/** The JSON shape on disk: Date does not survive a round trip through JSON. */
type StoredSnapshot = Omit<MenuSnapshot, "restaurant"> & {
  restaurant: Omit<MenuRestaurant, "trialEndsAt"> & { trialEndsAt: string | null };
};

async function getBucket() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.MEDIA_BUCKET ?? null;
  } catch {
    // Plain `next dev` without the Cloudflare dev proxy — no bindings exist.
    return null;
  }
}

function keyFor(slug: string) {
  return `${KEY_PREFIX}/${encodeURIComponent(slug)}.json`;
}

/**
 * The menu as it last looked when the database was working, or null when there
 * is no snapshot, it is too old, or R2 itself is unreachable.
 *
 * Never throws: this runs on the path where something has already gone wrong.
 */
export async function readMenuSnapshot(slug: string): Promise<MenuSnapshot | null> {
  try {
    const bucket = await getBucket();
    if (!bucket) {
      return null;
    }

    const object = await bucket.get(keyFor(slug));
    if (!object) {
      return null;
    }

    const stored = (await object.json()) as StoredSnapshot;
    const savedAt = Date.parse(stored.savedAt);

    if (!Number.isFinite(savedAt) || Date.now() - savedAt > MAX_SNAPSHOT_AGE_MS) {
      return null;
    }

    return {
      savedAt: stored.savedAt,
      categories: stored.categories,
      restaurant: {
        ...stored.restaurant,
        trialEndsAt: stored.restaurant.trialEndsAt
          ? new Date(stored.restaurant.trialEndsAt)
          : null,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Record a healthy read, unless a recent snapshot already exists.
 *
 * Never throws, and is meant to be handed to `waitUntil` so a guest never waits
 * on it. A failed snapshot write is not worth failing a page that just worked.
 */
export async function writeMenuSnapshot(
  slug: string,
  restaurant: MenuRestaurant,
  categories: CategoryWithDishes[],
): Promise<void> {
  // An empty menu is what a half-broken read looks like. Saving it would mean
  // the fallback serves nothing on the day it is finally needed.
  if (categories.length === 0) {
    return;
  }

  try {
    const bucket = await getBucket();
    if (!bucket) {
      return;
    }

    const key = keyFor(slug);
    const existing = await bucket.head(key);

    if (existing && Date.now() - existing.uploaded.getTime() < MIN_WRITE_INTERVAL_MS) {
      return;
    }

    const payload: StoredSnapshot = {
      savedAt: new Date().toISOString(),
      categories,
      restaurant: {
        ...restaurant,
        trialEndsAt: restaurant.trialEndsAt ? restaurant.trialEndsAt.toISOString() : null,
      },
    };

    await bucket.put(key, JSON.stringify(payload), {
      httpMetadata: { contentType: "application/json", cacheControl: "no-store" },
    });
  } catch {
    // Best effort by design — see the doc comment.
  }
}
