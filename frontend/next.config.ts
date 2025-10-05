import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Enable static export for Firebase Hosting
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Remove server-side features for static export
  // serverExternalPackages: ['@google-cloud/firestore'], // Not needed for static
  // Ensure path aliases work in production builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'app'),
      '@/components': path.resolve(__dirname, 'app/components'),
      '@/lib': path.resolve(__dirname, 'app/lib'),
      '@/services': path.resolve(__dirname, 'app/services'),
    };
    return config;
  },
};

export default nextConfig;
