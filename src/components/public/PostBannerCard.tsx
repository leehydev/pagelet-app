'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { PublicBanner } from '@/lib/api';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import Image from 'next/image';
import { Button } from '../ui/button';

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
      className={cn('group block bg-white rounded-sm overflow-hidden h-96 md:h-72', className)}
    >
      {/* 가로형 레이아웃 (데스크톱) / 세로형 레이아웃 (모바일) */}
      {post.ogImageUrl ? (
        <div className="flex flex-col md:flex-row h-full">
          {/* 이미지 영역 */}
          {post.ogImageUrl && (
            <div className="md:w-[40%] shrink-0 order-1">
              <Image
                src={post.ogImageUrl}
                alt={post.title}
                width={1200}
                height={630}
                className="w-full h-48 md:h-full object-cover aspect-video rounded-lg md:rounded-tl-sm md:rounded-sm"
              />
            </div>
          )}

          {/* 텍스트 영역 */}
          <div className="flex-1 p-5 md:py-6 md:pl-16 flex flex-col justify-center order-2">
            <div className="flex gap-2">
              {/* 카테고리 */}
              {post.categoryName && (
                <Badge variant="secondary" className="w-fit mb-2 text-xs">
                  {post.categoryName}
                </Badge>
              )}
              {/* 작성일 */}
              {post.publishedAt && (
                <span className="text-gray-400 text-sm">
                  {dayjs(post.publishedAt).format('YYYY.MM.DD')}
                </span>
              )}
            </div>

            {/* 제목 */}
            <h3 className="font-bold text-xl break-keep md:text-4xl text-gray-900 line-clamp-2">
              {post.title}
            </h3>

            {/* 소제목 */}
            {post.subtitle && (
              <p className="text-gray-400 line-clamp-2 font-semibold text-sm md:text-base">
                {post.subtitle}
              </p>
            )}

            <div className="hidden md:block mt-4">
              <Button>
                <span>게시글 보기</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center flex flex-col justify-center h-full gap-1">
          {/* 카테고리 */}
          <div className="mb-1">
            {post.categoryName && (
              <Badge variant="secondary" className="w-fit mx-auto text-xs">
                {post.categoryName}
              </Badge>
            )}
          </div>

          <h1 className="font-bold text-xl break-keep md:text-[40px] text-gray-900 line-clamp-2">
            {post.title}
          </h1>

          {/* 소제목 */}
          {post.subtitle && (
            <p className="text-gray-600 line-clamp-2 text-sm md:text-base">{post.subtitle}</p>
          )}

          {/* 작성일 */}
          {post.publishedAt && (
            <span className="text-gray-400 text-sm">
              {dayjs(post.publishedAt).format('YYYY.MM.DD')}
            </span>
          )}

          <div className="mt-4">
            <Button>
              <span>게시글 보기</span>
            </Button>
          </div>
        </div>
      )}
    </Link>
  );
}
