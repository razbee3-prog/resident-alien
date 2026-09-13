import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser automation packages must stay as real node_modules at runtime; bundling them breaks their internal requires.
  serverExternalPackages: ["playwright-core", "@browserbasehq/sdk"],
  // playwright-core loads files (browsers.json, lib/*) by computed path, which output tracing misses; ship the whole
  // package with every route that can lazily import src/lib/coach/browser.ts.
  outputFileTracingIncludes: {
    "/api/connect/**": ["./node_modules/playwright-core/**/*"],
    "/api/cron/**": ["./node_modules/playwright-core/**/*"],
    "/api/sendblue/**": ["./node_modules/playwright-core/**/*"],
    "/api/coach/**": ["./node_modules/playwright-core/**/*"],
  },
};

export default nextConfig;
