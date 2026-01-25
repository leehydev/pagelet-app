'use client';

import { useEffect, useRef } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

interface PostContentProps {
  html: string | null;
  className?: string;
}

/**
 * Tiptap HTML 본문 렌더링 컴포넌트
 * - XSS 방지를 위해 DOMPurify로 sanitize 적용
 * - Tailwind Typography (prose) 스타일 적용
 * - 카카오맵 임베드 지원 (iframe 방식)
 */
export function PostContent({ html, className = '' }: PostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 카카오맵 초기화 (iframe 방식으로 변환)
  useEffect(() => {
    if (!containerRef.current || !html) return;

    // data-kakao-map 요소 찾기
    const kakaoMapElements = containerRef.current.querySelectorAll('[data-kakao-map]');
    if (kakaoMapElements.length === 0) return;

    kakaoMapElements.forEach((element) => {
      const timestamp = element.getAttribute('data-timestamp');
      const key = element.getAttribute('data-key');
      const mapWidth = element.getAttribute('data-map-width') || '640';
      const mapHeight = element.getAttribute('data-map-height') || '360';

      if (timestamp && key) {
        // 이미 초기화된 경우 스킵
        if (element.hasAttribute('data-initialized')) return;

        element.setAttribute('data-initialized', 'true');
        element.className = 'my-4';

        // iframe으로 교체
        const iframe = document.createElement('iframe');
        iframe.src = `/kakaomap.html?timestamp=${timestamp}&key=${key}&width=${mapWidth}&height=${mapHeight}`;
        iframe.width = mapWidth;
        iframe.height = mapHeight;
        iframe.style.border = '0';
        iframe.style.maxWidth = '100%';
        iframe.style.display = 'block';
        iframe.title = '카카오맵';

        element.innerHTML = '';
        element.appendChild(iframe);
      }
    });
  }, [html]);

  if (!html) {
    return <div className="text-gray-400 text-center py-8">본문 내용이 없습니다.</div>;
  }

  const sanitizedHtml = sanitizeHtml(html);

  return (
    <article
      ref={containerRef}
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
