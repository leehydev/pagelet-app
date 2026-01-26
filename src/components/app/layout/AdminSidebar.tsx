'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, FolderTree, ExternalLink, LogOut, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAdminSidebarStore } from '@/stores/admin-sidebar-store';
import { useAdminSiteSettings } from '@/hooks/use-site-settings';
import { SiteSwitcher } from './SiteSwitcher';
import { removeAccessToken } from '@/lib/api';

const menuItems = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/posts', label: 'Posts', icon: FileText },
  { path: '/categories', label: 'Categories', icon: FolderTree },
  { path: '/banners', label: 'Banners', icon: ImageIcon },
  { path: '/settings', label: 'Site Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const siteId = params.siteId as string;
  const isSidebarOpen = useAdminSidebarStore((s) => s.isSidebarOpen);
  const { data: siteSettings, error: siteSettingsError } = useAdminSiteSettings(siteId);

  // 기본 경로 prefix
  const baseHref = `/admin/${siteId}`;

  // 블로그 full URL 생성 (https://[slug].pagelet-dev.kr 또는 https://[slug].pagelet.kr)
  // 에러 발생 시 조용히 처리 (블로그 URL은 선택적 기능)
  const tenantDomain = process.env.NEXT_PUBLIC_TENANT_DOMAIN || 'pagelet-dev.kr';
  const blogUrl = siteSettings?.slug && !siteSettingsError
    ? `https://${siteSettings.slug}.${tenantDomain}`
    : null;

  const handleLogout = async () => {
    try {
      // Next.js API 라우트로 쿠키 삭제
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      // localStorage 토큰 삭제
      removeAccessToken();
      window.location.href = '/signin';
    }
  };

  const isActive = (path: string) => {
    const fullPath = `${baseHref}${path}`;
    if (path === '') {
      // Dashboard: 정확히 /admin/{siteId}인 경우만
      return pathname === baseHref;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <aside
      className={cn(
        'h-full bg-white border-r flex flex-col transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-60' : 'w-0 overflow-hidden border-r-0',
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b px-4">
        <Link href={baseHref} className="flex items-center">
          <Image
            src="/images/logos/admin_logo_200.png"
            alt="Pagelet"
            width={200}
            height={200}
            className="h-8 w-auto"
            priority
            loading="eager"
          />
        </Link>
      </div>

      {/* Site Switcher */}
      <div className="px-3 py-3 border-b">
        <SiteSwitcher />
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const href = `${baseHref}${item.path}`;
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 내 블로그 보기 + 로그아웃 */}
      <div className="px-3 py-3 border-t space-y-1">
        {blogUrl && (
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">내 블로그 보기</span>
          </a>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">로그아웃</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <p className="text-xs text-muted-foreground text-center">Pagelet v1.0</p>
      </div>
    </aside>
  );
}
