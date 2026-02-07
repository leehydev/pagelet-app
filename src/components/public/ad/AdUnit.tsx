'use client';

import { useEffect, useRef } from 'react';
import type { AdProvider } from '@/lib/api/types';
import { cn } from '@/lib/utils';

type AdFormat = 'mobile-banner' | 'sidebar';

interface AdUnitProps {
  provider: AdProvider;
  slotId: string;
  format: AdFormat;
  className?: string;
}

const AD_SIZES: Record<AdFormat, { width: number; height: number }> = {
  'mobile-banner': { width: 320, height: 100 },
  sidebar: { width: 160, height: 600 },
};

/**
 * 광고 단위 컴포넌트
 * AdSense 또는 AdFit 광고를 렌더링
 */
export function AdUnit({ provider, slotId, format, className }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);
  const size = AD_SIZES[format];

  useEffect(() => {
    if (isInitialized.current) return;

    const initAd = () => {
      if (provider === 'adsense') {
        try {
          const adsbygoogle = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle;
          if (adsbygoogle) {
            adsbygoogle.push({});
            isInitialized.current = true;
          }
        } catch {
          // AdSense 초기화 실패 시 무시
        }
      } else if (provider === 'adfit') {
        try {
          const kakaoAdFit = (window as Window & { kakaoAdFit?: { display: (id: string) => void } })
            .kakaoAdFit;
          if (kakaoAdFit && adRef.current) {
            kakaoAdFit.display(slotId);
            isInitialized.current = true;
          }
        } catch {
          // AdFit 초기화 실패 시 무시
        }
      }
    };

    // 스크립트 로드 후 초기화
    const timer = setTimeout(initAd, 100);
    return () => clearTimeout(timer);
  }, [provider, slotId]);

  if (provider === 'adsense') {
    // AdSense: slotId에서 publisherId와 adSlot 분리 (형식: ca-pub-xxx/slot-id)
    const [publisherId, adSlot] = slotId.includes('/') ? slotId.split('/') : ['', slotId];

    return (
      <div className={cn('flex items-center justify-center', className)}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{
            display: 'block',
            width: size.width,
            height: size.height,
          }}
          data-ad-client={publisherId}
          data-ad-slot={adSlot}
          data-ad-format={format === 'sidebar' ? 'vertical' : 'horizontal'}
          data-full-width-responsive={format === 'mobile-banner' ? 'true' : 'false'}
        />
      </div>
    );
  }

  if (provider === 'adfit') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <ins
          ref={adRef}
          className="kakao_ad_area"
          style={{ display: 'none' }}
          data-ad-unit={slotId}
          data-ad-width={size.width}
          data-ad-height={size.height}
        />
      </div>
    );
  }

  return null;
}
