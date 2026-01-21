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
      images: settings?.ogImageUrl ? [settings.ogImageUrl] : undefined,
    },
  };
}

function PostCard({ post, siteSlug }: { post: PublicPost; siteSlug: string }) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <Link href={`/t/${siteSlug}/posts/${post.slug}`}>
      <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
        {/* 썸네일 이미지 */}
        <div className="aspect-video bg-gray-200 relative overflow-hidden rounded-t-lg">
          {post.ogImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.ogImageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>

          {/* 부제목 */}
          <h3 className="text-base text-gray-600 mb-2 line-clamp-1">
            {post.subtitle}
          </h3>

          {/* 설명/요약 */}
          {post.seoDescription && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-4 flex-1">
              {post.seoDescription}
            </p>
          )}

          {/* 작성일 */}
          <time className="text-xs text-gray-400 mt-auto">
            {formattedDate}
          </time>
        </div>
      </article>
    </Link>
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {settings?.logoImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoImageUrl}
                  alt={siteName}
                  className="h-10 w-auto object-contain"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{siteName}</h1>
            </div>
            {/* 검색 기능은 나중에 추가 가능 */}
          </div>
        </div>
      </header>

      {/* 카테고리 탭 */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <CategoryTabs categories={categories} siteSlug={slug} />
          </div>
        </div>
      )}

      {/* 카테고리 정보 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              CATEGORY
            </span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">{category.name}</h2>
          {category.description && (
            <p className="text-gray-600 text-lg max-w-3xl">{category.description}</p>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1">
        {posts.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {settings && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <ContactInfo settings={settings} />
                <SocialLinks settings={settings} />
              </div>
              <BusinessInfo settings={settings} />
            </>
          )}
          <div className="text-center text-sm text-gray-500 pt-2">Powered by Pagelet</div>
        </div>
      </footer>
    </div>
  );
}

// 소셜 링크 아이콘 컴포넌트
function SocialLinks({ settings }: { settings: SiteSettings }) {
  const links = [
    { url: settings.kakaoChannelUrl, label: '카카오 채널', icon: '💬' },
    { url: settings.naverMapUrl, label: '네이버 지도', icon: '📍' },
    { url: settings.instagramUrl, label: '인스타그램', icon: '📷' },
  ].filter((link) => link.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title={link.label}
        >
          <span className="text-xl">{link.icon}</span>
        </a>
      ))}
    </div>
  );
}

// 연락처 정보 컴포넌트
function ContactInfo({ settings }: { settings: SiteSettings }) {
  const hasContact = settings.contactEmail || settings.contactPhone || settings.address;
  if (!hasContact) return null;

  return (
    <div className="text-sm text-gray-500 space-y-1">
      {settings.contactEmail && (
        <p>
          <a href={`mailto:${settings.contactEmail}`} className="hover:text-gray-700">
            {settings.contactEmail}
          </a>
        </p>
      )}
      {settings.contactPhone && (
        <p>
          <a href={`tel:${settings.contactPhone}`} className="hover:text-gray-700">
            {settings.contactPhone}
          </a>
        </p>
      )}
      {settings.address && <p>{settings.address}</p>}
    </div>
  );
}

// 사업자 정보 컴포넌트
function BusinessInfo({ settings }: { settings: SiteSettings }) {
  const hasBusinessInfo =
    settings.businessName || settings.businessNumber || settings.representativeName;
  if (!hasBusinessInfo) return null;

  return (
    <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {settings.businessName && <span>상호: {settings.businessName}</span>}
        {settings.representativeName && <span>대표: {settings.representativeName}</span>}
        {settings.businessNumber && <span>사업자등록번호: {settings.businessNumber}</span>}
      </div>
    </div>
  );
}
