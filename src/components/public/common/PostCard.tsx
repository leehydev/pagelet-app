'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PublicPost } from '@/lib/api';
import { formatPostDate } from '@/lib/date-utils';
import { Calendar } from 'lucide-react';

interface ImprovedPostCardProps {
  post: PublicPost;
  siteSlug: string;
}

export function ImprovedPostCard({ post, siteSlug }: ImprovedPostCardProps) {
  const formattedDate = formatPostDate(post.publishedAt);

  return (
    <Link href={`/t/${siteSlug}/posts/${post.slug}`} className="block group h-full">
      <article className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        {/* 썸네일 이미지 with overlay effect */}
        <div className="relative aspect-video bg-linear-to-br from-gray-100 to-gray-200 overflow-hidden">
          <Image
            src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category badge on image */}
          {post.categoryName && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-900 shadow-md">
                {post.categoryName}
              </span>
            </div>
          )}
        </div>

        {/* 텍스트 콘텐츠 with better padding */}
        <div className="flex-1 flex flex-col p-6">
          {/* Date with icon */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <time>{formattedDate}</time>
          </div>

          {/* 제목 with hover effect */}
          <h2 className="text-xl font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight break-all">
            {post.title}
          </h2>

          {/* 부제목 */}
          {post.subtitle && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-auto break-all">
              {post.subtitle}
            </p>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-linear-to-r from-primary/20 via-primary to-primary/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </article>
    </Link>
  );
}
