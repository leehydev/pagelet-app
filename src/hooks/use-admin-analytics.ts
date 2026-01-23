'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsOverview,
  getPostsAnalytics,
  getDailyAnalytics,
  AnalyticsOverview,
  PostAnalytics,
  DailyAnalytics,
} from '@/lib/api';
import { AxiosError } from 'axios';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  admin: (siteId: string) => [...analyticsKeys.all, 'admin', siteId] as const,
  overview: (siteId: string) => [...analyticsKeys.admin(siteId), 'overview'] as const,
  posts: (siteId: string) => [...analyticsKeys.admin(siteId), 'posts'] as const,
  daily: (siteId: string, days: number) => [...analyticsKeys.admin(siteId), 'daily', days] as const,
};

/**
 * 사이트 통계 요약 조회 훅
 */
export function useAnalyticsOverview(siteId: string) {
  return useQuery<AnalyticsOverview, AxiosError>({
    queryKey: analyticsKeys.overview(siteId),
    queryFn: () => getAnalyticsOverview(siteId),
    enabled: !!siteId,
  });
}

/**
 * 게시글별 통계 조회 훅
 */
export function usePostsAnalytics(siteId: string) {
  return useQuery<PostAnalytics[], AxiosError>({
    queryKey: analyticsKeys.posts(siteId),
    queryFn: () => getPostsAnalytics(siteId),
    enabled: !!siteId,
  });
}

/**
 * 일별 통계 추이 조회 훅
 */
export function useDailyAnalytics(siteId: string, days: number = 7) {
  return useQuery<DailyAnalytics[], AxiosError>({
    queryKey: analyticsKeys.daily(siteId, days),
    queryFn: () => getDailyAnalytics(siteId, days),
    enabled: !!siteId,
  });
}

/**
 * 통합 통계 조회 훅
 * 모든 통계 데이터를 한 번에 조회
 */
export function useAdminAnalytics(siteId: string, days: number = 7) {
  const overview = useAnalyticsOverview(siteId);
  const posts = usePostsAnalytics(siteId);
  const daily = useDailyAnalytics(siteId, days);

  return {
    overview: overview.data,
    posts: posts.data,
    daily: daily.data,
    isLoading: overview.isLoading || posts.isLoading || daily.isLoading,
    isError: overview.isError || posts.isError || daily.isError,
    error: overview.error || posts.error || daily.error,
    refetch: () => {
      overview.refetch();
      posts.refetch();
      daily.refetch();
    },
  };
}
