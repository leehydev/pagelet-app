'use client';

/**
 * Post CRUD API, Public Posts, Revalidation
 */

import { api } from './core';
import { revalidatePostAction, revalidateSiteSettingsAction } from '../actions';
import type {
  ApiResponse,
  Post,
  PostListItem,
  PublicPost,
  CreatePostRequest,
  UpdatePostRequest,
  ReplacePostRequest,
  PaginatedResponse,
  PostSearchResult,
} from '../types';

// ===== Admin Post API =====

export async function createAdminPost(data: CreatePostRequest): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>('/admin/posts', data);
  return response.data.data;
}

export async function getAdminPosts(params?: {
  categoryId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PostListItem>> {
  const response = await api.get<ApiResponse<PaginatedResponse<PostListItem>>>('/admin/posts', {
    params: {
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.page && { page: params.page }),
      ...(params?.limit && { limit: params.limit }),
    },
  });
  return response.data.data;
}

export async function checkPostSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>('/admin/posts/check-slug', {
      params: { slug },
    });
    return response.data.data.available;
  } catch {
    return false;
  }
}

export async function getAdminPost(postId: string): Promise<Post> {
  const response = await api.get<ApiResponse<Post>>(`/admin/posts/${postId}`);
  return response.data.data;
}

export async function updateAdminPost(postId: string, data: UpdatePostRequest): Promise<Post> {
  const response = await api.patch<ApiResponse<Post>>(`/admin/posts/${postId}`, data);
  return response.data.data;
}

/**
 * PUT으로 게시글 전체 교체
 * 모든 필드를 명시적으로 전달하여 덮어씁니다.
 * 백엔드에서 draft가 있으면 자동 삭제됩니다.
 */
export async function replaceAdminPost(postId: string, data: ReplacePostRequest): Promise<Post> {
  const response = await api.put<ApiResponse<Post>>(`/admin/posts/${postId}`, data);
  return response.data.data;
}

export async function deleteAdminPost(postId: string): Promise<void> {
  await api.delete(`/admin/posts/${postId}`);
}

/**
 * 게시글 상태 변경 (PRIVATE ↔ PUBLISHED)
 */
export async function updatePostStatus(
  postId: string,
  status: 'PRIVATE' | 'PUBLISHED',
): Promise<Post> {
  const response = await api.patch<ApiResponse<Post>>(`/admin/posts/${postId}/status`, {
    status,
  });
  return response.data.data;
}

// ===== Post Search API =====

export async function searchPosts(query: string, limit: number = 10): Promise<PostSearchResult[]> {
  const response = await api.get<ApiResponse<PostSearchResult[]>>('/admin/posts/search', {
    params: { q: query, limit },
  });
  return response.data.data;
}

// ===== Revalidation API =====

/**
 * ISR 캐시 무효화 요청
 * 게시글 상태 변경, 삭제 시 호출
 * Server Action을 사용하여 secret 노출 없이 처리
 */
export async function revalidatePost(siteSlug: string, postSlug?: string): Promise<void> {
  try {
    await revalidatePostAction(siteSlug, postSlug);
  } catch (error) {
    // Revalidation 실패해도 주요 작업에는 영향 없음
    console.warn('Failed to revalidate:', error);
  }
}

/**
 * 사이트 설정 캐시 무효화
 * 폰트, 브랜딩 등 설정 변경 시 호출
 * Server Action을 사용하여 secret 노출 없이 처리
 */
export async function revalidateSiteSettings(siteSlug: string): Promise<void> {
  try {
    await revalidateSiteSettingsAction(siteSlug);
  } catch (error) {
    console.warn('Failed to revalidate site settings:', error);
  }
}

// ===== Public Post API (클라이언트) =====

export async function getPublicPosts(
  siteSlug: string,
  categorySlug?: string,
): Promise<PublicPost[]> {
  const params: { siteSlug: string; categorySlug?: string } = { siteSlug: siteSlug };
  if (categorySlug) {
    params.categorySlug = categorySlug;
  }
  const response = await api.get<ApiResponse<PublicPost[]>>('/public/posts', { params });
  return response.data.data;
}

export async function getPublicPostBySlug(siteSlug: string, postSlug: string): Promise<PublicPost> {
  const response = await api.get<ApiResponse<PublicPost>>(`/public/posts/${postSlug}`, {
    params: { siteSlug: siteSlug },
  });
  return response.data.data;
}
