import { CategoryTabs } from '@/components/public/CategoryTabs';
import type { PublicCategory, SiteSettings } from '@/lib/api';
import { fetchPublicCategories, fetchSiteSettings } from '@/lib/api/server';
import { notFound } from 'next/navigation';
import { SocialLinks } from '@/components/public/SocialLinks';
import { CtaBanner } from '@/components/public/CtaBanner';
import { CtaTracker } from '@/components/public/CtaTracker';
import Link from 'next/link';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-base',
  display: 'swap',
});

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-base',
  display: 'swap',
});

function getFontClass(fontKey?: string | null) {
  switch (fontKey) {
    case 'noto_serif':
      return notoSerif.variable;
    case 'noto_sans':
    default:
      return notoSans.variable;
  }
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

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [settings, categories] = await Promise.all([getSiteSettings(slug), getCategories(slug)]);
  const siteName = settings.name;
  const fontClass = getFontClass(settings.fontKey);

  return (
    <div className={`flex-1 ${fontClass}`} style={{ fontFamily: 'var(--font-base)' }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-20 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 max-w-[40vw] overflow-hidden">
            <Link href="/">
              {settings.logoImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoImageUrl}
                  alt={siteName}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <h1
                  className={`break-all font-bold text-gray-900`}
                  style={{
                    fontSize:
                      siteName.length > 16
                        ? '1rem'
                        : siteName.length > 8
                          ? '1.25rem'
                          : siteName.length > 4
                            ? '1.5rem'
                            : '1.75rem',
                    lineHeight: 1.2,
                  }}
                >
                  {siteName}
                </h1>
              )}
            </Link>
          </div>
          {/* 검색 기능은 나중에 추가 가능 */}
        </div>
      </header>

      {/* 카테고리 탭 */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <CategoryTabs categories={categories} siteSlug={slug} />
          </div>
        </div>
      )}

      {/* 페이지 콘텐츠 */}
      <div className="flex-1">{children}</div>

      {/* CTA 배너 */}
      <CtaBanner settings={settings} />

      {/* 페이지뷰 추적 */}
      <CtaTracker siteId={settings.id} />

      {/* 푸터 */}
      <footer className="border-t  border-gray-200 bg-primary text-gray-500 font-semibold mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* 왼쪽: 사업자 정보 */}
            <div className="flex-1 space-y-1">
              <p>
                {settings.businessName} {settings.representativeName}
              </p>
              {settings.businessNumber && <p>사업자등록번호: {settings.businessNumber}</p>}
              {settings.address && <p>{settings.address}</p>}
            </div>

            {/* 오른쪽: 연락처 및 소셜 */}
            <div className="flex-1 flex flex-col items-start gap-3">
              <div className="space-y-1 text-left">
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
              </div>
              <SocialLinks settings={settings} />
            </div>
          </div>

          {/* Powered by */}
          <div className="text-center text-sm text-gray-400 mt-8 pt-4 border-t border-gray-100">
            <Link href={'https://' + process.env.NEXT_PUBLIC_TENANT_DOMAIN!}>
              Powered by Pagelet
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
