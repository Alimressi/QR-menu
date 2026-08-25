import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

// Makes Worker bindings (R2 media bucket, AI) reachable from `next dev`. If the
// proxy can't start, dev keeps working — uploads just fall back to public/uploads.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev().catch(() => {});
}

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
  // The optimizer is switched off because on this deployment it does nothing.
  // Resizing needs an `IMAGES` binding; without one, /_next/image hands back the
  // source file untouched — verified against production, 125240 bytes through
  // the optimizer and 125240 straight from the asset, byte for byte identical.
  //
  // What it did do was put every photo through the Worker. A menu screen asks
  // for its images in one burst, and a burst is where that broke: a whole run of
  // cards came back with broken thumbnails on a phone, then loaded on reload.
  // Served as plain assets they come off Cloudflare's edge instead, which is
  // both faster and one fewer thing between the guest and the picture.
  //
  // Add the binding and this line comes out again.
  images: {
    unoptimized: true,
  },
  // Prisma client (engineType=client) needs its WASM artifacts at runtime.
  // Include the generated Prisma client directory in the server trace so
  // OpenNext/Cloudflare bundling keeps query_compiler_bg.wasm.
  outputFileTracingIncludes: {
    "*": ["./node_modules/.prisma/client/**/*"],
    "/": ["./node_modules/.prisma/client/**/*"],
    "/*": ["./node_modules/.prisma/client/**/*"],
    "/**": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
