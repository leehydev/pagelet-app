import type { PublicPost, SiteSettings } from '@/lib/api';
import { fetchPublicPostBySlug, fetchSiteSettings } from '@/lib/api/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatPostDate } from '@/lib/date-utils';
import { PostContent } from '@/components/app/post/PostContent';
import { AdjacentPostsNav } from '@/components/public/AdjacentPostsNav';

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
    postSlug: string;
  }>;
}

async function getSiteSettings(slug: string): Promise<SiteSettings> {
  try {
    return await fetchSiteSettings(slug);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      notFound();
    }
    console.error('Failed to fetch site settings:', error);
    throw error;
  }
}

async function getPost(siteSlug: string, postSlug: string): Promise<PublicPost> {
  try {
    return await fetchPublicPostBySlug(siteSlug, postSlug);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      notFound();
    }
    console.error('Failed to fetch post:', error);
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, postSlug } = await params;

  let settings: SiteSettings;
  let post: PublicPost;

  try {
    [settings, post] = await Promise.all([getSiteSettings(slug), getPost(slug, postSlug)]);
  } catch {
    return {
      title: '게시글을 찾을 수 없습니다',
    };
  }

  const isProd = process.env.NODE_ENV === 'production';
  const allowIndex = isProd && settings.robotsIndex;

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.subtitle || `${post.title} - ${settings.name}`;

  return {
    title: `${title} - ${settings.name}`,
    description,
    robots: allowIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: post.ogImageUrl
        ? [post.ogImageUrl]
        : settings.ogImageUrl
          ? [settings.ogImageUrl]
          : undefined,
      type: 'article',
      publishedTime: post.publishedAt,
    },
    ...(settings.canonicalBaseUrl && {
      alternates: {
        canonical: `${settings.canonicalBaseUrl}/posts/${postSlug}`,
      },
    }),
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug, postSlug } = await params;
  const [settings, post] = await Promise.all([getSiteSettings(slug), getPost(slug, postSlug)]);

  const formattedDate = formatPostDate(post.publishedAt);

  return (
    <>
      {/* 게시글 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* 카테고리 */}
          {post.categoryName && (
            <div className="">
              <Link href={`/t/${slug}/category/${post.categorySlug}`}>
                <Badge variant="secondary" className="hover:bg-gray-200 transition-colors">
                  {post.categoryName}
                </Badge>
              </Link>
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>

          {/* 부제목 */}
          {post.subtitle && <p className="text-xl text-gray-600">{post.subtitle}</p>}

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <time dateTime={post.publishedAt}>{formattedDate}</time>
            <span>·</span>
            <span>{settings.name}</span>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <PostContent html={post.contentHtml} />
        </div>
      </main>

      {/* 인접 게시글 네비게이션 */}
      {post.adjacentPosts && post.adjacentPosts.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <AdjacentPostsNav posts={post.adjacentPosts} siteSlug={slug} />
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <Link
              href={`/t/${slug}/posts`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 전체 게시글
            </Link>
            <Link
              href={`/t/${slug}`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
