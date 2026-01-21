'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, FolderTree } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAdminHeaderStore } from '@/stores/admin-header-store';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isSidebarOpen = useAdminHeaderStore((s) => s.isSidebarOpen);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'h-full bg-white border-r flex flex-col transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-60' : 'w-0 overflow-hidden border-r-0'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-center border-b px-4">
        <Link href="/admin" className="flex items-center">
          <Image
            src="/admin_logo_200.png"
            alt="Pagelet"
            width={200}
            height={200}
            className="h-8 w-auto"
            priority
            loading="eager"
          />
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

      {/* Footer */}
      <div className="px-4 py-3 border-t">
        <p className="text-xs text-muted-foreground text-center">Pagelet v1.0</p>
      </div>
    </aside>
  );
}
