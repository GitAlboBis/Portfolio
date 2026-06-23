import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first for better compression, WebP fallback for older clients.
    formats: ["image/avif", "image/webp"],
    // Site imagery is largely static — cache optimized images for a year.
    minimumCacheTTL: 31536000,
    // Allow opting into higher quality for hero/poster assets.
    qualities: [75, 90],
  },
};

export default nextConfig;
