'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PublicCategory } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: PublicCategory[];
  siteSlug: string;
}

export function CategoryTabs({ categories, siteSlug }: CategoryTabsProps) {
  const pathname = usePathname();
  const currentCategorySlug = pathname?.includes('/category/')
    ? pathname.split('/category/')[1]?.split('/')[0]
    : null;

  // 전체 게시글 페이지인지 확인
  const isAllPostsPage = pathname.endsWith('/posts');

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 py-4 min-w-max">
        {/* 전체 탭 */}
        <Link
          href={`/t/${siteSlug}/posts`}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
            isAllPostsPage && !currentCategorySlug
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          )}
        >
          전체
        </Link>

        {/* 카테고리 탭들 */}
        {categories.map((category) => {
          const isActive = currentCategorySlug === category.slug;
          return (
            <Link
              key={category.slug}
              href={`/t/${siteSlug}/category/${category.slug}`}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              )}
            >
              {category.name}
              {category.postCount !== undefined && category.postCount > 0 && (
                <span className="ml-2 text-xs opacity-70">({category.postCount})</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
