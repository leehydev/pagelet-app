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

// ISR: 60초마다 재검증
export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getSiteSettings(slug: string): Promise<SiteSettings | null> {
  try {
    return await fetchSiteSettings(slug);
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getSiteSettings(slug);

  // 환경에 따른 robots 설정
  const isProd = process.env.NODE_ENV === 'production';
  const allowIndex = isProd && settings?.robots_index;

  const title = settings?.seo_title || settings?.name || `${slug} 블로그`;
  const description = settings?.seo_description || `${slug}의 블로그입니다.`;

  return {
    title,
    description,
    keywords: settings?.seo_keywords || undefined,
    robots: allowIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: settings?.og_image_url ? [settings.og_image_url] : undefined,
    },
    ...(settings?.canonical_base_url && {
      alternates: {
        canonical: `${settings.canonical_base_url}`,
      },
    }),
    icons: settings?.favicon_url ? { icon: settings.favicon_url } : undefined,
  };
}

async function getPosts(siteSlug: string, categorySlug?: string): Promise<PublicPost[]> {
  try {
    return await fetchPublicPosts(siteSlug, categorySlug);
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return [];
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

// 소셜 링크 아이콘 컴포넌트
function SocialLinks({ settings }: { settings: SiteSettings }) {
  const links = [
    { url: settings.kakao_channel_url, label: '카카오 채널', icon: '💬' },
    { url: settings.naver_map_url, label: '네이버 지도', icon: '📍' },
    { url: settings.instagram_url, label: '인스타그램', icon: '📷' },
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
  const hasContact = settings.contact_email || settings.contact_phone || settings.address;
  if (!hasContact) return null;

  return (
    <div className="text-sm text-gray-500 space-y-1">
      {settings.contact_email && (
        <p>
          <a href={`mailto:${settings.contact_email}`} className="hover:text-gray-700">
            {settings.contact_email}
          </a>
        </p>
      )}
      {settings.contact_phone && (
        <p>
          <a href={`tel:${settings.contact_phone}`} className="hover:text-gray-700">
            {settings.contact_phone}
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
    settings.business_name || settings.business_number || settings.representative_name;
  if (!hasBusinessInfo) return null;

  return (
    <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {settings.business_name && <span>상호: {settings.business_name}</span>}
        {settings.representative_name && <span>대표: {settings.representative_name}</span>}
        {settings.business_number && <span>사업자등록번호: {settings.business_number}</span>}
      </div>
    </div>
  );
}

function PostCard({ post, siteSlug }: { post: PublicPost; siteSlug: string }) {
  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {post.og_image_url && (
        <div className="aspect-video bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.og_image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-5">
        <Link href={`/t/${siteSlug}/posts/${post.slug}`}>
          <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
            {post.title}
          </h2>
        </Link>
        {post.seo_description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.seo_description}</p>
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

export default async function TenantHomePage({ params }: PageProps) {
  const { slug } = await params;
  const [posts, categories, settings] = await Promise.all([
    getPosts(slug),
    getCategories(slug),
    getSiteSettings(slug),
  ]);

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
            <h2 className="text-xl font-medium text-gray-600 mb-2">아직 게시글이 없습니다</h2>
            <p className="text-gray-400">곧 새로운 글이 올라올 예정입니다.</p>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
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
