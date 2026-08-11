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
