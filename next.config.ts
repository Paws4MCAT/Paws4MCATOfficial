import type { NextConfig } from "next";

const allowedDevOrigins = process.env.REPLIT_DEV_DOMAIN
  ? [process.env.REPLIT_DEV_DOMAIN]
  : [];

const nextConfig: NextConfig = {
  // Avoid Sharp/image optimizer hangs in some dev environments (Docker, iCloud dirs).
  allowedDevOrigins,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
