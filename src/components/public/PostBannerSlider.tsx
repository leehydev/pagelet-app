'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PublicBanner } from '@/lib/api';
import { PostBannerCard } from './PostBannerCard';
import { cn } from '@/lib/utils';

interface PostBannerSliderProps {
  banners: PublicBanner[];
  siteSlug: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function PostBannerSlider({
  banners,
  siteSlug,
  autoPlay = true,
  autoPlayInterval = 5000,
}: PostBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
    if (!autoPlay || banners.length <= 1 || isPaused) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, banners.length, goToNext, isPaused]);

  if (banners.length === 0) {
    return null;
  }

  // 배너가 1개일 때는 슬라이더 없이 단일 카드 표시
  if (banners.length === 1) {
    return (
      <div className="w-full">
        <PostBannerCard banner={banners[0]} siteSlug={siteSlug} />
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 슬라이더 컨테이너 */}
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="w-full shrink-0">
              <PostBannerCard banner={banner} siteSlug={siteSlug} />
            </div>
          ))}
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <button
        onClick={goToPrev}
        className={cn(
          'absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10',
          'p-2 md:p-3 rounded-full bg-white/90 shadow-md',
          'hover:bg-white transition-colors',
          'hidden sm:flex items-center justify-center',
        )}
        aria-label="이전 배너"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
      </button>
      <button
        onClick={goToNext}
        className={cn(
          'absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10',
          'p-2 md:p-3 rounded-full bg-white/90 shadow-md',
          'hover:bg-white transition-colors',
          'hidden sm:flex items-center justify-center',
        )}
        aria-label="다음 배너"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-700" />
      </button>

      {/* 인디케이터 도트 */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex
                ? 'bg-gray-800 w-6'
                : 'bg-gray-300 hover:bg-gray-400',
            )}
            aria-label={`배너 ${index + 1}번으로 이동`}
          />
        ))}
      </div>
    </div>
  );
}
