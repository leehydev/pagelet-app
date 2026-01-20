'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
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

function getErrorMessage(error: Error): string {
  // Axios 에러 처리
  if (error instanceof AxiosError) {
    const status = error.response?.status;

    // 상태 코드에 따른 사용자 친화적인 메시지 반환
    if (status === 403) {
      return '접근 권한이 없습니다.';
    }
    if (status === 404) {
      return '요청한 리소스를 찾을 수 없습니다.';
    }
    if (status === 401) {
      // 401은 axios interceptor에서 처리하므로 여기서는 리다이렉트만 하고 메시지는 표시하지 않음
      return '';
    }
    if (status && status >= 500) {
      return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    // 응답 데이터에서 에러 메시지 추출 시도
    const errorData = error.response?.data;
    if (errorData && typeof errorData === 'object') {
      // 일반적인 에러 응답 형식: { message: string } 또는 { error: string }
      if ('message' in errorData && typeof errorData.message === 'string') {
        return errorData.message;
      }
      if ('error' in errorData && typeof errorData.error === 'string') {
        return errorData.error;
      }
    }

    // 상태 코드 기반 기본 메시지
    if (status && status >= 400 && status < 500) {
      return '요청을 처리할 수 없습니다.';
    }
    if (status && status >= 500) {
      return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    // 네트워크 에러
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return '네트워크 연결을 확인해주세요.';
    }
  }

  // 일반 에러 메시지에서도 민감한 정보 제거
  const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';

  // 민감한 정보가 포함된 경우 일반 메시지로 대체
  if (errorMessage.includes('query') && errorMessage.includes('variables')) {
    return '요청을 처리하는 중 오류가 발생했습니다.';
  }

  return errorMessage;
}

function handleGlobalError(error: Error) {
  // 401 에러는 axios interceptor에서 이미 처리하므로 여기서는 무시
  if (error instanceof AxiosError && error.response?.status === 401) {
    return;
  }

  const errorMessage = getErrorMessage(error);
  
  // 에러 메시지가 비어있으면 표시하지 않음 (401 등)
  if (!errorMessage) {
    return;
  }

  // 토스트로 에러 표시
  toast.error('오류가 발생했습니다', {
    description: errorMessage,
  });
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
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
        queryCache: new QueryCache({
          onError: handleGlobalError,
        }),
        mutationCache: new MutationCache({
          onError: handleGlobalError,
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
