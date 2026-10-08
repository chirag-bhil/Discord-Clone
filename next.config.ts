import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Next/Turbopack focused on this app when another lockfile exists
  // higher in the workspace (for example, /home/chirag/package-lock.json).
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      "bufferutil": "commonjs bufferutil",
    });
    return config;
  },
  images: {
    domains: [
      "5d2dz8cv18.ufs.sh"
    ]
  }
};

export default nextConfig;
