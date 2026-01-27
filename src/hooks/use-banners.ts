'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminBanners,
  getAdminBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerOrder,
  getAdminBannersV2,
  getAdminBannerV2,
  createBannerV2,
  updateBannerV2,
  deleteBannerV2,
  updateBannerOrderV2,
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerOrderRequest,
} from '@/lib/api';
import { AxiosError } from 'axios';

// Query Keys
export const bannerKeys = {
  all: ['banners'] as const,
  admin: (siteId: string) => [...bannerKeys.all, 'admin', siteId] as const,
  adminList: (siteId: string) => [...bannerKeys.admin(siteId), 'list'] as const,
  adminDetail: (siteId: string, bannerId: string) =>
    [...bannerKeys.admin(siteId), 'detail', bannerId] as const,
  adminV2: (siteId: string) => [...bannerKeys.all, 'admin', 'v2', siteId] as const,
  adminListV2: (siteId: string) => [...bannerKeys.adminV2(siteId), 'list'] as const,
  adminDetailV2: (siteId: string, bannerId: string) =>
    [...bannerKeys.adminV2(siteId), 'detail', bannerId] as const,
};

// ===== Admin Hooks =====

/**
 * Admin 배너 목록 조회 훅
 */
export function useAdminBanners(siteId: string) {
  return useQuery<Banner[], AxiosError>({
    queryKey: bannerKeys.adminList(siteId),
    queryFn: () => getAdminBanners(siteId),
    enabled: !!siteId,
  });
}

/**
 * Admin 배너 상세 조회 훅
 */
export function useAdminBanner(siteId: string, bannerId: string) {
  return useQuery<Banner, AxiosError>({
    queryKey: bannerKeys.adminDetail(siteId, bannerId),
    queryFn: () => getAdminBanner(siteId, bannerId),
    enabled: !!siteId && !!bannerId,
  });
}

/**
 * 배너 생성 mutation 훅
 */
export function useCreateBanner(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerRequest) => createBanner(siteId, data),
    onSuccess: () => {
      // 배너 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: bannerKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to create banner:', error.response?.data);
    },
  });
}

/**
 * 배너 수정 mutation 훅
 */
export function useUpdateBanner(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bannerId, data }: { bannerId: string; data: UpdateBannerRequest }) =>
      updateBanner(siteId, bannerId, data),
    onSuccess: (_, variables) => {
      // 배너 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: bannerKeys.adminDetail(siteId, variables.bannerId),
      });
      // 배너 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: bannerKeys.admin(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update banner:', error.response?.data);
    },
  });
}

/**
 * 배너 삭제 mutation 훅
 */
export function useDeleteBanner(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bannerId: string) => deleteBanner(siteId, bannerId),
    onSuccess: () => {
      // 배너 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: bannerKeys.admin(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to delete banner:', error.response?.data);
    },
  });
}

/**
 * 배너 순서 변경 mutation 훅
 */
export function useUpdateBannerOrder(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BannerOrderRequest) => updateBannerOrder(siteId, data),
    onSuccess: () => {
      // 배너 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: bannerKeys.adminList(siteId),
      });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update banner order:', error.response?.data);
    },
  });
}

// ===== Admin v2 Hooks (X-Site-Id 헤더 사용) =====

/**
 * Admin 배너 목록 조회 훅 (v2)
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAdminBannersV2(siteId: string) {
  return useQuery<Banner[], AxiosError>({
    queryKey: bannerKeys.adminListV2(siteId),
    queryFn: () => getAdminBannersV2(),
    enabled: !!siteId,
  });
}

/**
 * Admin 배너 상세 조회 훅 (v2)
 */
export function useAdminBannerV2(siteId: string, bannerId: string) {
  return useQuery<Banner, AxiosError>({
    queryKey: bannerKeys.adminDetailV2(siteId, bannerId),
    queryFn: () => getAdminBannerV2(bannerId),
    enabled: !!siteId && !!bannerId,
  });
}

/**
 * 배너 생성 mutation 훅 (v2)
 */
export function useCreateBannerV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerRequest) => createBannerV2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.adminListV2(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to create banner:', error.response?.data);
    },
  });
}

/**
 * 배너 수정 mutation 훅 (v2)
 */
export function useUpdateBannerV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bannerId, data }: { bannerId: string; data: UpdateBannerRequest }) =>
      updateBannerV2(bannerId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: bannerKeys.adminDetailV2(siteId, variables.bannerId),
      });
      queryClient.invalidateQueries({ queryKey: bannerKeys.adminV2(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update banner:', error.response?.data);
    },
  });
}

/**
 * 배너 삭제 mutation 훅 (v2)
 */
export function useDeleteBannerV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bannerId: string) => deleteBannerV2(bannerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bannerKeys.adminV2(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to delete banner:', error.response?.data);
    },
  });
}

/**
 * 배너 순서 변경 mutation 훅 (v2)
 */
export function useUpdateBannerOrderV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BannerOrderRequest) => updateBannerOrderV2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bannerKeys.adminListV2(siteId),
      });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update banner order:', error.response?.data);
    },
  });
}
