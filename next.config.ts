import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@prisma/client-runtime-utils"],
};

export default nextConfig;
