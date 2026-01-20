'use client';

import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
}

/**
 * 썸네일 이미지 컴포넌트
 * 이미지 로드 실패 시 fallback 표시
 */
export function Thumbnail({
  src,
  alt = 'Thumbnail',
  className,
  fallbackClassName,
  aspectRatio = '16/9',
}: ThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const aspectRatioClass = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
  }[aspectRatio];

  // 이미지가 없거나 에러 발생 시 fallback 표시
  if (!src || imageError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md',
          aspectRatioClass,
          className,
          fallbackClassName,
        )}
      >
        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-md', aspectRatioClass, className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-200',
          imageLoading ? 'opacity-0' : 'opacity-100',
        )}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
      />
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
          <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
        </div>
      )}
    </div>
  );
}
