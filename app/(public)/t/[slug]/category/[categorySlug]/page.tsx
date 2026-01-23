import type { PublicPost, PublicCategory, SiteSettings } from '@/lib/api';
import { fetchPublicPosts, fetchPublicCategories, fetchSiteSettings } from '@/lib/api/server';
import { Metadata } from 'next';
import { PostCard } from '@/components/public/PostCard';
import { notFound } from 'next/navigation';
import { PostsPageHeader } from '@/components/public/common/PostsPageHeader';
import { EmptyPostList } from '@/components/public/common/EmptyPostList';

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
    categorySlug: string;
  }>;
}

async function getSiteSettings(siteSlug: string): Promise<SiteSettings> {
  try {
    return await fetchSiteSettings(siteSlug);
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

async function getCategories(siteSlug: string): Promise<PublicCategory[]> {
  try {
    return await fetchPublicCategories(siteSlug);
  } catch (error) {
    // 카테고리는 부가 데이터이므로 에러 로깅 후 빈 배열 반환 (graceful degradation)
    console.error('Failed to fetch categories:', error);
    // TODO: 프로덕션에서는 에러 모니터링 시스템에 전송 (Sentry, LogRocket 등)
    return [];
  }
}

async function getPosts(siteSlug: string, categorySlug: string): Promise<PublicPost[]> {
  try {
    return await fetchPublicPosts(siteSlug, categorySlug);
  } catch (error) {
    // 게시글은 부가 데이터이므로 에러 로깅 후 빈 배열 반환 (graceful degradation)
    console.error('Failed to fetch posts:', error);
    // TODO: 프로덕션에서는 에러 모니터링 시스템에 전송 (Sentry, LogRocket 등)
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const [settings, categories] = await Promise.all([getSiteSettings(slug), getCategories(slug)]);

  const category = categories.find((c) => c.slug === categorySlug);
  const siteName = settings.name;
  const categoryName = category?.name || categorySlug;

  const title = `${categoryName} - ${siteName}`;
  const description =
    category?.description || `${siteName}의 ${categoryName} 카테고리 게시글입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
  };
}

export default async function CategoryPostsPage({ params }: PageProps) {
  const { slug, categorySlug } = await params;
  const [posts, categories] = await Promise.all([
    getPosts(slug, categorySlug),
    getCategories(slug),
  ]);

  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) {
    notFound();
  }

  return (
    <>
      {/* 카테고리 정보 */}
      <PostsPageHeader
        category={category.slug}
        title={category.name}
        description={category.description || ''}
      />

      {/* 메인 콘텐츠 */}
      <main className="mx-auto max-w-6xl h-full px-4 py-8">
        {posts.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} siteSlug={slug} />
            ))}
          </div>
        ) : (
          <EmptyPostList
            siteSlug={slug}
            title={`${category.name} 카테고리에 게시글이 없습니다`}
            description="곧 새로운 글이 올라올 예정입니다."
            showBackLink={true}
          />
        )}
      </main>
    </>
  );
}
