import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Node.js runtime (not Edge) for Prisma compatibility
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
