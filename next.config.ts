import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser automation packages must stay as real node_modules at runtime; bundling them breaks their internal requires.
  serverExternalPackages: ["playwright-core", "@browserbasehq/sdk"],
};

export default nextConfig;
