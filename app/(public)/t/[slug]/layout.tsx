import type { Metadata } from 'next';
import type { PublicCategory, SiteSettings } from '@/lib/api';
import { fetchPublicCategories, fetchSiteSettings } from '@/lib/api/server';
import { notFound } from 'next/navigation';
import { CtaBanner } from '@/components/public/CtaBanner';
import { CtaTracker } from '@/components/public/CtaTracker';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { Header } from '@/components/public/layout/Header';
import { Footer } from '@/components/public/layout/Footer';

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

  return (
    <div className={`flex-1 ${fontClass} flex flex-col`} style={{ fontFamily: 'var(--font-base)' }}>
      {/* 헤더 */}
      <Header
        logoImageUrl={settings.logoImageUrl || ''}
        siteName={settings.name}
        categories={categories}
        siteSlug={slug}
      />

      {/* 페이지 콘텐츠 */}
      <div className="flex-1 bg-[#f6f7f8]">{children}</div>

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
