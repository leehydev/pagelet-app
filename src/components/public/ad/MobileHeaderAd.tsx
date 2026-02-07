'use client';

import type { AdProvider } from '@/lib/api/types';
import { AdUnit } from './AdUnit';

interface MobileHeaderAdProps {
  provider: AdProvider;
  slotId: string;
}

/**
 * 모바일 헤더 아래 광고
 * md 이하에서만 노출
 */
export function MobileHeaderAd({ provider, slotId }: MobileHeaderAdProps) {
  return (
    <div className="md:hidden bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <AdUnit provider={provider} slotId={slotId} format="mobile-banner" />
      </div>
    </div>
  );
}
