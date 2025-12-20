import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
    // FUSE-STYLE Enforcement: ESLint must pass for production builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
        pathname: '/api/storage/**',
      },
    ],
  },
};

export default nextConfig;
