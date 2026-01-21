'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api';

const ONBOARDING_PATHS = {
  1: '/onboarding/profile',
  2: '/onboarding/site',
  3: '/onboarding/first-post',
} as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    // 온보딩 상태면 온보딩 페이지로 리다이렉트
    if (user?.accountStatus === AccountStatus.ONBOARDING) {
      const step = user.onboardingStep || 1;
      const path = ONBOARDING_PATHS[step as keyof typeof ONBOARDING_PATHS];
      router.replace(path || '/onboarding/profile');
    }
  }, [user, isLoading, router]);

  // 로딩 중이거나 온보딩 상태면 로딩 UI 표시
  if (isLoading || user?.accountStatus === AccountStatus.ONBOARDING) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex-1 bg-[#f7f7f7]">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
