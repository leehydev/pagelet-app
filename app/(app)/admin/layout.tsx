'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useUser } from '@/hooks/use-user';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // 계정 상태 체크 (403/404 시 자동 로그아웃)
  useUser();

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex-1 bg-[#f7f7f7]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
