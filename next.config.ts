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

  // 기존 URL 구조에서 새 URL 구조로 리다이렉트 (siteId 제거)
  async redirects() {
    return [
      // /admin/[siteId] → /admin/dashboard
      {
        source: '/admin/:siteId((?!dashboard|posts|categories|banners|settings)[^/]+)',
        destination: '/admin/dashboard',
        permanent: true,
      },
      // /admin/[siteId]/posts → /admin/posts
      {
        source: '/admin/:siteId/posts',
        destination: '/admin/posts',
        permanent: true,
      },
      // /admin/[siteId]/posts/new → /admin/posts/new
      {
        source: '/admin/:siteId/posts/new',
        destination: '/admin/posts/new',
        permanent: true,
      },
      // /admin/[siteId]/posts/[postId] → /admin/posts/[postId]
      {
        source: '/admin/:siteId/posts/:postId',
        destination: '/admin/posts/:postId',
        permanent: true,
      },
      // /admin/[siteId]/posts/[postId]/edit → /admin/posts/[postId]/edit
      {
        source: '/admin/:siteId/posts/:postId/edit',
        destination: '/admin/posts/:postId/edit',
        permanent: true,
      },
      // /admin/[siteId]/categories → /admin/categories
      {
        source: '/admin/:siteId/categories',
        destination: '/admin/categories',
        permanent: true,
      },
      // /admin/[siteId]/categories/new → /admin/categories/new
      {
        source: '/admin/:siteId/categories/new',
        destination: '/admin/categories/new',
        permanent: true,
      },
      // /admin/[siteId]/categories/[id]/edit → /admin/categories/[id]/edit
      {
        source: '/admin/:siteId/categories/:id/edit',
        destination: '/admin/categories/:id/edit',
        permanent: true,
      },
      // /admin/[siteId]/banners → /admin/banners
      {
        source: '/admin/:siteId/banners',
        destination: '/admin/banners',
        permanent: true,
      },
      // /admin/[siteId]/settings → /admin/settings
      {
        source: '/admin/:siteId/settings',
        destination: '/admin/settings',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
