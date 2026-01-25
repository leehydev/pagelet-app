import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML 문자열을 sanitize하여 XSS 공격 방지
 * isomorphic-dompurify로 서버/클라이언트 동일하게 처리
 */
export function sanitizeHtml(dirty: string): string {
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
