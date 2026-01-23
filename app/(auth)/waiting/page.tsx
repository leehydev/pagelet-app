'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function WaitingPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading || !user) return;

    // ACTIVE 상태면 어드민으로 리다이렉트
    if (user.accountStatus === AccountStatus.ACTIVE) {
      router.replace('/admin');
    }
    // ONBOARDING 상태면 온보딩으로 리다이렉트
    if (user.accountStatus === AccountStatus.ONBOARDING) {
      router.replace('/onboarding/profile');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          가입 신청이 완료되었습니다
        </h1>
        <p className="text-gray-600 mb-6">
          현재 베타 서비스 운영 중이므로 관리자 승인 후
          서비스를 이용하실 수 있습니다.
        </p>
        <p className="text-sm text-gray-500">
          승인이 완료되면 등록하신 이메일로 안내드리겠습니다.
        </p>
      </div>
    </div>
  );
}
