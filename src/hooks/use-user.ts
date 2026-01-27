'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe, getAccessToken, setAccessToken, removeAccessToken, type User } from '@/lib/api';

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const data = await res.json();

    if (res.ok && data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function logout() {
  removeAccessToken();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/signin')) {
    window.location.href = '/signin';
  }
}

export function useUser() {
  const [isReady, setIsReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
      // 1. accessToken 있으면 바로 준비 완료
      if (getAccessToken()) {
        setHasToken(true);
        setIsReady(true);
        return;
      }

      // 2. accessToken 없으면 리프레시 시도
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        // 리프레시 성공
        setHasToken(true);
        setIsReady(true);
      } else {
        // 리프레시 실패 (리프레시 토큰 없거나 만료) -> 로그아웃
        logout();
      }
    }

    initializeAuth();
  }, []);

  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    enabled: isReady && hasToken,
    retry: false,
    staleTime: 30 * 1000, // 30초
    refetchOnWindowFocus: true, // 탭 포커스 시 refetch
    refetchOnReconnect: true, // 네트워크 재연결 시 refetch
  });
}
