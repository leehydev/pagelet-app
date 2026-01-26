'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe, getAccessToken, type User } from '@/lib/api';

export function useUser() {
  // 초기값을 함수로 설정하여 클라이언트에서만 실행되도록 함
  const [hasToken] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!getAccessToken();
  });

  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    enabled: hasToken, // 클라이언트에서 토큰 확인 후에만 요청
    retry: false,
    staleTime: 30 * 1000, // 30초
    refetchOnWindowFocus: true, // 탭 포커스 시 refetch
    refetchOnReconnect: true, // 네트워크 재연결 시 refetch
  });
}
