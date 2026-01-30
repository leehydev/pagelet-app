'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCategories,
  getPublicCategories,
  createCategory,
  updateCategory,
  deleteCategory,
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
  public: () => [...categoryKeys.all, 'public'] as const,
  publicList: (siteSlug: string) => [...categoryKeys.public(), 'list', siteSlug] as const,
};

// ===== Admin Hooks =====

/**
 * Admin 카테고리 목록 조회 훅
 * siteId는 interceptor가 X-Site-Id 헤더로 자동 주입
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAdminCategories(siteId: string) {
  return useQuery<Category[], AxiosError>({
    queryKey: categoryKeys.adminList(siteId),
    queryFn: () => getAdminCategories(),
    enabled: !!siteId,
  });
}

/**
 * 카테고리 생성 mutation 훅
 */
export function useCreateCategory(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
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
      updateCategory(id, data),
    onSuccess: () => {
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
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList(siteId) });
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
