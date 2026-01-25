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
 * - 카카오맵 임베드 지원
 */
export function PostContent({ html, className = '' }: PostContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 카카오맵 초기화 (스크립트는 layout에서 beforeInteractive로 로드됨)
  useEffect(() => {
    if (!containerRef.current || !html) return;

    // data-kakao-map 요소 찾기
    const kakaoMapElements = containerRef.current.querySelectorAll('[data-kakao-map]');
    if (kakaoMapElements.length === 0) return;

    const daum = (window as unknown as { daum?: { roughmap?: { Lander?: unknown } } }).daum;
    if (!daum?.roughmap?.Lander) return;

    // Lander 생성자 타입 정의
    const LanderClass = daum.roughmap.Lander as new (options: {
      timestamp: string;
      key: string;
      mapWidth: string;
      mapHeight: string;
    }) => { render: () => void };

    kakaoMapElements.forEach((element) => {
      const timestamp = element.getAttribute('data-timestamp');
      const key = element.getAttribute('data-key');
      const mapWidth = element.getAttribute('data-map-width') || '640';
      const mapHeight = element.getAttribute('data-map-height') || '360';

      if (timestamp && key) {
        // 이미 초기화된 경우 스킵
        if (element.hasAttribute('data-initialized')) return;

        // 실제 지도 컨테이너 ID 생성
        const containerId = `daumRoughmapContainer${timestamp}`;
        element.id = containerId;
        element.className = 'root_daum_roughmap root_daum_roughmap_landing my-4';
        element.setAttribute('data-initialized', 'true');

        // 지도 초기화
        new LanderClass({
          timestamp,
          key,
          mapWidth,
          mapHeight,
        }).render();
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
