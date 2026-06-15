import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd().replace(/\\apps\\web$/, ""),
  },
};

export default nextConfig;
