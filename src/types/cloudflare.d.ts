// Minimal typing for the Worker bindings this app actually uses.
//
// Deliberately hand-written instead of running `npm run cf-typegen`: the full
// generated `cloudflare-env.d.ts` also pulls in the Workers runtime `Request`,
// whose `json()` returns `unknown` rather than the DOM lib's `any`. That
// retypes every `await request.json()` in the codebase and breaks the build.
// If you ever do generate it, expect to type every route body explicitly.

interface MediaBucketHttpMetadata {
  contentType?: string;
  cacheControl?: string;
}

/** What `head()` returns: metadata only, no body. */
interface MediaBucketObjectHead {
  httpMetadata?: MediaBucketHttpMetadata;
  httpEtag: string;
  size: number;
  /** Write time. Used to rate-limit menu snapshot writes (src/lib/menu-snapshot.ts). */
  uploaded: Date;
}

interface MediaBucketObject extends MediaBucketObjectHead {
  body: ReadableStream;
  json(): Promise<unknown>;
}

interface MediaBucket {
  put(
    key: string,
    // Strings are allowed for the JSON menu snapshots; photos pass an ArrayBuffer.
    value: ArrayBuffer | string,
    options?: { httpMetadata?: MediaBucketHttpMetadata },
  ): Promise<unknown>;
  get(key: string): Promise<MediaBucketObject | null>;
  head(key: string): Promise<MediaBucketObjectHead | null>;
  delete(key: string): Promise<void>;
}

declare global {
  interface CloudflareEnv {
    MEDIA_BUCKET?: MediaBucket;
  }
}

export {};
