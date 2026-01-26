'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /** 로딩 메시지 (선택사항) */
  message?: string;
  /** 전체 화면 로딩 여부 (기본값: false) */
  fullScreen?: boolean;
  /** 스피너 크기 (기본값: 'md') */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

export function LoadingSpinner({ message, fullScreen = false, size = 'md' }: LoadingSpinnerProps) {
  const containerClass = fullScreen
    ? 'flex h-screen items-center justify-center'
    : 'flex items-center justify-center';
  const spinnerClass = `${sizeClasses[size]} animate-spin text-muted-foreground`;

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={spinnerClass} />
        {message && <div className="text-sm text-muted-foreground">{message}</div>}
      </div>
    </div>
  );
}
