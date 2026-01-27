'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCategories,
  getPublicCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminCategoriesV2,
  createCategoryV2,
  updateCategoryV2,
  deleteCategoryV2,
  Category,
  PublicCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/lib/api';
import { AxiosError } from 'axios';
import { postKeys } from './use-posts';

// Query Keys
export const categoryKeys = {
  all: ['categories'] as const,
  admin: (siteId: string) => [...categoryKeys.all, 'admin', siteId] as const,
  adminList: (siteId: string) => [...categoryKeys.admin(siteId), 'list'] as const,
  adminV2: (siteId: string) => [...categoryKeys.all, 'admin', 'v2', siteId] as const,
  adminListV2: (siteId: string) => [...categoryKeys.adminV2(siteId), 'list'] as const,
  public: () => [...categoryKeys.all, 'public'] as const,
  publicList: (siteSlug: string) => [...categoryKeys.public(), 'list', siteSlug] as const,
};

// ===== Admin Hooks =====

/**
 * Admin 카테고리 목록 조회 훅
 */
export function useAdminCategories(siteId: string) {
  return useQuery<Category[], AxiosError>({
    queryKey: categoryKeys.adminList(siteId),
    queryFn: () => getAdminCategories(siteId),
    enabled: !!siteId,
  });
}

/**
 * 카테고리 생성 mutation 훅
 */
export function useCreateCategory(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(siteId, data),
    onSuccess: () => {
      // 카테고리 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to create category:', error.response?.data);
    },
  });
}

/**
 * 카테고리 수정 mutation 훅
 */
export function useUpdateCategory(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory(siteId, id, data),
    onSuccess: () => {
      // 카테고리 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update category:', error.response?.data);
    },
  });
}

/**
 * 카테고리 삭제 mutation 훅
 */
export function useDeleteCategory(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(siteId, id),
    onSuccess: () => {
      // 카테고리 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList(siteId) });
      // 게시글 목록도 무효화 (카테고리 필터에 영향)
      queryClient.invalidateQueries({ queryKey: postKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to delete category:', error.response?.data);
    },
  });
}

// ===== Public Hooks (CSR용) =====

/**
 * Public 카테고리 목록 조회 훅 (CSR용)
 */
export function usePublicCategories(siteSlug: string) {
  return useQuery<PublicCategory[], AxiosError>({
    queryKey: categoryKeys.publicList(siteSlug),
    queryFn: () => getPublicCategories(siteSlug),
    enabled: !!siteSlug,
  });
}

// ===== Admin v2 Hooks (X-Site-Id 헤더 사용) =====

/**
 * Admin 카테고리 목록 조회 훅 (v2)
 * siteId는 interceptor가 X-Site-Id 헤더로 자동 주입
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAdminCategoriesV2(siteId: string) {
  return useQuery<Category[], AxiosError>({
    queryKey: categoryKeys.adminListV2(siteId),
    queryFn: () => getAdminCategoriesV2(),
    enabled: !!siteId,
  });
}

/**
 * 카테고리 생성 mutation 훅 (v2)
 */
export function useCreateCategoryV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategoryV2(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminListV2(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to create category:', error.response?.data);
    },
  });
}

/**
 * 카테고리 수정 mutation 훅 (v2)
 */
export function useUpdateCategoryV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategoryV2(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminListV2(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update category:', error.response?.data);
    },
  });
}

/**
 * 카테고리 삭제 mutation 훅 (v2)
 */
export function useDeleteCategoryV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategoryV2(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminListV2(siteId) });
      queryClient.invalidateQueries({ queryKey: postKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to delete category:', error.response?.data);
    },
  });
}
