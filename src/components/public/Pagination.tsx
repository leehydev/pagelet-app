import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaginationMeta } from '@/lib/api';

interface PaginationProps {
  meta: PaginationMeta;
  basePath: string;
  className?: string;
}

/**
 * 페이지네이션 컴포넌트
 * ISR을 위해 서버 컴포넌트로 구현 (Link 사용)
 */
export function Pagination({ meta, basePath, className }: PaginationProps) {
  const { page, totalPages, totalItems, hasNextPage, hasPreviousPage } = meta;

  // 페이지가 1개 이하면 렌더링하지 않음
  if (totalPages <= 1) {
    return null;
  }

  // 표시할 페이지 번호 계산 (현재 페이지 중심으로 최대 5개)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let start = Math.max(1, page - halfVisible);
    const end = Math.min(totalPages, start + maxVisible - 1);

    // 끝에서 시작이 부족하면 조정
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const getPageUrl = (pageNum: number) => {
    if (pageNum === 1) {
      return basePath;
    }
    const separator = basePath.includes('?') ? '&' : '?';
    return `${basePath}${separator}page=${pageNum}`;
  };

  const buttonBaseClass =
    'inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300';
  const buttonEnabledClass = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
  const buttonDisabledClass = 'text-gray-300 cursor-not-allowed';
  const buttonActiveClass = 'bg-gray-900 text-white hover:bg-gray-800';

  return (
    <nav
      className={cn('flex flex-col items-center gap-4', className)}
      aria-label="페이지 네비게이션"
    >
      {/* 총 게시글 수 */}
      <p className="text-sm text-gray-500">총 {totalItems.toLocaleString()}개의 게시글</p>

      {/* 페이지네이션 버튼 */}
      <div className="flex items-center gap-1">
        {/* 첫 페이지 */}
        {hasPreviousPage ? (
          <Link
            href={getPageUrl(1)}
            className={cn(buttonBaseClass, buttonEnabledClass)}
            aria-label="첫 페이지"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className={cn(buttonBaseClass, buttonDisabledClass)} aria-disabled="true">
            <ChevronsLeft className="w-4 h-4" />
          </span>
        )}

        {/* 이전 페이지 */}
        {hasPreviousPage ? (
          <Link
            href={getPageUrl(page - 1)}
            className={cn(buttonBaseClass, buttonEnabledClass)}
            aria-label="이전 페이지"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
        ) : (
          <span className={cn(buttonBaseClass, buttonDisabledClass)} aria-disabled="true">
            <ChevronLeft className="w-4 h-4" />
          </span>
        )}

        {/* 페이지 번호 */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((pageNum) =>
            pageNum === page ? (
              <span
                key={pageNum}
                className={cn(buttonBaseClass, buttonActiveClass)}
                aria-current="page"
              >
                {pageNum}
              </span>
            ) : (
              <Link
                key={pageNum}
                href={getPageUrl(pageNum)}
                className={cn(buttonBaseClass, buttonEnabledClass)}
              >
                {pageNum}
              </Link>
            ),
          )}
        </div>

        {/* 다음 페이지 */}
        {hasNextPage ? (
          <Link
            href={getPageUrl(page + 1)}
            className={cn(buttonBaseClass, buttonEnabledClass)}
            aria-label="다음 페이지"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className={cn(buttonBaseClass, buttonDisabledClass)} aria-disabled="true">
            <ChevronRight className="w-4 h-4" />
          </span>
        )}

        {/* 마지막 페이지 */}
        {hasNextPage ? (
          <Link
            href={getPageUrl(totalPages)}
            className={cn(buttonBaseClass, buttonEnabledClass)}
            aria-label="마지막 페이지"
          >
            <ChevronsRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className={cn(buttonBaseClass, buttonDisabledClass)} aria-disabled="true">
            <ChevronsRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
