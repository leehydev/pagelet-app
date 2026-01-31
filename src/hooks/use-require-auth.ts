'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { useUserStore } from '@/stores/user-store';
import { logout } from '@/lib/api/auth-utils';
import { AccountStatus } from '@/lib/api/types';

const ONBOARDING_PATH = '/onboarding/site';

/**
 * 로그인 필수 페이지에서 사용.
 * 비로그인 또는 만료된 토큰이면 logout 후 /signin으로 리다이렉트.
 */
export function useRequireAuth() {
  const { data: user, isLoading, isError } = useUser();
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    if (isLoading) return;
    if (isError || !user) {
      clearUser();
      logout();
    }
  }, [isLoading, isError, user, clearUser]);

  return { user, isLoading, isError };
}

/**
 * 어드민 레이아웃에서 사용.
 * - 비로그인/에러 → logout → /signin
 * - PENDING → /waiting
 * - ONBOARDING → /onboarding/site
 * - ACTIVE만 통과
 */
export function useRequireAdmin() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useUser();
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    if (isLoading) return;

    if (isError || !user) {
      clearUser();
      logout();
      return;
    }

    if (user.accountStatus === AccountStatus.PENDING) {
      router.replace('/waiting');
      return;
    }

    if (user.accountStatus === AccountStatus.ONBOARDING) {
      router.replace(ONBOARDING_PATH);
    }
  }, [user, isLoading, isError, router, clearUser]);

  return { user, isLoading, isError };
}

/**
 * 온보딩 레이아웃에서 사용.
 * - 비로그인/에러 → /signin
 * - accountStatus !== ONBOARDING → /admin
 */
export function useRequireOnboarding() {
  const router = useRouter();
  const { data: user, isLoading, isError } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (isError || !user) {
      router.replace('/signin');
      return;
    }

    if (user.accountStatus !== AccountStatus.ONBOARDING) {
      router.replace('/admin');
    }
  }, [user, isLoading, isError, router]);

  return { user, isLoading, isError };
}
