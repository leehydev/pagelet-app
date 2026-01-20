import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pagelet-dev.kr';
  const environment = process.env.APP_ENV || process.env.NODE_ENV || 'development';

  // staging 환경에서는 noindex
  const shouldIndex = environment === 'production';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: shouldIndex ? [] : ['/'], // staging에서는 모든 페이지 noindex
      },
    ],
    sitemap: shouldIndex ? `${baseUrl}/sitemap.xml` : undefined,
  };
}
