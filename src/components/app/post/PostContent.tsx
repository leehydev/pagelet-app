'use client';

import { sanitizeHtml } from '@/lib/sanitize';

interface PostContentProps {
  html: string | null;
  className?: string;
}

/**
 * Tiptap HTML 본문 렌더링 컴포넌트
 * - XSS 방지를 위해 DOMPurify로 sanitize 적용
 * - Tailwind Typography (prose) 스타일 적용
 */
export function PostContent({ html, className = '' }: PostContentProps) {
  if (!html) {
    return <div className="text-gray-400 text-center py-8">본문 내용이 없습니다.</div>;
  }

  const sanitizedHtml = sanitizeHtml(html);

  return (
    <article
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
