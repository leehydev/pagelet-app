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

// Query Keys
export const categoryKeys = {
  all: ['categories'] as const,
  admin: () => [...categoryKeys.all, 'admin'] as const,
  adminList: () => [...categoryKeys.admin(), 'list'] as const,
  public: () => [...categoryKeys.all, 'public'] as const,
  publicList: (siteSlug: string) => [...categoryKeys.public(), 'list', siteSlug] as const,
};

// ===== Admin Hooks =====

/**
 * Admin 카테고리 목록 조회 훅
 */
export function useAdminCategories() {
  return useQuery<Category[], AxiosError>({
    queryKey: categoryKeys.adminList(),
    queryFn: getAdminCategories,
  });
}

/**
 * 카테고리 생성 mutation 훅
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      // 카테고리 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList() });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to create category:', error.response?.data);
    },
  });
}

/**
 * 카테고리 수정 mutation 훅
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      updateCategory(id, data),
    onSuccess: () => {
      // 카테고리 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList() });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update category:', error.response?.data);
    },
  });
}

/**
 * 카테고리 삭제 mutation 훅
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      // 카테고리 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: categoryKeys.adminList() });
      // 게시글 목록도 무효화 (카테고리 필터에 영향)
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', 'list'] });
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
