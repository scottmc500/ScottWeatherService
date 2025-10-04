import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase App Hosting supports full Next.js with SSR and API routes
  // No need for static export - use full Next.js capabilities
  images: {
    domains: ['lh3.googleusercontent.com', 'graph.microsoft.com']
  },
  // External packages for server components
  serverExternalPackages: ['@google-cloud/firestore']
};

export default nextConfig;
