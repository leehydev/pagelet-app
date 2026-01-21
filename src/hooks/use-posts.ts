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
  admin: (siteId: string) => [...postKeys.all, 'admin', siteId] as const,
  adminList: (siteId: string) => [...postKeys.admin(siteId), 'list'] as const,
  public: () => [...postKeys.all, 'public'] as const,
  publicList: (siteSlug: string) => [...postKeys.public(), 'list', siteSlug] as const,
};

// ===== Admin Hooks =====

/**
 * Admin 게시글 목록 조회 훅
 */
export function useAdminPosts(siteId: string, categoryId?: string) {
  return useQuery<PostListItem[], AxiosError>({
    queryKey: [...postKeys.adminList(siteId), categoryId || 'all'],
    queryFn: () => getAdminPosts(siteId, categoryId),
    enabled: !!siteId,
  });
}

/**
 * 게시글 생성 mutation 훅
 */
export function useCreatePost(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(siteId, data),
    onSuccess: () => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.adminList(siteId) });
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
