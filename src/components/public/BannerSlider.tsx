'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicBanner } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BannerSliderProps {
  banners: PublicBanner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function BannerSlider({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000,
}: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 자동 슬라이드
  useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, banners.length, goToNext]);

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full overflow-hidden">
      {/* 배너 이미지 */}
      <div className="relative aspect-[4/1] md:aspect-[6/1]">
        {currentBanner.linkUrl ? (
          <a
            href={currentBanner.linkUrl}
            target={currentBanner.openInNewTab ? '_blank' : '_self'}
            rel="noopener noreferrer nofollow"
            className="block w-full h-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.altText || '배너'}
              className="w-full h-full object-cover"
            />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.altText || '배너'}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* 네비게이션 버튼 (배너가 2개 이상일 때만) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2',
              'p-2 rounded-full bg-black/30 text-white',
              'hover:bg-black/50 transition-colors',
              'hidden sm:flex items-center justify-center',
            )}
            aria-label="이전 배너"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-2 rounded-full bg-black/30 text-white',
              'hover:bg-black/50 transition-colors',
              'hidden sm:flex items-center justify-center',
            )}
            aria-label="다음 배너"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* 인디케이터 도트 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/75',
                )}
                aria-label={`배너 ${index + 1}번으로 이동`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
