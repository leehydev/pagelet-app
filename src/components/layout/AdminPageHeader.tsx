'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Bell, ChevronRight, LucideIcon, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminHeaderStore } from '@/stores/admin-header-store';

interface AdminPageHeaderProps {
  breadcrumb: string;
  title: string;
  action?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  extra?: React.ReactNode;
}

/**
 * 사이드바 토글 버튼 컴포넌트
 */
function SidebarToggle() {
  const toggleSidebar = useAdminHeaderStore((s) => s.toggleSidebar);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={toggleSidebar}
      aria-label="사이드바 토글"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );
}

/**
 * 페이지에서 헤더를 설정하는 훅
 * useEffect 내에서 자동으로 설정/정리됨
 */
export function useAdminHeader(config: AdminPageHeaderProps) {
  const setHeader = useAdminHeaderStore((s) => s.setHeader);
  const clearHeader = useAdminHeaderStore((s) => s.clearHeader);

  useEffect(() => {
    setHeader(config);
    return () => clearHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 개별 속성 비교로 무한 루프 방지
  }, [config.breadcrumb, config.title, config.action, config.extra, setHeader, clearHeader]);
}

/**
 * 레이아웃에서 사용 - store에서 값을 읽어 렌더링
 */
export function AdminPageHeaderFromStore() {
  const config = useAdminHeaderStore((s) => s.config);

  if (!config) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarToggle />
        </div>
      </header>
    );
  }

  return <AdminPageHeader {...config} />;
}

/**
 * 직접 props를 전달하여 사용
 */
export function AdminPageHeader({ breadcrumb, title, action, extra }: AdminPageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-4">
        <SidebarToggle />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{breadcrumb}</span>
          <span className="text-muted-foreground">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </span>
          <span className="font-medium text-foreground">{title}</span>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-3">
            {extra}
            {action && (
              <Link href={action.href}>
                <Button className="gap-2">
                  {action.icon && <action.icon className="h-4 w-4" />}
                  {action.label}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
