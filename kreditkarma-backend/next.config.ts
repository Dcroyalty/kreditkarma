// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow API routes to run longer (for XRPL requests)
  serverExternalPackages: ["xrpl"],
  
  // CORS headers for frontend integration
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_APP_URL ?? "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, x-admin-secret" },
        ],
      },
    ];
  },
};

export default nextConfig;
