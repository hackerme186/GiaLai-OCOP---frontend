import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Backend API (Render.com)
      {
        protocol: 'https',
        hostname: 'gialai-ocop-be.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'gialai-ocop-be.onrender.com',
        pathname: '/**',
      },
      // Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // Localhost
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      // Wildcard for other HTTPS domains (fallback)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Tăng cache time để giảm số lần optimize
    minimumCacheTTL: 60,
    // Disable optimization cho Cloudinary để tránh timeout
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Tăng timeout cho image optimization (mặc định 10s, tăng lên 30s)
    // Note: Next.js không có option trực tiếp để set timeout, nhưng có thể dùng unoptimized
  },
  // Tăng timeout cho tất cả requests (bao gồm image optimization)
  experimental: {
    // Tăng timeout cho server-side operations
  },
  reactStrictMode: true,
};

export default nextConfig;