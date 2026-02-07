import type { Metadata } from 'next';
import type { PublicCategory, SiteSettings } from '@/lib/api';
import { fetchPublicCategories, fetchSiteSettings } from '@/lib/api/server';
import { notFound } from 'next/navigation';
import { CtaBanner } from '@/components/public/CtaBanner';
import { CtaTracker } from '@/components/public/CtaTracker';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { Header } from '@/components/public/layout/Header';
import { Footer } from '@/components/public/layout/Footer';
import { AdScript, MobileHeaderAd, SidebarAd } from '@/components/public/ad';

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

// 네이버 사이트 인증 키 적용 (어드민 설정 UI는 TODO)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSiteSettings(slug);

  return {
    icons: {
      icon: settings.faviconUrl || '/images/favicon.ico',
    },
    verification: settings.naverSearchAdvisorKey
      ? {
          other: {
            'naver-site-verification': settings.naverSearchAdvisorKey,
          },
        }
      : undefined,
  };
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
  const fontClass = getFontClass(settings.fontKey);

  // 광고 설정
  const hasAds = settings.adProvider !== null;
  const hasMobileAd = hasAds && settings.adMobileHeader !== null;
  const hasSidebarAd = hasAds && settings.adPcSidebar !== null;

  // AdSense publisherId 추출 (adMobileHeader 또는 adPcSidebar에서)
  const getPublisherId = () => {
    const slotId = settings.adMobileHeader || settings.adPcSidebar;
    if (slotId && slotId.includes('/')) {
      return slotId.split('/')[0];
    }
    return undefined;
  };

  return (
    <div className={`flex-1 ${fontClass} flex flex-col`} style={{ fontFamily: 'var(--font-base)' }}>
      {/* 광고 스크립트 로드 */}
      {hasAds && <AdScript provider={settings.adProvider!} publisherId={getPublisherId()} />}

      {/* 헤더 */}
      <Header
        logoImageUrl={settings.logoImageUrl || ''}
        siteName={settings.name}
        categories={categories}
        siteSlug={slug}
      />

      {/* 모바일 헤더 아래 광고 */}
      {hasMobileAd && (
        <MobileHeaderAd provider={settings.adProvider!} slotId={settings.adMobileHeader!} />
      )}

      {/* 페이지 콘텐츠 + 사이드바 광고 */}
      <div className="flex-1 bg-[#f6f7f8]">
        <div className={hasSidebarAd ? 'flex gap-4 max-w-7xl mx-auto' : ''}>
          <div className="flex-1">{children}</div>
          {hasSidebarAd && (
            <SidebarAd provider={settings.adProvider!} slotId={settings.adPcSidebar!} />
          )}
        </div>
      </div>

      {/* CTA 배너 */}
      <CtaBanner settings={settings} />

      {/* 페이지뷰 추적 */}
      <CtaTracker siteId={settings.id} />

      <Footer
        logoImageUrl={settings.logoImageUrl || ''}
        siteSlug={slug}
        siteName={settings.name}
        categories={categories}
        settings={settings}
      />
    </div>
  );
}
