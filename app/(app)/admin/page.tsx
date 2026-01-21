'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSites } from '@/hooks/use-admin-sites';
import { Button } from '@/components/ui/button';

const LAST_SITE_KEY = 'pagelet.admin.lastSiteId';

/**
 * /admin 페이지
 * - 사이트 0개 → 온보딩으로 리다이렉트
 * - 사이트 1개 → 자동 진입
 * - 사이트 N개 → 마지막 선택 복구 또는 선택 UI 표시
 */
export default function AdminIndexPage() {
  const router = useRouter();
  const { data: sites, isLoading, isError } = useAdminSites();

  useEffect(() => {
    if (isLoading || !sites) return;

    if (sites.length === 0) {
      // 사이트 없음 → 온보딩
      router.replace('/onboarding/site');
      return;
    }

    if (sites.length === 1) {
      // 사이트 1개 → 자동 진입
      router.replace(`/admin/${sites[0].id}`);
      return;
    }

    // 사이트 N개 → localStorage에서 마지막 선택 복구
    const lastSiteId = localStorage.getItem(LAST_SITE_KEY);
    const validSite = sites.find((s) => s.id === lastSiteId);

    if (validSite) {
      router.replace(`/admin/${validSite.id}`);
    }
    // else: 사이트 선택 UI 표시 (아래 렌더링)
  }, [sites, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">사이트 목록을 불러오는데 실패했습니다.</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  // 사이트 N개 & 마지막 선택 없음 → 선택 UI
  if (sites && sites.length > 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사이트 선택</h1>
          <p className="text-gray-500">관리할 사이트를 선택하세요.</p>
        </div>
        <div className="grid gap-3 w-full max-w-sm">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                localStorage.setItem(LAST_SITE_KEY, site.id);
                router.push(`/admin/${site.id}`);
              }}
              className="px-6 py-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
            >
              <div className="font-medium text-gray-900">{site.name}</div>
              <div className="text-sm text-gray-500">{site.slug}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

