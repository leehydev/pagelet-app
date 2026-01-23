'use client';

import { useAnalytics } from '@/hooks/use-analytics';

interface CtaTrackerProps {
  siteId: string;
  postId?: string;
}

/**
 * 페이지뷰 추적 컴포넌트
 * 렌더링 시 자동으로 페이지뷰를 추적합니다.
 * UI를 렌더링하지 않습니다.
 */
export function CtaTracker({ siteId, postId }: CtaTrackerProps) {
  useAnalytics({
    siteId,
    postId,
    autoTrackPageview: true,
  });

  return null;
}
