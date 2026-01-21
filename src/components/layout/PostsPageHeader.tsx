'use client';

import Link from 'next/link';
import { Bell, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '../ui/sidebar';

export function PostsPageHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Management</span>
          <span className="text-muted-foreground">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </span>
          <span className="font-medium text-foreground">All Posts</span>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">알림</span>
            </Button>
            <Link href="/admin/posts/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
