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
  images: {
    qualities: [75, 95],
    formats: ["image/avif", "image/webp"],
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
