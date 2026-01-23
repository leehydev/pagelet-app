import type { PublicPost, PublicBanner, SiteSettings } from '@/lib/api';
import { fetchPublicPosts, fetchSiteSettings, fetchPublicBanners } from '@/lib/api/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostBannerSlider } from '@/components/public/layout/PostBannerSlider';
import Link from 'next/link';
import { ImprovedPostCard } from '@/components/public/common/PostCard';
import { EmptyPostList } from '@/components/public/common/EmptyPostList';

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getSiteSettings(slug: string): Promise<SiteSettings> {
  try {
    return await fetchSiteSettings(slug);
  } catch (error) {
    // 404 에러인 경우 notFound() 호출
    if (error instanceof Error && error.message.includes('404')) {
      notFound();
    }
    // 다른 에러는 throw (ISR 빌드 실패 유도, 런타임에는 error.tsx로)
    console.error('Failed to fetch site settings:', error);
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getSiteSettings(slug);

  // 환경에 따른 robots 설정
  const isProd = process.env.NODE_ENV === 'production';
  const allowIndex = isProd && settings.robotsIndex;

  const title = settings.seoTitle || settings.name || `${slug} 블로그`;
  const description = settings.seoDescription || `${slug}의 블로그입니다.`;

  return {
    title,
    description,
    keywords: settings.seoKeywords || undefined,
    robots: allowIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
    ...(settings.canonicalBaseUrl && {
      alternates: {
        canonical: `${settings.canonicalBaseUrl}`,
      },
    }),
    // faviconUrl이 없으면 빈 배열로 부모 상속 차단 (404 방지)
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : { icon: [] },
  };
}

async function getPosts(siteSlug: string, limit?: number): Promise<PublicPost[]> {
  try {
    const posts = await fetchPublicPosts(siteSlug);
    // 최신 게시글만 반환 (limit이 지정된 경우)
    return limit ? posts.slice(0, limit) : posts;
  } catch (error) {
    // 게시글은 부가 데이터이므로 에러 로깅 후 빈 배열 반환 (graceful degradation)
    console.error('Failed to fetch posts:', error);
    // TODO: 프로덕션에서는 에러 모니터링 시스템에 전송 (Sentry, LogRocket 등)
    return [];
  }
}

async function getBanners(siteSlug: string): Promise<PublicBanner[]> {
  try {
    return await fetchPublicBanners(siteSlug);
  } catch (error) {
    // 배너는 부가 데이터이므로 에러 로깅 후 빈 배열 반환 (graceful degradation)
    console.error('Failed to fetch banners:', error);
    return [];
  }
}

export default async function TenantHomePage({ params }: PageProps) {
  const { slug } = await params;
  const [, recentPosts, banners] = await Promise.all([
    getSiteSettings(slug),
    getPosts(slug, 6), // 최신 게시글 6개만
    getBanners(slug),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 배너 섹션 */}
      {banners.length > 0 && (
        <div className="py-8">
          <div className="max-w-6xl mx-auto">
            <PostBannerSlider banners={banners} siteSlug={slug} />
          </div>
        </div>
      )}

      {/* Latest Posts Section */}
      {recentPosts.length > 0 && (
        <section className="bg-gray-50 flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Latest Posts</h2>
              <div className="flex items-center gap-2">
                <Link href={`/t/${slug}/posts`}>전체글 보기</Link>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <ImprovedPostCard key={post.id} post={post} siteSlug={slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {recentPosts.length === 0 && <EmptyPostList siteSlug={slug} showBackLink={false} />}
    </div>
  );
}
