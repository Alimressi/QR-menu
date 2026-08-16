import type { NextRequest } from "next/server";

/**
 * The address a guest would type, taken from the request that is being served.
 *
 * NEXT_PUBLIC_* variables are inlined by Next at BUILD time. `.env` carries
 * `NEXT_PUBLIC_BASE_URL=http://localhost:3000` for local work, so that string is
 * compiled into the bundle and ships to production, where the runtime var of the
 * same name set in wrangler.jsonc can never override it.
 *
 * That is not theoretical. Every table QR link this app generated pointed at
 * `http://localhost:3000/<slug>?table=...`: scanning one took a guest to their
 * own phone, and pasting one into a browser hit a local dev server whose signing
 * secret differs from production, which answered "Invalid QR link. Please scan
 * the QR code on your table." The links were correct in every part except the
 * host, which is the one part nobody reads.
 *
 * The incoming request always knows the host it arrived on, so use it and ignore
 * the build-time constant entirely.
 */
export function publicOriginFrom(request: NextRequest): string {
  const host = request.headers.get("host");

  if (host) {
    // Cloudflare terminates TLS at the edge, so the origin request is plain
    // HTTP; the header is what says how the guest actually connected.
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
