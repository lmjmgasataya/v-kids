import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.ngrok-free.dev"],
  experimental: {
    serverActions: {
      // Default is 1MB; raw phone-camera photos need headroom before server-side resize.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
