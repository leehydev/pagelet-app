'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useUserStore } from '@/stores/user-store';

/**
 * 인증이 필요한 경로 프리픽스.
 * proxy.ts에서 서브도메인 → /t/[slug] rewrite를 수행하므로,
 * usePathname()은 rewrite 전의 브라우저 URL 경로를 반환한다.
 * 따라서 공개 경로를 열거하는 대신, 인증이 필요한 경로만 명시한다.
 */
const AUTH_REQUIRED_PREFIXES = ['/admin', '/signin', '/signup', '/waiting', '/onboarding', '/auth'];

function isAuthRequired(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 앱 레이아웃 껍데기. 유저 조회는 여기서 한 번만 수행 (무한 /auth/me 방지).
 * RootProviders 안에 두어 전역에서 user store를 한 번 채움.
 * /admin 경로에서만 인증 로직을 수행하고, 그 외(공개 블로그, 랜딩 등)에서는 건너뛴다.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const fetchUser = useUserStore((s) => s.fetchUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const pathname = usePathname();

  useEffect(() => {
    if (isAuthRequired(pathname)) {
      fetchUser();
    } else {
      // 인증 불필요 경로: isLoading을 false로 전환하여 로딩 스피너 방지
      clearUser();
    }
  }, [fetchUser, clearUser, pathname]);

  return <>{children}</>;
}
