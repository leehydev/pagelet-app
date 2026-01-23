import type { PublicPost, SiteSettings } from '@/lib/api';
import { fetchPublicPosts, fetchSiteSettings } from '@/lib/api/server';
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

  const title = `전체 게시글 - ${settings.seoTitle || settings.name || slug}`;
  const description = `${settings.name || slug}의 모든 게시글을 확인하세요.`;

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
        canonical: `${settings.canonicalBaseUrl}/posts`,
      },
    }),
  };
}

async function getPosts(siteSlug: string, categorySlug?: string): Promise<PublicPost[]> {
  try {
    return await fetchPublicPosts(siteSlug, categorySlug);
  } catch (error) {
    // 게시글은 부가 데이터이므로 에러 로깅 후 빈 배열 반환 (graceful degradation)
    console.error('Failed to fetch posts:', error);
    // TODO: 프로덕션에서는 에러 모니터링 시스템에 전송 (Sentry, LogRocket 등)
    return [];
  }
}

export default async function AllPostsPage({ params }: PageProps) {
  const { slug } = await params;
  const posts = await getPosts(slug);

  return (
    <>
      {/* 전체 게시글 섹션 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ALL POSTS
            </span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">전체 게시글</h2>
          <p className="text-gray-600 text-lg max-w-3xl">모든 게시글을 확인하세요.</p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-6xl h-full px-4 py-8">
        {posts.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} siteSlug={slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-medium text-gray-600 mb-2">아직 게시글이 없습니다</h2>
            <p className="text-gray-400 mb-6">곧 새로운 글이 올라올 예정입니다.</p>
            <Link href={`/t/${slug}`} className="text-blue-600 hover:text-blue-700 font-medium">
              메인으로 돌아가기 →
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
