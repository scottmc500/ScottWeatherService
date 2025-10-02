import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['lh3.googleusercontent.com', 'graph.microsoft.com']
  }
};

export default nextConfig;
