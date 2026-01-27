'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminSidebar } from '@/components/app/layout/AdminSidebar';
import { SiteProvider } from '@/contexts/site-context';
import { useAdminSites } from '@/hooks/use-admin-sites';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { QueryError } from '@/components/common/QueryError';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const siteId = params.siteId as string;

  const { data: sites, isLoading, isError, refetch } = useAdminSites();

  // siteId 유효성 검증
  useEffect(() => {
    if (isLoading || isError || !sites) return;

    const validSite = sites.find((s) => s.id === siteId);
    if (!validSite) {
      // 유효하지 않은 siteId → /admin으로 리다이렉트
      router.replace('/admin');
    }
  }, [sites, siteId, isLoading, isError, router]);

  // 로딩 중 또는 사이트 정보 없음 (유효성 검증 대기)
  if (isLoading || !sites) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (isError) {
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

  // 유효하지 않은 사이트인 경우 (리다이렉트 전)
  if (sites && !sites.find((s) => s.id === siteId)) {
    return null;
  }

  return (
    <SiteProvider siteId={siteId}>
      <div className="flex flex-col h-screen w-full max-w-7xl mx-auto">
        {/* Sidebar + Main 영역 */}
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 bg-[#f7f7f7] overflow-auto">{children}</main>
        </div>
      </div>
    </SiteProvider>
  );
}
