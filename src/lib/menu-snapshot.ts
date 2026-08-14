import { findMenuByRestaurantId, findRestaurantBySlug, type MenuRestaurant } from "./menu-query";
import type { CategoryWithDishes } from "../types";

// A last-known-good copy of each menu, so a database outage is not a blank table.
//
// On 13 August 2026 Neon answered every query with `Control plane request failed`
// for about five and a half hours. The menu page already caught the error instead
// of throwing, but what it degraded to was an empty menu — and to a guest sitting
// at a table with a QR code, an empty menu and a dead site are the same thing.
//
// WHO WRITES THESE: the monitor Worker, not this app. The first version wrote a
// snapshot from the guest page itself, inside waitUntil. That put an 85 KB
// serialised menu in the app isolate's memory after every render, and the app's
// `exceededResources` kill rate went from 0% to 81% within the hour. The monitor
// already walks every menu on a schedule, is a separate Worker, and carries none
// of Next.js — it is the right place for housekeeping. See monitor/src/index.ts.
//
// This module holds only what both sides must agree on: the key, the format, and
// how a snapshot is built from the database. The app's read path lives in
// menu-snapshot-store.ts, which is the half that needs a Cloudflare request
// context; keeping it out of here is what lets the monitor import this file.
//
// R2 rather than the Cache API, which is a silent no-op on a workers.dev
// subdomain — exactly where this app is served from.

/** Imports here stay relative on purpose: the monitor is bundled by esbuild
 *  without the app's `@/*` path alias. */

const KEY_PREFIX = "snapshots/menu";

/**
 * Refuse a snapshot older than this. A menu from last month has wrong prices,
 * and wrong prices are worse than an honest "we're having trouble".
 */
export const MAX_SNAPSHOT_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function snapshotKeyFor(slug: string) {
  return `${KEY_PREFIX}/${encodeURIComponent(slug)}.json`;
}

export type MenuSnapshot = {
  restaurant: MenuRestaurant;
  categories: CategoryWithDishes[];
  /** When the snapshot was taken, for the staleness check on read. */
  savedAt: string;
};

/** The JSON shape on disk: Date does not survive a round trip through JSON. */
export type StoredSnapshot = Omit<MenuSnapshot, "restaurant"> & {
  restaurant: Omit<MenuRestaurant, "trialEndsAt"> & { trialEndsAt: string | null };
};

/**
 * Read the menu straight from the database and shape it for storage.
 *
 * Returns null when there is nothing worth saving — an unknown slug, or a menu
 * that came back empty. Saving an empty menu would mean the fallback serves
 * nothing on the day it is finally needed.
 */
export async function buildMenuSnapshot(slug: string): Promise<StoredSnapshot | null> {
  const restaurant = await findRestaurantBySlug(slug);

  if (!restaurant) {
    return null;
  }

  const categories = await findMenuByRestaurantId(restaurant.id);

  if (categories.length === 0) {
    return null;
  }

  return {
    savedAt: new Date().toISOString(),
    categories,
    restaurant: {
      ...restaurant,
      trialEndsAt: restaurant.trialEndsAt ? restaurant.trialEndsAt.toISOString() : null,
    },
  };
}

/**
 * Turn stored JSON back into a usable snapshot, or null when it is unusable.
 *
 * Never throws: every caller is already on a path where something has gone wrong.
 */
export function parseMenuSnapshot(raw: unknown): MenuSnapshot | null {
  try {
    const stored = raw as StoredSnapshot;
    const savedAt = Date.parse(stored?.savedAt);

    if (!Number.isFinite(savedAt) || Date.now() - savedAt > MAX_SNAPSHOT_AGE_MS) {
      return null;
    }

    if (!Array.isArray(stored.categories) || !stored.restaurant) {
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
