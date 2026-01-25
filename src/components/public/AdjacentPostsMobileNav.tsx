import Link from 'next/link';
import Image from 'next/image';
import { AdjacentPost } from '@/lib/api';
import { formatPostDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface AdjacentPostsMobileNavProps {
  posts: AdjacentPost[];
  siteSlug: string;
  className?: string;
}

export function AdjacentPostsMobileNav({
  posts,
  siteSlug,
  className,
}: AdjacentPostsMobileNavProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section aria-label="인접 게시글 네비게이션" className={cn('py-6', className)}>
      <h2 className="text-sm font-medium text-gray-500 mb-3 px-4">관련 게시글</h2>
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory pt-1">
        {posts.map((post) => (
          <MobilePostCard key={post.id} post={post} siteSlug={siteSlug} />
        ))}
      </div>
    </section>
  );
}

interface MobilePostCardProps {
  post: AdjacentPost;
  siteSlug: string;
}

function MobilePostCard({ post, siteSlug }: MobilePostCardProps) {
  const formattedDate = formatPostDate(post.publishedAt);

  const cardContent = (
    <article
      className={cn(
        'w-36 shrink-0 snap-start',
        'rounded-lg overflow-hidden transition-all duration-200',
        post.isCurrent
          ? 'ring-2 ring-gray-400 bg-gray-50'
          : 'bg-white shadow-sm border border-gray-100 active:scale-95',
      )}
    >
      {/* 썸네일 이미지 - w-36(144px)의 4:3 비율 = 108px */}
      <div className="w-full h-[108px] relative overflow-hidden bg-gray-100">
        <Image
          src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
          alt={post.title}
          fill
          sizes="144px"
          className="object-cover"
        />
        {post.isCurrent && (
          <div className="absolute inset-0 bg-gray-500/20 flex items-center justify-center">
            <span className="bg-gray-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              현재 글
            </span>
          </div>
        )}
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="p-2">
        <h3
          className={cn(
            'text-xs font-medium line-clamp-2 mb-1 leading-tight',
            post.isCurrent ? 'text-gray-600' : 'text-gray-900',
          )}
        >
          {post.title}
        </h3>
        <time
          dateTime={post.publishedAt}
          className={cn('text-[10px]', post.isCurrent ? 'text-gray-400' : 'text-gray-400')}
        >
          {formattedDate}
        </time>
      </div>
    </article>
  );

  // 현재 글이면 링크 없이 렌더링
  if (post.isCurrent) {
    return (
      <div aria-current="page" className="outline-none">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/t/${siteSlug}/posts/${post.slug}`}
      className="outline-none focus-visible:ring-2 focus-visible:ring-gray-400 rounded-lg"
    >
      {cardContent}
    </Link>
  );
}
