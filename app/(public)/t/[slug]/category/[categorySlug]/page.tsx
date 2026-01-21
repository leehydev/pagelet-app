import {
  fetchPublicPosts,
  fetchPublicCategories,
  fetchSiteSettings,
  PublicPost,
  PublicCategory,
  SiteSettings,
} from '@/lib/api';
import { Metadata } from 'next';
import Link from 'next/link';
import { CategoryTabs } from '@/components/public/category-tabs';
import { notFound } from 'next/navigation';

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
    categorySlug: string;
  }>;
}

async function getSiteSettings(siteSlug: string): Promise<SiteSettings | null> {
  try {
    return await fetchSiteSettings(siteSlug);
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
    return null;
  }
}

async function getCategories(siteSlug: string): Promise<PublicCategory[]> {
  try {
    return await fetchPublicCategories(siteSlug);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

async function getPosts(siteSlug: string, categorySlug: string): Promise<PublicPost[]> {
  try {
    return await fetchPublicPosts(siteSlug, categorySlug);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params;
  const [settings, categories] = await Promise.all([
    getSiteSettings(slug),
    getCategories(slug),
  ]);

  const category = categories.find((c) => c.slug === categorySlug);
  const siteName = settings?.name || slug;
  const categoryName = category?.name || categorySlug;

  const title = `${categoryName} - ${siteName}`;
  const description = category?.description || `${siteName}의 ${categoryName} 카테고리 게시글입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: settings?.og_image_url ? [settings.og_image_url] : undefined,
    },
  };
}

function PostCard({ post, siteSlug }: { post: PublicPost; siteSlug: string }) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {post.og_image_url && (
        <div className="aspect-video bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.og_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5">
        <Link href={`/t/${siteSlug}/posts/${post.slug}`}>
          <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
            {post.title}
          </h2>
        </Link>
        {post.seo_description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {post.seo_description}
          </p>
        )}
        <time className="text-xs text-gray-400">
          {new Date(post.published_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>
    </article>
  );
}

export default async function CategoryPostsPage({ params }: PageProps) {
  const { slug, categorySlug } = await params;
  const [posts, categories, settings] = await Promise.all([
    getPosts(slug, categorySlug),
    getCategories(slug),
    getSiteSettings(slug),
  ]);

  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) {
    notFound();
  }

  const siteName = settings?.name || slug;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            {settings?.logo_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_image_url}
                alt={siteName}
                className="h-12 w-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{siteName}</h1>
              <p className="text-gray-500 mt-1">{slug}.pagelet-dev.kr</p>
            </div>
          </div>
        </div>
      </header>

      {/* 카테고리 탭 */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <CategoryTabs categories={categories} siteSlug={slug} />
          </div>
        </div>
      )}

      {/* 카테고리 정보 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.name}</h2>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1">
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} siteSlug={slug} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              {category.name} 카테고리에 게시글이 없습니다
            </h2>
            <p className="text-gray-400">
              곧 새로운 글이 올라올 예정입니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
