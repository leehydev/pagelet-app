'use client';

import DOMPurify from 'dompurify';

/**
 * HTML 문자열을 sanitize하여 XSS 공격 방지
 * DOMPurify 기본 설정 사용 (안전한 태그/속성만 허용)
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // SSR 환경에서는 sanitize 없이 반환 (클라이언트에서 처리)
    return dirty;
  }

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['iframe'], // YouTube embed 허용
    ADD_ATTR: [
      'allow',
      'allowfullscreen',
      'frameborder',
      'scrolling',
      // 카카오맵 속성 허용
      'data-kakao-map',
      'data-timestamp',
      'data-key',
      'data-map-width',
      'data-map-height',
    ],
  });
}
