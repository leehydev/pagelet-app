import { MetadataRoute } from 'next';

import { headers } from 'next/headers';
import { fetchPublicPosts, fetchPublicCategories, fetchSiteSettings } from '@/lib/api/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const environment = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'pagelet.kr';

  // 프로덕션이 아니면 빈 sitemap
  if (environment !== 'production') {
    return [];
  }

  // 어드민 서브도메인은 sitemap 불필요
  if (host.startsWith('app.') || host.startsWith('admin.')) {
    return [];
  }

  // apex 도메인 (랜딩)
  if (host === tenantDomain || host === `www.${tenantDomain}`) {
    return [
      {
        url: `https://${tenantDomain}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
    ];
  }

  // 테넌트 서브도메인: slug 추출
  const slug = host.replace(`.${tenantDomain}`, '').split(':')[0];
  if (!slug) return [];

  try {
    const [settings, postsData, categories] = await Promise.all([
      fetchSiteSettings(slug),
      fetchPublicPosts(slug, { limit: 50 }),
      fetchPublicCategories(slug),
    ]);

    // robotsIndex가 꺼져 있으면 빈 sitemap
    if (!settings.robotsIndex) {
      return [];
    }

    const baseUrl = settings.canonicalBaseUrl || `https://${host}`;
    const entries: MetadataRoute.Sitemap = [];

    // 홈
    entries.push({
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });

    // 전체 게시글 목록
    entries.push({
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });

    // 카테고리 페이지
    for (const category of categories) {
      entries.push({
        url: `${baseUrl}/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // 개별 게시글
    for (const post of postsData.items) {
      entries.push({
        url: `${baseUrl}/posts/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly',
        priority: 0.9,
      });
    }

    return entries;
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return [];
  }
}
