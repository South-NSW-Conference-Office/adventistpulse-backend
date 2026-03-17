import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking and linting during Vercel builds (already checked locally)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
