import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript build errors (optional)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Other helpful configurations
  reactStrictMode: false,
  
  // Suppress hydration warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
};

export default nextConfig;