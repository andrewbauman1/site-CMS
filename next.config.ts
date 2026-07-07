import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'imagedelivery.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.cloudflarestream.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
