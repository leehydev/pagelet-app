'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PublicBanner } from '@/lib/api';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface PostBannerCardProps {
  banner: PublicBanner;
  siteSlug: string;
  className?: string;
}

export function PostBannerCard({ banner, siteSlug, className }: PostBannerCardProps) {
  const post = banner.post;

  return (
    <Link
      href={`/t/${siteSlug}/posts/${post.slug}`}
      className={cn(
        'group block bg-white rounded-lg overflow-hidden',
        'border border-gray-200 shadow-sm',
        'hover:shadow-md hover:border-gray-300 transition-all duration-200',
        className,
      )}
    >
      {/* 가로형 레이아웃 (데스크톱) / 세로형 레이아웃 (모바일) */}
      <div className="flex flex-col md:flex-row">
        {/* 텍스트 영역 */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-center order-2 md:order-1">
          {/* 카테고리 */}
          {post.categoryName && (
            <Badge variant="secondary" className="w-fit mb-3 text-xs">
              {post.categoryName}
            </Badge>
          )}

          {/* 제목 */}
          <h3 className="font-bold text-xl md:text-2xl text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>

          {/* 소제목 */}
          {post.subtitle && (
            <p className="text-gray-600 line-clamp-2 mb-4 text-sm md:text-base">{post.subtitle}</p>
          )}

          {/* 작성일 */}
          {post.publishedAt && (
            <p className="text-gray-400 text-sm">{dayjs(post.publishedAt).format('YYYY.MM.DD')}</p>
          )}
        </div>

        {/* 이미지 영역 */}
        <div className="md:w-[40%] shrink-0 order-1 md:order-2">
          {post.ogImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.ogImageUrl}
              alt={post.title}
              className="w-full h-48 md:h-full object-cover aspect-video md:aspect-auto"
            />
          ) : (
            <div className="w-full h-48 md:h-full bg-gray-100 flex items-center justify-center aspect-video md:aspect-auto min-h-[200px]">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
