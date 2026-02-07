'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRequireOnboarding } from '@/hooks/use-require-auth';
import { useAdminSites } from '@/hooks/use-admin-sites';
import { AccountStatus } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/** ONBOARDING 또는 ACTIVE+사이트없음(첫 사이트 생성)일 때 온보딩 허용 */
function canStayOnOnboarding(
  accountStatus: AccountStatus,
  sites: { length: number } | undefined,
  sitesLoading: boolean
) {
  if (accountStatus === AccountStatus.ONBOARDING) return true;
  if (accountStatus === AccountStatus.ACTIVE && (sitesLoading || !sites || sites.length === 0))
    return true;
  return false;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isError } = useRequireOnboarding();
  const { data: sites, isLoading: sitesLoading } = useAdminSites();

  // 사이트 생성 페이지가 아니면 리다이렉트 (ONBOARDING일 때만 경로 제한)
  useEffect(() => {
    if (isLoading || !user || user.accountStatus !== AccountStatus.ONBOARDING) return;
    if (!pathname.includes('/site')) {
      router.replace('/onboarding/site');
    }
  }, [user, isLoading, pathname, router]);

  // 로딩 중, 에러, 또는 사용자 정보 없음 (리다이렉트 대기)
  if (isLoading || isError || !user) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!canStayOnOnboarding(user.accountStatus, sites, sitesLoading)) {
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
