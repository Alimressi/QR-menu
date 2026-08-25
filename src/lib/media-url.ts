// Client-safe half of the media module. `media.ts` pulls in node:crypto and the
// Cloudflare context, so anything a component needs lives here instead.

export const MEDIA_URL_PREFIX = "/api/media/";

/**
 * True for images served by our own Worker route rather than as static assets.
 *
 * These must bypass the next/image optimizer: on Cloudflare it resolves local
 * paths through the ASSETS binding, and an `/api/media/...` path is a route, not
 * an asset — it 404s. Nothing is lost by skipping it, since without an `IMAGES`
 * binding the optimizer returns the source bytes unchanged anyway (verified:
 * w=640 and w=1080 both return the original file byte-for-byte).
 */
export function isWorkerServedMedia(url: string | null | undefined) {
  return typeof url === "string" && url.startsWith(MEDIA_URL_PREFIX);
}

/** Where the card-sized copy of a menu photo lives, if there is one.
 *
 * The card is 133px wide and the stored photo is 1200 — nine times the pixels
 * it can show, and with no image optimizer on this deployment (see
 * next.config.ts) that full file is what the phone downloads. A guest scrolling
 * a 92-dish menu paid about 140KB a card for it.
 *
 * So each photo in /images/dishes gets a "-card" copy beside it, scaled to
 * 400px on its long edge: 15KB instead of 140, and 400px is exactly 133 at the
 * 3x density phones have. The aspect ratio is kept rather than cropped to the
 * card, so a dish whose imagePosition has been nudged in the admin still frames
 * the same way. Full size is still what the detail view opens.
 *
 * Anything served by the Worker (R2 uploads) has no such copy and is returned
 * unchanged; so is anything whose copy is missing, which the card falls back to
 * on error.
 */
export function cardThumbUrl(url: string) {
  return url.startsWith("/images/dishes/") ? url.replace(/\.(jpe?g|png|webp)$/i, "-card.jpg") : url;
}
