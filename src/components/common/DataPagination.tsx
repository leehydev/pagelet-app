'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface DataPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function DataPagination({
  meta,
  onPageChange,
  itemLabel = 'posts',
  className,
}: DataPaginationProps) {
  const { page, limit, totalItems, totalPages, hasPreviousPage, hasNextPage } = meta;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // 페이지 번호 배열 생성 (최대 5개 표시)
  const getPageNumbers = (): number[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 현재 페이지 주변 2개씩 표시
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    // 시작이나 끝에 가까우면 조정
    if (page <= 3) {
      start = 1;
      end = 5;
    } else if (page >= totalPages - 2) {
      start = totalPages - 4;
      end = totalPages;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* 왼쪽: 아이템 정보 */}
      <p className="text-xs text-gray-500 uppercase tracking-wide">
        {itemLabel} 총 {totalItems} 개중 {startItem} - {endItem} 표시
      </p>

      {/* 오른쪽: 페이지네이션 컨트롤 */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Previous 버튼 */}
        <button
          type="button"
          onClick={() => hasPreviousPage && onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
            hasPreviousPage
              ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed',
          )}
          aria-label="이전 페이지"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* 페이지 번호들 */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum) => (
            <button
              type="button"
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm rounded-md transition-colors',
                pageNum === page ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100',
              )}
              aria-label={`${pageNum} 페이지`}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* Next 버튼 */}
        <button
          type="button"
          onClick={() => hasNextPage && onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors',
            hasNextPage
              ? 'text-gray-700 hover:bg-gray-100 cursor-pointer'
              : 'text-gray-300 cursor-not-allowed',
          )}
          aria-label="다음 페이지"
        >
          <span>Next</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
