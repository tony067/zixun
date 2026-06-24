import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@eazo/sdk/react": path.resolve("./src/lib/eazo-shim.ts"),
      "@eazo/sdk/server": path.resolve("./src/lib/auth/index.ts"),
      "@eazo/sdk": path.resolve("./src/lib/eazo-shim.ts"),
    };
    return config;
  },
};

export default nextConfig;
