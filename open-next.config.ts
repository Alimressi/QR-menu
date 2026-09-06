import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Menu pages are rendered once and kept, instead of being rebuilt for every
// guest.
//
// Rebuilding is what the free plan cannot afford: a 92-dish menu costs about
// 14 ms of CPU against a 10 ms allowance, and every render also woke the
// database. With the page cached, a hundred guests in a minute are served one
// rendered copy — one render, one query — and the cost stops scaling with the
// number of people who scan the code.
//
// R2 rather than KV: the same bucket already holds the dish photos and the
// fallback snapshots, and a menu page is far larger than KV is comfortable
// with.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
