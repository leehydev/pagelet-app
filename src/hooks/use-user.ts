'use client';

import { useQuery } from '@tanstack/react-query';
import { getMe, getAccessToken, type User } from '@/lib/api';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    enabled: !!getAccessToken(), // 토큰이 있을 때만 요청
    retry: false,
    staleTime: 30 * 1000, // 30초
    refetchOnWindowFocus: true, // 탭 포커스 시 refetch
    refetchOnReconnect: true, // 네트워크 재연결 시 refetch
  });
}
