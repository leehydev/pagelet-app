'use client';

import { create } from 'zustand';
import { getMe, type User } from '@/lib/api';
import { hasAccessToken, refreshToken } from '@/lib/api/auth-utils';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: boolean;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
}

/**
 * 유저 상태 스토어
 * - 유저 조회는 AuthShell 마운트 시 한 번만 수행 (fetchUser)
 * - useUser()는 store 구독만 하여 무한 refetch 방지
 */
export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  error: false,

  fetchUser: async () => {
    set({ isLoading: true, error: false });

    // 1. 액세스 토큰 없으면 리프레시 시도 (실패 시 로그아웃은 useRequireAuth 등에서 처리)
    if (!hasAccessToken()) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        set({ user: null, isLoading: false, error: true });
        return;
      }
    }

    try {
      const user = await getMe();
      set({ user, isLoading: false, error: false });
    } catch {
      set({ user: null, isLoading: false, error: true });
    }
  },

  clearUser: () => set({ user: null, isLoading: false, error: false }),
}));
