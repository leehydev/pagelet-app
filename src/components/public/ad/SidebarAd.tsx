'use client';

import type { AdProvider } from '@/lib/api/types';
import { AdUnit } from './AdUnit';

interface SidebarAdProps {
  provider: AdProvider;
  slotId: string;
}

/**
 * PC 사이드바 광고
 * md 이상에서만 노출, sticky
 */
export function SidebarAd({ provider, slotId }: SidebarAdProps) {
  return (
    <aside className="hidden md:block w-[160px] shrink-0">
      <div className="sticky top-24">
        <AdUnit provider={provider} slotId={slotId} format="sidebar" />
      </div>
    </aside>
  );
}
