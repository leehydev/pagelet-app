'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api';
import { Stepper } from '@/components/onboarding/Stepper';

const STEP_PATHS = {
  1: '/onboarding/profile',
  2: '/onboarding/site',
} as const;

function getStepFromPath(pathname: string): number {
  if (pathname.includes('/profile')) return 1;
  if (pathname.includes('/site')) return 2;
  return 1;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isLoading, error } = useUser();

  useEffect(() => {
    if (isLoading) return;

    // 인증되지 않은 경우 로그인 페이지로
    if (error) {
      router.replace('/signin');
      return;
    }

    if (!user) return;

    // 온보딩 상태가 아니면 대시보드로
    if (user.accountStatus !== AccountStatus.ONBOARDING) {
      router.replace('/admin');
      return;
    }

    // 현재 URL의 단계와 사용자의 온보딩 단계가 맞지 않으면 올바른 단계로 리다이렉트
    const currentPathStep = getStepFromPath(pathname);
    const userStep = user.onboardingStep || 1;

    if (currentPathStep !== userStep) {
      const correctPath = STEP_PATHS[userStep as keyof typeof STEP_PATHS];
      if (correctPath) {
        router.replace(correctPath);
      }
    }
  }, [user, isLoading, error, pathname, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // 에러 또는 사용자 없음
  if (error || !user) {
    return null;
  }

  // 온보딩 상태가 아님
  if (user.accountStatus !== AccountStatus.ONBOARDING) {
    return null;
  }

  const currentStep = user.onboardingStep || 1;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pagelet 시작하기</h1>
          <p className="text-gray-600 mt-2">몇 가지 정보만 입력하면 바로 시작할 수 있어요</p>
        </div>

        <Stepper currentStep={currentStep} />

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
