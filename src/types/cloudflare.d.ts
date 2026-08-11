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

interface MediaBucketObject {
  body: ReadableStream;
  httpMetadata?: MediaBucketHttpMetadata;
  httpEtag: string;
  size: number;
}

interface MediaBucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: MediaBucketHttpMetadata },
  ): Promise<unknown>;
  get(key: string): Promise<MediaBucketObject | null>;
  delete(key: string): Promise<void>;
}

declare global {
  interface CloudflareEnv {
    MEDIA_BUCKET?: MediaBucket;
  }
}

export {};
