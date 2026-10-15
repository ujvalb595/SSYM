import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: true,
};

// Server reload trigger - updated prisma schema
export default nextConfig;
