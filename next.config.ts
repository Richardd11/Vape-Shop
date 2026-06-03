import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA and image optimization config
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
