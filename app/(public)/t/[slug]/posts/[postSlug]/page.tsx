import type { PublicPost, SiteSettings } from '@/lib/api';
import { fetchPublicPostBySlug, fetchSiteSettings } from '@/lib/api/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatPostDate } from '@/lib/date-utils';
import { PostContent } from '@/components/app/post/PostContent';
import { AdjacentPostsNav } from '@/components/public/AdjacentPostsNav';
import { AdjacentPostsMobileNav } from '@/components/public/AdjacentPostsMobileNav';
import { ShareButton } from '@/components/public/common/ShareButton';

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
    postSlug: string;
  }>;
  searchParams: Promise<{
    from?: string;
    categorySlug?: string;
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

async function getPost(
  siteSlug: string,
  postSlug: string,
  categorySlug?: string,
): Promise<PublicPost> {
  try {
    return await fetchPublicPostBySlug(siteSlug, postSlug, categorySlug);
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

  // og:url 생성 - canonicalBaseUrl이 있으면 사용, 없으면 테넌트 도메인 사용
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'pagelet.kr';
  const baseUrl = settings.canonicalBaseUrl || `https://${slug}.${tenantDomain}`;
  const ogUrl = `${baseUrl}/posts/${postSlug}`;

  return {
    title: `${title} - ${settings.name}`,
    description,
    robots: allowIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: ogUrl,
      siteName: settings.name,
      images: post.ogImageUrl
        ? [{ url: post.ogImageUrl, width: 1200, height: 630 }]
        : settings.ogImageUrl
          ? [{ url: settings.ogImageUrl, width: 1200, height: 630 }]
          : undefined,
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.ogImageUrl
        ? [post.ogImageUrl]
        : settings.ogImageUrl
          ? [settings.ogImageUrl]
          : undefined,
    },
    ...(settings.canonicalBaseUrl && {
      alternates: {
        canonical: `${settings.canonicalBaseUrl}/posts/${postSlug}`,
      },
    }),
  };
}

export default async function PostDetailPage({ params, searchParams }: PageProps) {
  const { slug, postSlug } = await params;
  const { from, categorySlug: queryCategorySlug } = await searchParams;

  // 카테고리 페이지에서 접근한 경우, categorySlug를 전달하여 카테고리 기준 인접 게시글 조회
  const categorySlugForAdjacent = from === 'category' ? queryCategorySlug : undefined;

  const [settings, post] = await Promise.all([
    getSiteSettings(slug),
    getPost(slug, postSlug, categorySlugForAdjacent),
  ]);

  const formattedDate = formatPostDate(post.publishedAt);

  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'pagelet.kr';
  const baseUrl = settings.canonicalBaseUrl || `https://${slug}.${tenantDomain}`;
  const postUrl = `${baseUrl}/posts/${postSlug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.subtitle || '',
    datePublished: post.publishedAt,
    url: postUrl,
    ...(post.ogImageUrl && { image: post.ogImageUrl }),
    author: {
      '@type': 'Organization',
      name: settings.name,
    },
    publisher: {
      '@type': 'Organization',
      name: settings.name,
      ...(settings.logoImageUrl && {
        logo: { '@type': 'ImageObject', url: settings.logoImageUrl },
      }),
    },
  };

  return (
    <div className="*:max-w-3xl *:w-full flex flex-col items-center p-4 md:p-2 xl:p-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 게시글 헤더 */}
      <div>
        <div className=" py-12 border-b border-gray-200">
          {/* 카테고리 */}
          {post.categoryName && (
            <div className="">
              <Link href={`/t/${slug}/category/${post.categorySlug}`}>
                <Badge variant="default" className="hover:bg-gray-200 transition-colors">
                  {post.categoryName}
                </Badge>
              </Link>
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-col md:flex-row gap-2 justify-between items-baseline">
            <div>
              {/* 부제목 */}
              {post.subtitle && <p className="text-xl text-gray-600">{post.subtitle}</p>}

              {/* 메타 정보 */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <time dateTime={post.publishedAt}>{formattedDate}</time>
                <span>·</span>
                <span>{settings.name}</span>
              </div>
            </div>
            <div>
              <ShareButton />
            </div>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <main className="">
        <div className=" py-12 border-b border-gray-200">
          <PostContent html={post.contentHtml} />
        </div>
      </main>

      {/* 인접 게시글 네비게이션 */}
      {post.adjacentPosts && post.adjacentPosts.length > 0 && (
        <div className="">
          <div className="">
            <AdjacentPostsNav
              posts={post.adjacentPosts}
              siteSlug={slug}
              className="hidden md:block"
            />
            <AdjacentPostsMobileNav
              posts={post.adjacentPosts}
              siteSlug={slug}
              className="block md:hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
