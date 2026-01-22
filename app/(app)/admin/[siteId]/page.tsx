'use client';

import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader breadcrumb="Management" title="Dashboard" />
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">대시보드 준비 중</p>
            <p className="text-sm text-gray-400">
              곧 사이트 통계와 요약 정보를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
