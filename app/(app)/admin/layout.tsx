'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const ONBOARDING_PATHS = {
  1: '/onboarding/profile',
  2: '/onboarding/site',
  3: '/onboarding/first-post',
} as const;

/**
 * Admin 루트 레이아웃
 * - 인증 체크 및 온보딩 리다이렉트만 담당
 * - 사이드바/헤더는 [siteId]/layout.tsx에서 렌더링
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    // 온보딩 상태면 온보딩 페이지로 리다이렉트
    if (user?.accountStatus === AccountStatus.ONBOARDING) {
      const step = user.onboardingStep || 1;
      const path = ONBOARDING_PATHS[step as keyof typeof ONBOARDING_PATHS];
      router.replace(path || '/onboarding/profile');
    }
  }, [user, isLoading, router]);

  // 로딩 중이거나 온보딩 상태면 로딩 UI 표시
  if (isLoading || user?.accountStatus === AccountStatus.ONBOARDING) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return <>{children}</>;
}
