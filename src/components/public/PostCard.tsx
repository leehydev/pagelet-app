'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PublicPost } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatPostDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: PublicPost;
  siteSlug: string;
}

// Category color mapping
const getCategoryColor = (categoryName: string | null) => {
  if (!categoryName) return 'bg-gray-100 text-gray-700';
  
  const name = categoryName.toLowerCase();
  if (name.includes('design')) return 'bg-blue-100 text-blue-700';
  if (name.includes('marketing')) return 'bg-purple-100 text-purple-700';
  if (name.includes('lifestyle')) return 'bg-pink-100 text-pink-700';
  if (name.includes('tech')) return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
};

export function PostCard({ post, siteSlug }: PostCardProps) {
  const formattedDate = formatPostDate(post.publishedAt);
  const categoryColor = getCategoryColor(post.categoryName);

  return (
    <Link href={`/t/${siteSlug}/posts/${post.slug}`} className="block group">
      <article className="flex flex-col h-full cursor-pointer bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        {/* 썸네일 이미지 */}
        <div className="aspect-video bg-gray-200 relative overflow-hidden">
          <Image
            src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        </div>

        {/* 텍스트 콘텐츠 */}
        <div className="flex-1 flex flex-col p-6">
          {/* 카테고리 */}
          {post.categoryName && (
            <div className="mb-3">
              <span className={cn('inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase', categoryColor)}>
                {post.categoryName}
              </span>
            </div>
          )}
          {/* 제목 */}
          <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {post.title}
          </h2>
          {/* 날짜 */}
          <time className="text-sm text-gray-500">{formattedDate}</time>
        </div>
      </article>
    </Link>
  );
}
