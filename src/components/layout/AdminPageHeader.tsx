'use client';

import Link from 'next/link';
import { ChevronRight, LucideIcon, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminSidebarStore } from '@/stores/admin-sidebar-store';

export interface AdminPageHeaderProps {
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
  const toggleSidebar = useAdminSidebarStore((s) => s.toggleSidebar);

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
 * 페이지에서 직접 사용하는 헤더 컴포넌트
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
