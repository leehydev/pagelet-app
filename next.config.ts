import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.pagelet-dev.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
