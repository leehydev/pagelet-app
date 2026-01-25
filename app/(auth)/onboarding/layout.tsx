'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

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

    // 사이트 생성 페이지가 아니면 리다이렉트
    if (!pathname.includes('/site')) {
      router.replace('/onboarding/site');
    }
  }, [user, isLoading, error, pathname, router]);

  // 로딩 중
  if (isLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  // 에러 또는 사용자 없음
  if (error || !user) {
    return null;
  }

  // 온보딩 상태가 아님
  if (user.accountStatus !== AccountStatus.ONBOARDING) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pagelet 시작하기</h1>
          <p className="text-gray-600 mt-2">홈페이지 정보를 입력하면 바로 시작할 수 있어요</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
