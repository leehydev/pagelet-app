'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/user-store';

/**
 * 앱 레이아웃 껍데기. 유저 조회는 여기서 한 번만 수행 (무한 /auth/me 방지).
 * RootProviders 안에 두어 전역에서 user store를 한 번 채움.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const fetchUser = useUserStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}
