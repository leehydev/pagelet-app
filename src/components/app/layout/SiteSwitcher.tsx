'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import { Select, SelectOption } from '@/components/ui/select';
import { useAdminSites } from '@/hooks/use-admin-sites';

const LAST_SITE_KEY = 'pagelet.admin.lastSiteId';

/**
 * 사이트 전환 Select 컴포넌트
 * 어드민 헤더 또는 사이드바에서 사용
 */
export function SiteSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentSiteId = params.siteId as string;

  const { data: sites, isLoading, isError } = useAdminSites();

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSiteId = e.target.value;
    if (!newSiteId || newSiteId === currentSiteId) return;

    // 마지막 선택 저장
    localStorage.setItem(LAST_SITE_KEY, newSiteId);

    // /admin/{oldSiteId}/posts/123 → /admin/{newSiteId}/posts/123
    const newPathname = pathname.replace(`/admin/${currentSiteId}`, `/admin/${newSiteId}`);
    router.push(newPathname);
  };

  if (isLoading || !sites) {
    return <div className="h-9 w-40 animate-pulse bg-muted rounded" />;
  }

  if (isError) {
    return (
      <div className="text-sm text-red-500 px-2">
        사이트 목록을 불러올 수 없습니다
      </div>
    );
  }

  // 사이트 1개면 이름만 표시
  if (sites.length <= 1) {
    return (
      <div className="text-sm font-medium text-muted-foreground px-2">
        {sites[0]?.name ?? '사이트 없음'}
      </div>
    );
  }

  return (
    <Select value={currentSiteId} onChange={handleSiteChange} className="w-40">
      {sites.map((site) => (
        <SelectOption key={site.id} value={site.id}>
          {site.name}
        </SelectOption>
      ))}
    </Select>
  );
}
