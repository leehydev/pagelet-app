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
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="w-full shrink-0 h-72">
              <PostBannerCard banner={banner} siteSlug={siteSlug} />
            </div>
          ))}
        </div>
      </div>

      {/* 인디케이터 도트 */}
      <div className="flex justify-center gap-2 mt-4">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentIndex ? 'bg-gray-800 w-6' : 'bg-gray-300 hover:bg-gray-400',
            )}
            aria-label={`배너 ${index + 1}번으로 이동`}
          />
        ))}
      </div>
    </div>
  );
}
