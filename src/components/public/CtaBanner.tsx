'use client';

import { useCallback } from 'react';
import type { SiteSettings } from '@/lib/api';
import { useAnalytics } from '@/hooks/use-analytics';

interface CtaBannerProps {
  settings: SiteSettings;
  postId?: string;
}

/**
 * CTA 배너 컴포넌트
 * 블로그 페이지 푸터 위에 고정 표시됩니다.
 *
 * - 텍스트 타입: 버튼 형태로 표시
 * - 이미지 타입: 배너 이미지로 표시
 * - 클릭 시 추적 API 호출 후 링크로 이동
 */
export function CtaBanner({ settings, postId }: CtaBannerProps) {
  const { trackCtaClick } = useAnalytics({
    siteId: settings.id,
    postId,
    autoTrackPageview: false, // 페이지뷰는 CtaTracker에서 처리
  });

  const handleClick = useCallback(async () => {
    if (!settings.ctaLink) return;

    // 추적 API 호출 (실패해도 링크 이동은 진행)
    await trackCtaClick();

    // 새 탭에서 링크 열기
    window.open(settings.ctaLink, '_blank', 'noopener,noreferrer');
  }, [settings.ctaLink, trackCtaClick]);

  // CTA가 비활성화되어 있거나 필수 정보가 없으면 렌더링하지 않음
  if (!settings.ctaEnabled || !settings.ctaLink) {
    return null;
  }

  // 타입에 따라 텍스트 또는 이미지 표시
  const isImageType = settings.ctaType === 'image' && settings.ctaImageUrl;

  if (isImageType) {
    return (
      <div className="sticky bottom-0 w-full z-40 py-6">
        <div className="max-w-7xl mx-auto">
          <button onClick={handleClick} className="w-full cursor-pointer" aria-label="CTA 배너">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.ctaImageUrl!}
              alt={settings.ctaText || 'CTA 배너'}
              className="w-full h-auto object-contain max-h-14"
            />
          </button>
        </div>
      </div>
    );
  }

  // 텍스트 타입 (기본)
  if (!settings.ctaText) {
    return null;
  }

  return (
    <div className="sticky bottom-0 w-full z-40 py-6">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-center">
        <button
          type="button"
          onClick={handleClick}
          className="w-full py-3 px-6 max-w-80 h-14 bg-primary text-white text-xl font-semibold rounded-lg"
        >
          {settings.ctaText}
        </button>
      </div>
    </div>
  );
}
