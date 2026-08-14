import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type MenuSnapshot, parseMenuSnapshot, snapshotKeyFor } from "./menu-snapshot";

// The app's half of the snapshot: reading one, and nothing else.
//
// Writing lives in the monitor Worker (see menu-snapshot.ts for why). This file
// is deliberately the only place in the app that touches R2 for menus, and it
// only ever runs after a database read has already failed.

async function getBucket() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.MEDIA_BUCKET ?? null;
  } catch {
    // Plain `next dev` without the Cloudflare dev proxy — no bindings exist.
    return null;
  }
}

/**
 * The menu as it last looked when the database was working, or null when there
 * is no snapshot, it is too old, or R2 itself is unreachable.
 *
 * Never throws.
 */
export async function readMenuSnapshot(slug: string): Promise<MenuSnapshot | null> {
  try {
    const bucket = await getBucket();
    if (!bucket) {
      return null;
    }

    const object = await bucket.get(snapshotKeyFor(slug));
    if (!object) {
      return null;
    }

    return parseMenuSnapshot(await object.json());
  } catch {
    return null;
  }
}
