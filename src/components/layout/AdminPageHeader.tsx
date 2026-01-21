'use client';

import Link from 'next/link';
import { Bell, ChevronRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '../ui/sidebar';

interface AdminPageHeaderProps {
  breadcrumb: string;
  title: string;
  action?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
}

export function AdminPageHeader({ breadcrumb, title, action }: AdminPageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{breadcrumb}</span>
          <span className="text-muted-foreground">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </span>
          <span className="font-medium text-foreground">{title}</span>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">알림</span>
            </Button>
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
