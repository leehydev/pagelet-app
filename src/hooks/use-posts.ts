'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminPost,
  getAdminPosts,
  getPublicPosts,
  deleteAdminPost,
  updatePostStatus,
  searchPosts,
  CreatePostRequest,
  PublicPost,
  PaginatedResponse,
  PostListItem,
  PostSearchResult,
  PostStatus,
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
 * siteId는 interceptor가 X-Site-Id 헤더로 자동 주입
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAdminPosts(
  siteId: string,
  params?: { categoryId?: string; page?: number; limit?: number },
) {
  return useQuery<PaginatedResponse<PostListItem>, AxiosError>({
    queryKey: [...postKeys.adminList(siteId), params?.categoryId || 'all', params?.page || 1],
    queryFn: () => getAdminPosts(params),
    enabled: !!siteId,
  });
}

/**
 * 게시글 생성 mutation 훅
 */
export function useCreatePost(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.adminList(siteId) });
    },
    onError: (error: AxiosError<{ message?: string; code?: string }>) => {
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
    mutationFn: (postId: string) => deleteAdminPost(postId),
    onSuccess: () => {
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
    mutationFn: (status: PostStatus) => {
      // PRIVATE 또는 PUBLISHED만 허용
      if (status !== 'PRIVATE' && status !== 'PUBLISHED') {
        throw new Error('Invalid status. Only PRIVATE or PUBLISHED are allowed.');
      }
      return updatePostStatus(postId, status as 'PRIVATE' | 'PUBLISHED');
    },
    onSuccess: () => {
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

// ===== Search Hooks =====

/**
 * 게시글 검색 훅 (배너 등록용)
 */
export function useSearchPosts(siteId: string, query: string, enabled: boolean = true) {
  return useQuery<PostSearchResult[], AxiosError>({
    queryKey: [...postKeys.admin(siteId), 'search', query],
    queryFn: () => searchPosts(query, 10),
    enabled: !!siteId && !!query && query.length >= 1 && enabled,
    staleTime: 30000, // 30초간 캐시 유지
  });
}
