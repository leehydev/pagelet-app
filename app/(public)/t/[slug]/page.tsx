import { fetchPublicPosts, fetchSiteSettings, PublicPost, SiteSettings } from '@/lib/api';
import { Metadata } from 'next';
import { PostCard } from '@/components/public/PostCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
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

export default async function TenantHomePage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, recentPosts] = await Promise.all([
    getSiteSettings(slug),
    getPosts(slug, 6), // 최신 게시글 6개만
  ]);

  return (
    <>
      {/* 히어로 섹션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{settings.name}</h1>
            {settings.seoDescription && (
              <p className="text-xl text-gray-600 mb-8">{settings.seoDescription}</p>
            )}
          </div>
        </div>
      </div>

      {/* 최신 게시글 섹션 */}
      {recentPosts.length > 0 && (
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">최신 게시글</h2>
                <p className="text-gray-600">최근에 올라온 게시글을 확인해보세요.</p>
              </div>
              <Link
                href={`/t/${slug}/posts`}
                className="px-6 py-2 text-gray-500 rounded-md transition-colors font-medium"
              >
                전체 보기 →
              </Link>
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} siteSlug={slug} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 게시글이 없을 때 */}
      {recentPosts.length === 0 && (
        <div className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-medium text-gray-600 mb-2">아직 게시글이 없습니다</h2>
              <p className="text-gray-400">곧 새로운 글이 올라올 예정입니다.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
