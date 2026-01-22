import type { NextConfig } from 'next';

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
  // 개발 환경에서 cross-origin 요청 허용 (멀티테넌트 서브도메인 구조)
  allowedDevOrigins: [
    'app.pagelet-dev.kr',
    'app.localhost',
    // 와일드카드는 지원하지 않으므로 주요 서브도메인만 명시
    // 필요시 추가 서브도메인을 여기에 추가
  ],
};

export default nextConfig;
