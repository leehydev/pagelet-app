'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchPosts } from '@/hooks/use-posts';
import { PostSearchResult } from '@/lib/api';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface PostSearchAutocompleteProps {
  siteId: string;
  value?: PostSearchResult | null;
  onChange: (post: PostSearchResult | null) => void;
  excludePostIds?: string[];
  placeholder?: string;
}

export function PostSearchAutocomplete({
  siteId,
  value,
  onChange,
  excludePostIds = [],
  placeholder = '게시글 제목으로 검색...',
}: PostSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 검색 쿼리
  const { data: results, isLoading } = useSearchPosts(
    siteId,
    debouncedQuery,
    isOpen && debouncedQuery.length >= 1,
  );

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 결과 필터링 (이미 등록된 배너 제외)
  const filteredResults = results?.filter((post) => !excludePostIds.includes(post.id)) || [];

  // 디버깅
  console.log('PostSearchAutocomplete 상태:', {
    siteId,
    query,
    debouncedQuery,
    isOpen,
    isLoading,
    results,
    filteredResults,
    excludePostIds,
    enabled: isOpen && debouncedQuery.length >= 1,
  });

  const handleSelect = useCallback(
    (post: PostSearchResult) => {
      onChange(post);
      setQuery('');
      setIsOpen(false);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // 선택된 게시글이 있으면 선택된 상태 표시
  if (value) {
    return (
      <div className="relative" ref={containerRef}>
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
          {/* 썸네일 */}
          {value.ogImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.ogImageUrl}
              alt=""
              className="w-16 h-10 object-cover rounded shrink-0"
            />
          ) : (
            <div className="w-16 h-10 bg-gray-200 rounded shrink-0 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{value.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {value.categoryName && <span>{value.categoryName}</span>}
              {value.publishedAt && <span>{dayjs(value.publishedAt).format('YYYY.MM.DD')}</span>}
            </div>
          </div>

          {/* 변경 버튼 */}
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
            aria-label="선택 해제"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">검색 중...</div>
          )}

          {!isLoading && debouncedQuery && filteredResults.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}

          {!isLoading && !debouncedQuery && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              게시글 제목을 입력하세요.
            </div>
          )}

          {filteredResults.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => handleSelect(post)}
              className={cn(
                'w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left',
                'border-b border-gray-100 last:border-b-0',
              )}
            >
              {/* 썸네일 */}
              {post.ogImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.ogImageUrl}
                  alt=""
                  className="w-16 h-10 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-16 h-10 bg-gray-100 rounded shrink-0 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{post.title}</p>
                {post.subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{post.subtitle}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {post.categoryName && <span>{post.categoryName}</span>}
                  {post.publishedAt && <span>{dayjs(post.publishedAt).format('YYYY.MM.DD')}</span>}
                </div>
              </div>

              {/* 선택 아이콘 */}
              <Check className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
