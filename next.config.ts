import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    qualities: [75, 95],
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
