import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.pagelet.kr',
      },
      {
        protocol: 'https',
        hostname: 'assets.pagelet-dev.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 개발 환경에서 cross-origin 요청 허용 (멀티테넌트 서브도메인 구조)
  allowedDevOrigins: ['*.pagelet-dev.kr', '*.localhost'],
};

export default nextConfig;
