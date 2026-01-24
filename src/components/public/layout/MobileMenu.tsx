'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { PublicCategory } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  categories: PublicCategory[];
  siteSlug: string;
}

export function MobileMenu({ categories, siteSlug }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentCategorySlug = pathname?.includes('/category/')
    ? pathname.split('/category/')[1]?.split('/')[0]
    : null;
  const isAllPostsPage = pathname.endsWith('/posts');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 p-0">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b">
            <SheetTitle className="font-semibold text-gray-900">카테고리</SheetTitle>
          </div>

          {/* 카테고리 목록 */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {/* 전체 */}
              <li>
                <Link
                  href={`/t/${siteSlug}/posts`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg transition-colors',
                    isAllPostsPage && !currentCategorySlug
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100',
                  )}
                >
                  전체
                </Link>
              </li>

              {/* 카테고리들 */}
              {categories.map((category) => {
                const isActive = currentCategorySlug === category.slug;
                return (
                  <li key={category.slug}>
                    <Link
                      href={`/t/${siteSlug}/category/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100',
                      )}
                    >
                      {category.name}
                      {category.postCount !== undefined && category.postCount > 0 && (
                        <span className="ml-2 text-sm text-gray-400">({category.postCount})</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
