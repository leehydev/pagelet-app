'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAnalyticsOverview,
  getPostsAnalytics,
  getDailyAnalytics,
  getAnalyticsOverviewV2,
  getPostsAnalyticsV2,
  getDailyAnalyticsV2,
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
  adminV2: (siteId: string) => [...analyticsKeys.all, 'admin', 'v2', siteId] as const,
  overviewV2: (siteId: string) => [...analyticsKeys.adminV2(siteId), 'overview'] as const,
  postsV2: (siteId: string) => [...analyticsKeys.adminV2(siteId), 'posts'] as const,
  dailyV2: (siteId: string, days: number) =>
    [...analyticsKeys.adminV2(siteId), 'daily', days] as const,
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

// ===== Admin v2 Hooks (X-Site-Id 헤더 사용) =====

/**
 * 사이트 통계 요약 조회 훅 (v2)
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAnalyticsOverviewV2(siteId: string) {
  return useQuery<AnalyticsOverview, AxiosError>({
    queryKey: analyticsKeys.overviewV2(siteId),
    queryFn: () => getAnalyticsOverviewV2(),
    enabled: !!siteId,
  });
}

/**
 * 게시글별 통계 조회 훅 (v2)
 */
export function usePostsAnalyticsV2(siteId: string) {
  return useQuery<PostAnalytics[], AxiosError>({
    queryKey: analyticsKeys.postsV2(siteId),
    queryFn: () => getPostsAnalyticsV2(),
    enabled: !!siteId,
  });
}

/**
 * 일별 통계 추이 조회 훅 (v2)
 */
export function useDailyAnalyticsV2(siteId: string, days: number = 7) {
  return useQuery<DailyAnalytics[], AxiosError>({
    queryKey: analyticsKeys.dailyV2(siteId, days),
    queryFn: () => getDailyAnalyticsV2(days),
    enabled: !!siteId,
  });
}

/**
 * 통합 통계 조회 훅 (v2)
 */
export function useAdminAnalyticsV2(siteId: string, days: number = 7) {
  const overview = useAnalyticsOverviewV2(siteId);
  const posts = usePostsAnalyticsV2(siteId);
  const daily = useDailyAnalyticsV2(siteId, days);

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
