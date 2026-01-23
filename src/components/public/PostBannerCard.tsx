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
      className={cn('group block bg-white rounded-lg overflow-hidden h-72', className)}
    >
      {/* 가로형 레이아웃 (데스크톱) / 세로형 레이아웃 (모바일) */}
      {post.ogImageUrl ? (
        <div className="flex flex-col md:flex-row h-72">
          {/* 이미지 영역 */}
          {post.ogImageUrl && (
            <div className="md:w-[40%] shrink-0 order-2 md:order-1 h-72">
              <Image
                src={post.ogImageUrl}
                alt={post.title}
                width={1200}
                height={500}
                className="w-full h-48 md:h-full object-cover aspect-video md:aspect-auto"
              />
            </div>
          )}

          {/* 텍스트 영역 */}
          <div className="flex-1 p-5 md:py-6 md:pl-16 flex flex-col justify-center order-1 md:order-2">
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
              <p className="text-gray-600 line-clamp-2 mb-4 text-sm md:text-base">
                {post.subtitle}
              </p>
            )}

            {/* 작성일 */}
            {post.publishedAt && (
              <p className="text-gray-400 text-sm">
                {dayjs(post.publishedAt).format('YYYY.MM.DD')}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center flex flex-col justify-center h-72">
          {/* 카테고리 */}
          <div className="mb-1">
            {post.categoryName && (
              <Badge variant="secondary" className="w-fit mx-auto text-xs">
                {post.categoryName}
              </Badge>
            )}
          </div>

          <h1 className="font-bold text-xl md:text-6xl text-gray-900 line-clamp-2">{post.title}</h1>

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

          <div className="mt-3">
            <Button>
              <span>게시글 보기</span>
            </Button>
          </div>
        </div>
      )}
    </Link>
  );
}
