'use client';

import { useUserStore } from '@/stores/user-store';

/**
 * 전역 유저 상태 훅 (Zustand 기반)
 *
 * - user 조회는 AuthShell 마운트 시 한 번만 수행 (fetchUser)
 * - 로그인 여부·유저 정보는 store에서 읽기만 함 → 무한 refetch 방지
 */
export function useUser() {
  const user = useUserStore((s) => s.user);
  const isLoading = useUserStore((s) => s.isLoading);
  const error = useUserStore((s) => s.error);
  const fetchUser = useUserStore((s) => s.fetchUser);

  return {
    data: user,
    isLoading,
    isError: !!error,
    error: error ? new Error('인증에 실패했습니다.') : null,
    refetch: fetchUser,
  };
}
