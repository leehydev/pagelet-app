import Link from 'next/link';
import Image from 'next/image';
import { AdjacentPost } from '@/lib/api';
import { formatPostDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface AdjacentPostsNavProps {
  posts: AdjacentPost[];
  siteSlug: string;
}

export function AdjacentPostsNav({ posts, siteSlug }: AdjacentPostsNavProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section aria-label="인접 게시글 네비게이션" className="py-8">
      <h2 className="sr-only">관련 게시글</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {posts.map((post) => (
          <AdjacentPostCard key={post.id} post={post} siteSlug={siteSlug} />
        ))}
      </div>
    </section>
  );
}

interface AdjacentPostCardProps {
  post: AdjacentPost;
  siteSlug: string;
}

function AdjacentPostCard({ post, siteSlug }: AdjacentPostCardProps) {
  const formattedDate = formatPostDate(post.publishedAt);

  const cardContent = (
    <article
      className={cn(
        'flex-shrink-0 w-[200px] md:w-[calc((100%-48px)/5)] snap-start',
        'rounded-lg overflow-hidden transition-all duration-200',
        post.isCurrent
          ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
          : 'bg-white hover:shadow-md border border-gray-200',
      )}
    >
      {/* 썸네일 이미지 */}
      <div className="aspect-video relative overflow-hidden bg-gray-100">
        <Image
          src={post.ogImageUrl || '/images/admin/no_thumbnail.png'}
          alt={post.title}
          fill
          sizes="200px"
          className="object-cover"
        />
        {post.isCurrent && (
          <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
            <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              현재 글
            </span>
          </div>
        )}
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="p-3">
        <h3
          className={cn(
            'text-sm font-medium line-clamp-2 mb-1',
            post.isCurrent ? 'text-blue-700' : 'text-gray-900',
          )}
        >
          {post.title}
        </h3>
        <time
          dateTime={post.publishedAt}
          className={cn('text-xs', post.isCurrent ? 'text-blue-500' : 'text-gray-400')}
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
      className="outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
    >
      {cardContent}
    </Link>
  );
}
