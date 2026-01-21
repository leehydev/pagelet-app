'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex-1 bg-[#f7f7f7]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
