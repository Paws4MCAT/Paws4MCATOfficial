import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid Sharp/image optimizer hangs in some dev environments (Docker, iCloud dirs).
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
