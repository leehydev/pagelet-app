'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PublicPost } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatPostDate } from '@/lib/date-utils';
import { MinusIcon } from 'lucide-react';

interface PostCardProps {
  post: PublicPost;
  siteSlug: string;
}

export function PostCard({ post, siteSlug }: PostCardProps) {
  const formattedDate = formatPostDate(post.publishedAt);

  return (
    <Link href={`/t/${siteSlug}/posts/${post.slug}`} className="block group">
      <article className="flex flex-col h-full cursor-pointer">
        {/* 썸네일 이미지 */}
        <div className="aspect-video bg-gray-200 relative overflow-hidden mb-3 rounded-lg">
          <Image
            src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        </div>

        {/* 텍스트 콘텐츠 */}
        <div className="flex-1 flex flex-col px-1">
          {/* 카테고리와 날짜 */}
          <div className="flex items-center gap-2 mb-2">
            {post.categoryName ? <Badge variant="secondary">{post.categoryName}</Badge> : <div />}
            <MinusIcon className="w-4 h-4 text-gray-300" />
            <time className="text-xs text-gray-400">{formattedDate}</time>
          </div>
          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
          {/* 부제목 */}
          <h3 className="text-base text-gray-400 line-clamp-1">{post.subtitle}</h3>
        </div>
      </article>
    </Link>
  );
}
