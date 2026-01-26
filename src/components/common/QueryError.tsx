'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getErrorDisplayMessage } from '@/lib/error-handler';

type ErrorSize = 'sm' | 'md' | 'lg' | 'page';

interface QueryErrorProps {
  /** 에러 객체 또는 에러 메시지 */
  error: Error | unknown;
  /** 재시도 함수 (없으면 버튼 숨김) */
  onRetry?: () => void;
  /** 에러 UI 크기 */
  size?: ErrorSize;
  /** 기본 에러 메시지 */
  fallbackMessage?: string;
  /** 추가 className */
  className?: string;
}

const sizeStyles: Record<ErrorSize, { container: string; icon: string; title: string; message: string }> = {
  sm: {
    container: 'p-4 rounded-lg',
    icon: 'w-5 h-5',
    title: 'text-sm font-medium',
    message: 'text-xs',
  },
  md: {
    container: 'p-6 rounded-lg',
    icon: 'w-6 h-6',
    title: 'text-base font-medium',
    message: 'text-sm',
  },
  lg: {
    container: 'p-8 rounded-lg',
    icon: 'w-8 h-8',
    title: 'text-lg font-semibold',
    message: 'text-sm',
  },
  page: {
    container: 'p-12 rounded-xl min-h-[400px] flex flex-col',
    icon: 'w-12 h-12',
    title: 'text-xl font-semibold',
    message: 'text-base',
  },
};

/**
 * React Query 에러 표시용 공통 컴포넌트
 *
 * @example
 * ```tsx
 * // 기본 사용
 * if (error) {
 *   return <QueryError error={error} onRetry={refetch} />;
 * }
 *
 * // 작은 크기
 * <QueryError error={error} size="sm" />
 *
 * // 페이지 전체
 * <QueryError error={error} size="page" onRetry={refetch} />
 * ```
 */
export function QueryError({
  error,
  onRetry,
  size = 'md',
  fallbackMessage = '데이터를 불러오는데 실패했습니다.',
  className,
}: QueryErrorProps) {
  const styles = sizeStyles[size];
  const errorMessage = getErrorDisplayMessage(error, fallbackMessage);

  return (
    <div
      className={cn(
        'bg-red-50 border border-red-200 text-center',
        styles.container,
        size === 'page' && 'items-center justify-center',
        className,
      )}
    >
      <div className={cn('flex flex-col items-center gap-3', size === 'page' && 'gap-4')}>
        <AlertCircle className={cn('text-red-500', styles.icon)} />
        <div className="space-y-1">
          <p className={cn('text-red-700', styles.title)}>오류가 발생했습니다</p>
          <p className={cn('text-red-600', styles.message)}>{errorMessage}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size={size === 'sm' ? 'sm' : 'default'}
            onClick={onRetry}
            className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 간단한 인라인 에러 메시지
 */
export function QueryErrorInline({
  error,
  fallbackMessage = '오류가 발생했습니다.',
  className,
}: Pick<QueryErrorProps, 'error' | 'fallbackMessage' | 'className'>) {
  const errorMessage = getErrorDisplayMessage(error, fallbackMessage);

  return (
    <p className={cn('text-sm text-red-600 flex items-center gap-1.5', className)}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {errorMessage}
    </p>
  );
}
