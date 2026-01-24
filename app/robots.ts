import { MetadataRoute } from 'next';

import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const environment = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // staging 환경에서는 noindex
  const shouldIndex = environment === 'production';
  if (!shouldIndex) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // 어드민은 크롤링 차단 ['app', 'admin']
  if (host.startsWith('app.') || host.startsWith('admin.')) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // apex 도메인 (랜딩)
  if (host === 'pagelet.kr' || host === 'www.pagelet.kr') {
    return {
      rules: { userAgent: '*', allow: '/' },
      sitemap: `https://pagelet.kr/sitemap.xml`,
    };
  }

  // 개별 블로그
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: shouldIndex ? `https://${host}/sitemap.xml` : undefined,
  };
}
