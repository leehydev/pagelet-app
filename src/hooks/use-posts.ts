'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminPost,
  getAdminPosts,
  getPublicPosts,
  deleteAdminPost,
  updateAdminPost,
  CreatePostRequest,
  UpdatePostRequest,
  PublicPost,
  PaginatedResponse,
  PostListItem,
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
 * Admin 게시글 목록 조회 훅 (페이징 지원)
 */
export function useAdminPosts(
  siteId: string,
  params?: { categoryId?: string; page?: number; limit?: number },
) {
  return useQuery<PaginatedResponse<PostListItem>, AxiosError>({
    queryKey: [...postKeys.adminList(siteId), params?.categoryId || 'all', params?.page || 1],
    queryFn: () => getAdminPosts(siteId, params),
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

/**
 * 게시글 삭제 mutation 훅
 */
export function useDeletePost(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deleteAdminPost(siteId, postId),
    onSuccess: () => {
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to delete post:', error.response?.data);
    },
  });
}

/**
 * 게시글 상태 변경 mutation 훅
 */
export function useUpdatePostStatus(siteId: string, postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePostRequest) => updateAdminPost(siteId, postId, data),
    onSuccess: () => {
      // 게시글 목록 및 단일 게시글 캐시 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.adminList(siteId) });
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', siteId, postId] });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
      console.error('Failed to update post status:', error.response?.data);
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
