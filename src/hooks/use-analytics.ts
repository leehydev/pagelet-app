'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getOrCreateVisitorId } from '@/lib/visitor';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface UseAnalyticsOptions {
  siteId: string;
  postId?: string;
  /** 페이지 로드 시 자동으로 페이지뷰를 추적할지 여부 (기본값: true) */
  autoTrackPageview?: boolean;
}

interface TrackingResponse {
  tracked: boolean;
}

/**
 * 페이지뷰 및 CTA 클릭 추적 훅
 *
 * @example
 * ```tsx
 * const { trackCtaClick } = useAnalytics({
 *   siteId: settings.id,
 *   postId: post?.id,
 * });
 *
 * const handleCtaClick = async () => {
 *   await trackCtaClick();
 *   window.open(link, '_blank');
 * };
 * ```
 */
export function useAnalytics({ siteId, postId, autoTrackPageview = true }: UseAnalyticsOptions) {
  const hasTrackedPageview = useRef(false);

  /**
   * 페이지뷰 추적
   */
  const trackPageview = useCallback(async (): Promise<boolean> => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/public/analytics/pageview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          ...(postId && { postId }),
          visitorId,
        }),
      });

      if (!response.ok) {
        console.warn('페이지뷰 추적 실패:', response.status);
        return false;
      }

      const data: TrackingResponse = await response.json();
      return data.tracked;
    } catch (error) {
      // 추적 실패는 사용자 경험에 영향을 주지 않아야 함
      console.warn('페이지뷰 추적 에러:', error);
      return false;
    }
  }, [siteId, postId]);

  /**
   * CTA 클릭 추적
   */
  const trackCtaClick = useCallback(async (): Promise<boolean> => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/public/analytics/cta-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          ...(postId && { postId }),
          visitorId,
        }),
      });

      if (!response.ok) {
        console.warn('CTA 클릭 추적 실패:', response.status);
        return false;
      }

      const data: TrackingResponse = await response.json();
      return data.tracked;
    } catch (error) {
      // 추적 실패는 사용자 경험에 영향을 주지 않아야 함
      console.warn('CTA 클릭 추적 에러:', error);
      return false;
    }
  }, [siteId, postId]);

  // 페이지 로드 시 자동 페이지뷰 추적
  useEffect(() => {
    if (autoTrackPageview && !hasTrackedPageview.current) {
      hasTrackedPageview.current = true;
      trackPageview();
    }
  }, [autoTrackPageview, trackPageview]);

  return {
    trackPageview,
    trackCtaClick,
  };
}
