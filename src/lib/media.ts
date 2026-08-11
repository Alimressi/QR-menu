import { getCloudflareContext } from "@opennextjs/cloudflare";
import { randomUUID } from "crypto";
import { MEDIA_URL_PREFIX } from "./media-url";

// Uploaded dish photos are served from this route, which streams them out of R2.
// Pre-R2 images live in public/uploads and keep their old `/uploads/...` URLs —
// those are static assets and are untouched by anything here.
export { MEDIA_URL_PREFIX };

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// SVG is deliberately absent: it is executable markup, and serving a
// guest-visible SVG uploaded through the admin panel is a stored-XSS vector.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function isAllowedImageType(contentType: string) {
  return contentType in ALLOWED_IMAGE_TYPES;
}

export function allowedImageTypeList() {
  return Object.keys(ALLOWED_IMAGE_TYPES).join(", ");
}

/**
 * Identify the image from its leading bytes rather than trusting the
 * browser-supplied MIME type or the file extension.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // RIFF....WEBP and ftyp-based AVIF both live in the first 12 bytes.
  if (bytes.length >= 12) {
    const ascii = (start: number, end: number) =>
      String.fromCharCode(...bytes.subarray(start, end));

    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
      return "image/webp";
    }

    if (ascii(4, 8) === "ftyp") {
      const brand = ascii(8, 12);
      if (brand === "avif" || brand === "avis") {
        return "image/avif";
      }
    }
  }

  return null;
}

async function getMediaBucket() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.MEDIA_BUCKET ?? null;
  } catch {
    // Plain `next dev` without the Cloudflare dev proxy — no bindings exist.
    return null;
  }
}

export type StoredMedia = {
  url: string;
  storage: "r2" | "filesystem";
};

/**
 * Store an uploaded image and return the URL to save on the dish.
 *
 * Keys are prefixed per restaurant (`r<id>/<uuid>.<ext>`) so one tenant's media
 * can be listed, migrated or deleted without touching anyone else's.
 */
export async function putMedia(
  restaurantId: number,
  bytes: Uint8Array,
  contentType: string,
): Promise<StoredMedia> {
  const extension = ALLOWED_IMAGE_TYPES[contentType] ?? "bin";
  const key = `r${restaurantId}/${randomUUID()}.${extension}`;

  const bucket = await getMediaBucket();

  if (bucket) {
    // Copy into a standalone ArrayBuffer: R2 rejects a view over a larger buffer.
    const body = bytes.slice().buffer as ArrayBuffer;

    await bucket.put(key, body, {
      httpMetadata: {
        contentType,
        // Keys are random and never rewritten, so the object is immutable.
        cacheControl: "public, max-age=31536000, immutable",
      },
    });

    return { url: `${MEDIA_URL_PREFIX}${key}`, storage: "r2" };
  }

  // Local development fallback: behave exactly as the app did before R2.
  const { promises: fs } = await import("fs");
  const path = await import("path");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadsDir, fileName), bytes);

  return { url: `/uploads/${fileName}`, storage: "filesystem" };
}

export async function getMedia(key: string) {
  const bucket = await getMediaBucket();
  if (!bucket) {
    return null;
  }

  return bucket.get(key);
}
