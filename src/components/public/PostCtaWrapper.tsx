'use client';

import type { SiteSettings } from '@/lib/api';
import { useAnalytics } from '@/hooks/use-analytics';
import { CtaBanner } from './CtaBanner';

interface PostCtaWrapperProps {
  settings: SiteSettings;
  postId: string;
}

/**
 * 게시글 상세 페이지용 CTA 래퍼
 * postId를 포함하여 페이지뷰 및 CTA 클릭을 추적합니다.
 */
export function PostCtaWrapper({ settings, postId }: PostCtaWrapperProps) {
  // postId를 포함한 페이지뷰 추적
  useAnalytics({
    siteId: settings.id,
    postId,
    autoTrackPageview: true,
  });

  return <CtaBanner settings={settings} postId={postId} />;
}
