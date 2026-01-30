'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { useAdminSites } from '@/hooks/use-admin-sites';
import { useSiteStore, getCurrentSiteId } from '@/stores/site-store';
import { AccountStatus } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueryError } from '@/components/common/QueryError';
import { AdminSidebar } from '@/components/app/layout/AdminSidebar';

const ONBOARDING_PATH = '/onboarding/site';

/**
 * Admin 레이아웃
 * - 인증 체크 및 온보딩 리다이렉트
 * - Site 스토어 기반 현재 사이트 관리
 * - 사이드바 렌더링
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading: userLoading, error: userError } = useUser();
  const { data: sites, isLoading: sitesLoading, isError: sitesError, refetch } = useAdminSites();

  const currentSiteId = useSiteStore((state) => state.currentSiteId);
  const setCurrentSiteId = useSiteStore((state) => state.setCurrentSiteId);
  const hasInitializedSiteRef = useRef(false);

  // 인증 및 온보딩 체크
  useEffect(() => {
    if (userLoading) return;

    if (userError) {
      router.replace('/signin');
      return;
    }

    if (user?.accountStatus === AccountStatus.PENDING) {
      router.replace('/waiting');
      return;
    }

    if (user?.accountStatus === AccountStatus.ONBOARDING) {
      router.replace(ONBOARDING_PATH);
    }
  }, [user, userLoading, userError, router]);

  // 사이트 자동 선택 및 유효성 검증
  useEffect(() => {
    if (sitesLoading || sitesError || !sites) return;

    // 사이트 없음 → 온보딩
    if (sites.length === 0) {
      router.replace('/onboarding/site');
      return;
    }

    // currentSiteId가 유효한지 검증 (스토어에서 직접 가져옴)
    const storeSiteId = getCurrentSiteId();
    const validSite = storeSiteId ? sites.find((s) => s.id === storeSiteId) : null;

    // 이미 초기화를 시도했고, currentSiteId가 유효하면 더 이상 실행하지 않음
    if (hasInitializedSiteRef.current && validSite) {
      return;
    }

    if (!validSite) {
      // 유효하지 않으면 첫 번째 사이트 또는 localStorage에서 복구
      const lastSiteId = localStorage.getItem('pagelet.admin.lastSiteId');
      const lastSite = lastSiteId ? sites.find((s) => s.id === lastSiteId) : null;
      const targetSite = lastSite || sites[0];

      setCurrentSiteId(targetSite.id);
      localStorage.setItem('pagelet.admin.lastSiteId', targetSite.id);
      hasInitializedSiteRef.current = true;
    } else {
      // 유효한 사이트가 있으면 초기화 완료 표시
      hasInitializedSiteRef.current = true;
    }
    // currentSiteId를 dependency에서 제거하여 무한 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sites, sitesLoading, sitesError, setCurrentSiteId, router]);

  // 로딩 상태
  if (
    userLoading ||
    userError ||
    !user ||
    user.accountStatus === AccountStatus.ONBOARDING ||
    user.accountStatus === AccountStatus.PENDING
  ) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (sitesLoading || !sites) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (sitesError) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <QueryError
          error={new Error('사이트 목록을 불러오는데 실패했습니다.')}
          onRetry={refetch}
          fallbackMessage="사이트 목록을 불러오는데 실패했습니다."
          size="page"
        />
      </div>
    );
  }

  // 사이트가 없거나 currentSiteId가 아직 설정되지 않음 (리다이렉트 대기)
  if (sites.length === 0 || !currentSiteId) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-7xl mx-auto border-r border-gray-200 border-l">
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 bg-[#f7f7f7] overflow-auto">{children}</main>
      </div>
    </div>
  );
}
