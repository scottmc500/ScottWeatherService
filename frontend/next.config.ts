import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Firebase App Hosting supports full Next.js with SSR and API routes
  // No need for static export - use full Next.js capabilities
  images: {
    domains: ['lh3.googleusercontent.com', 'graph.microsoft.com']
  },
  // External packages for server components
  serverExternalPackages: ['@google-cloud/firestore'],
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
