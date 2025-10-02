import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for proper SSR
  // output: 'export',
  // trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
