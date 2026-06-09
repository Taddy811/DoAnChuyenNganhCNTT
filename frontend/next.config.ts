import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    // Keep Turbopack scoped to this Next.js app; the repo has multiple lockfiles.
    root: appDir,
  },
  async rewrites() {
    return [
      {
        // Tự động chuyển mọi lệnh gọi /api/ xuống cổng 5000 của Backend
        source: '/api/:path*', 
        destination: 'http://localhost:5000/api/:path*', 
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
    ]
  },
};

export default nextConfig;
