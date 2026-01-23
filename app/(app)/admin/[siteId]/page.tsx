'use client';

import { useParams } from 'next/navigation';
import { Eye, Users, MousePointerClick, TrendingUp } from 'lucide-react';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';
import { StatCard } from '@/components/app/dashboard/StatCard';
import { PostStatsTable } from '@/components/app/dashboard/PostStatsTable';
import { useAdminAnalytics } from '@/hooks/use-admin-analytics';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 개요 카드 스켈레톤 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <Skeleton className="h-4 w-20 mb-4" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
      {/* 테이블 스켈레톤 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardError() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-700">통계 데이터를 불러올 수 없습니다.</p>
      <p className="text-sm text-red-500 mt-1">잠시 후 다시 시도해주세요.</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const { overview, posts, isLoading, isError } = useAdminAnalytics(siteId);

  // 오늘/어제 방문자 비교 계산
  const calculateVisitorChange = () => {
    if (!overview || overview.yesterdayVisitors === 0) {
      return undefined;
    }
    const changePercent =
      ((overview.todayVisitors - overview.yesterdayVisitors) / overview.yesterdayVisitors) * 100;
    return {
      value: Math.round(changePercent),
      isPositive: changePercent >= 0,
    };
  };

  const visitorChange = calculateVisitorChange();

  return (
    <>
      <AdminPageHeader breadcrumb="Management" title="대시보드" />
      <div className="p-6 space-y-6">
        {isLoading ? (
          <DashboardSkeleton />
        ) : isError ? (
          <DashboardError />
        ) : (
          <>
            {/* 개요 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="총 조회수"
                value={overview?.totalViews ?? 0}
                icon={<Eye className="w-5 h-5" />}
              />
              <StatCard
                title="총 방문자"
                value={overview?.uniqueVisitors ?? 0}
                icon={<Users className="w-5 h-5" />}
              />
              <StatCard
                title="오늘 방문자"
                value={overview?.todayVisitors ?? 0}
                change={visitorChange}
                icon={<TrendingUp className="w-5 h-5" />}
              />
              <StatCard
                title="CTA 클릭 수"
                value={overview?.totalCtaClicks ?? 0}
                icon={<MousePointerClick className="w-5 h-5" />}
              />
            </div>

            {/* 게시글별 통계 테이블 */}
            <PostStatsTable posts={posts ?? []} />
          </>
        )}
      </div>
    </>
  );
}
