'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminPost,
  getAdminPosts,
  getPublicPosts,
  CreatePostRequest,
  PostListItem,
  PublicPost,
} from '@/lib/api';
import { AxiosError } from 'axios';

// Query Keys
export const postKeys = {
  all: ['posts'] as const,
  admin: () => [...postKeys.all, 'admin'] as const,
  adminList: () => [...postKeys.admin(), 'list'] as const,
  public: () => [...postKeys.all, 'public'] as const,
  publicList: (siteSlug: string) => [...postKeys.public(), 'list', siteSlug] as const,
};

// ===== Admin Hooks =====

/**
 * Admin 게시글 목록 조회 훅
 */
export function useAdminPosts(categoryId?: string) {
  return useQuery<PostListItem[], AxiosError>({
    queryKey: [...postKeys.adminList(), categoryId || 'all'],
    queryFn: () => getAdminPosts(categoryId),
  });
}

/**
 * 게시글 생성 mutation 훅
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(data),
    onSuccess: () => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.adminList() });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      // 에러는 컴포넌트에서 처리
      console.error('Failed to create post:', error.response?.data);
    },
  });
}

// ===== Public Hooks (CSR용) =====

/**
 * Public 게시글 목록 조회 훅 (CSR용)
 */
export function usePublicPosts(siteSlug: string, categorySlug?: string) {
  return useQuery<PublicPost[], AxiosError>({
    queryKey: [...postKeys.publicList(siteSlug), categorySlug || 'all'],
    queryFn: () => getPublicPosts(siteSlug, categorySlug),
    enabled: !!siteSlug,
  });
}
