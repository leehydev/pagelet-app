'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Devtools는 개발 환경에서만 동적으로 로드
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? dynamic(
      () =>
        import('@tanstack/react-query-devtools').then((res) => ({
          default: res.ReactQueryDevtools,
        })),
      { ssr: false }
    )
  : () => null;

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR을 고려한 기본 설정
            staleTime: 60 * 1000, // 1분
            gcTime: 5 * 60 * 1000, // 5분 (이전 cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
