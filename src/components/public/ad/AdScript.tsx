'use client';

import Script from 'next/script';
import type { AdProvider } from '@/lib/api/types';

interface AdScriptProps {
  provider: AdProvider;
  publisherId?: string;
}

/**
 * 광고 스크립트 로더
 * AdSense 또는 AdFit 스크립트를 한 번만 로드
 */
export function AdScript({ provider, publisherId }: AdScriptProps) {
  if (provider === 'adsense') {
    return (
      <Script
        id="adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
    );
  }

  if (provider === 'adfit') {
    return (
      <Script
        id="adfit-script"
        async
        src="https://t1.daumcdn.net/kas/static/ba.min.js"
        strategy="lazyOnload"
      />
    );
  }

  return null;
}
