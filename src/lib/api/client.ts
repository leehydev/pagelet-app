'use client';

/**
 * 클라이언트 사이드 API
 * axios 인스턴스 + 토큰 리프레시 interceptor
 * 브라우저에서만 사용됨
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  User,
  Post,
  PostListItem,
  PublicPost,
  SiteSettings,
  Category,
  PublicCategory,
  AdminSite,
  CreateSiteRequest,
  CreatePostRequest,
  UpdatePostRequest,
  UpdateSiteSettingsRequest,
  PresignUploadRequest,
  PresignUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  AbortUploadRequest,
  BrandingPresignRequest,
  BrandingPresignResponse,
  BrandingCommitRequest,
  BrandingCommitResponse,
  BrandingDeleteResponse,
  BrandingType,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  PaginatedResponse,
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerOrderRequest,
  PostSearchResult,
  AnalyticsOverview,
  PostAnalytics,
  DailyAnalytics,
  PostDraft,
  SaveDraftRequest,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== 토큰 관리 헬퍼 함수 =====

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
}

// Request interceptor - Authorization 헤더 추가
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== 토큰 리프레시 로직 (클라이언트 전용) =====
// 브라우저 탭당 하나의 인스턴스이므로 모듈 레벨 변수 사용 가능

let isRefreshing = false;
let isSessionExpired = false; // 세션 만료 시 모든 리프레시 시도 차단
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor - 401 에러 시 프론트 서버 경유 토큰 리프레시 후 재시도
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러가 아니거나, 이미 재시도한 요청이면 에러 반환
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 이미 세션 만료 처리 중이면 바로 에러 반환 (무한 루프 방지)
    if (isSessionExpired) {
      return Promise.reject(error);
    }

    // 이미 리프레시 중이면 대기열에 추가
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 프론트 서버 경유 토큰 리프레시 요청
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.accessToken) {
        throw new Error('토큰 갱신 실패');
      }

      // 새 accessToken 저장
      setAccessToken(data.accessToken);

      // 대기 중인 요청들 성공 처리
      processQueue(null);

      // 원래 요청 재시도 (새 토큰으로)
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // 세션 만료 플래그 설정 - 이후 모든 리프레시 시도 차단
      isSessionExpired = true;

      // 리프레시 실패 시 대기 중인 요청들 실패 처리
      processQueue(refreshError as Error);

      // 토큰 삭제 및 로그인 페이지로 이동 (이미 /signin이면 리다이렉트 안 함)
      removeAccessToken();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/signin')) {
        window.location.href = '/signin';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ===== Auth API =====

export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

// ===== Onboarding API =====

export async function createSite(data: CreateSiteRequest): Promise<void> {
  await api.post('/onboarding/site', data);
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/sites/check-slug?slug=${encodeURIComponent(slug)}`,
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

export async function createPost(data: CreatePostRequest): Promise<void> {
  await api.post('/posts', data);
}

// ===== Admin Post API =====

export async function createAdminPost(siteId: string, data: CreatePostRequest): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(`/admin/sites/${siteId}/posts`, data);
  return response.data.data;
}

export async function getAdminPosts(
  siteId: string,
  params?: { categoryId?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<PostListItem>> {
  const response = await api.get<ApiResponse<PaginatedResponse<PostListItem>>>(
    `/admin/sites/${siteId}/posts`,
    {
      params: {
        ...(params?.categoryId && { categoryId: params.categoryId }),
        ...(params?.page && { page: params.page }),
        ...(params?.limit && { limit: params.limit }),
      },
    },
  );
  return response.data.data;
}

export async function checkPostSlugAvailability(siteId: string, slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/admin/sites/${siteId}/posts/check-slug`,
      {
        params: { slug },
      },
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

export async function getAdminPost(siteId: string, postId: string): Promise<Post> {
  const response = await api.get<ApiResponse<Post>>(`/admin/sites/${siteId}/posts/${postId}`);
  return response.data.data;
}

export async function updateAdminPost(
  siteId: string,
  postId: string,
  data: UpdatePostRequest,
): Promise<Post> {
  const response = await api.patch<ApiResponse<Post>>(
    `/admin/sites/${siteId}/posts/${postId}`,
    data,
  );
  return response.data.data;
}

export async function deleteAdminPost(siteId: string, postId: string): Promise<void> {
  await api.delete(`/admin/sites/${siteId}/posts/${postId}`);
}

// ===== Admin Draft API =====

export async function getDraft(siteId: string, postId: string): Promise<PostDraft | null> {
  try {
    const response = await api.get<ApiResponse<PostDraft>>(
      `/admin/sites/${siteId}/posts/${postId}/draft`,
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveDraft(
  siteId: string,
  postId: string,
  data: SaveDraftRequest,
): Promise<PostDraft> {
  const response = await api.put<ApiResponse<PostDraft>>(
    `/admin/sites/${siteId}/posts/${postId}/draft`,
    data,
  );
  return response.data.data;
}

export async function deleteDraft(siteId: string, postId: string): Promise<void> {
  await api.delete(`/admin/sites/${siteId}/posts/${postId}/draft`);
}

export async function publishPost(siteId: string, postId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(
    `/admin/sites/${siteId}/posts/${postId}/publish`,
  );
  return response.data.data;
}

export async function republishPost(siteId: string, postId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(
    `/admin/sites/${siteId}/posts/${postId}/republish`,
  );
  return response.data.data;
}

export async function unpublishPost(siteId: string, postId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(
    `/admin/sites/${siteId}/posts/${postId}/unpublish`,
  );
  return response.data.data;
}

// ===== Revalidation API =====

import { revalidatePostAction, revalidateSiteSettingsAction } from './actions';

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

// ===== Site Settings API (Admin) =====

export async function getAdminSiteSettings(siteId: string): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>(`/admin/sites/${siteId}/settings`);
  return response.data.data;
}

export async function updateAdminSiteSettings(
  siteId: string,
  data: UpdateSiteSettingsRequest,
): Promise<SiteSettings> {
  const response = await api.put<ApiResponse<SiteSettings>>(
    `/admin/sites/${siteId}/settings`,
    data,
  );
  return response.data.data;
}

export async function getSiteSettingsBySlug(slug: string): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>(
    `/sites/${encodeURIComponent(slug)}/settings`,
  );
  return response.data.data;
}

// ===== Upload API =====

export async function presignUpload(
  siteId: string,
  data: PresignUploadRequest,
): Promise<PresignUploadResponse> {
  const response = await api.post<ApiResponse<PresignUploadResponse>>(
    `/admin/sites/${siteId}/uploads/presign`,
    data,
  );
  return response.data.data;
}

export async function completeUpload(
  siteId: string,
  data: CompleteUploadRequest,
): Promise<CompleteUploadResponse> {
  const response = await api.post<ApiResponse<CompleteUploadResponse>>(
    `/admin/sites/${siteId}/uploads/complete`,
    data,
  );
  return response.data.data;
}

export async function abortUpload(siteId: string, data: AbortUploadRequest): Promise<void> {
  await api.post(`/admin/sites/${siteId}/uploads/abort`, data);
}

// ===== Branding Asset API =====

export async function presignBrandingUpload(
  siteId: string,
  data: BrandingPresignRequest,
): Promise<BrandingPresignResponse> {
  const response = await api.post<ApiResponse<BrandingPresignResponse>>(
    `/admin/sites/${siteId}/assets/branding/presign`,
    data,
  );
  return response.data.data;
}

export async function commitBrandingUpload(
  siteId: string,
  data: BrandingCommitRequest,
): Promise<BrandingCommitResponse> {
  const response = await api.post<ApiResponse<BrandingCommitResponse>>(
    `/admin/sites/${siteId}/assets/branding/commit`,
    data,
  );
  return response.data.data;
}

export async function deleteBrandingAsset(
  siteId: string,
  type: BrandingType,
): Promise<BrandingDeleteResponse> {
  const response = await api.delete<ApiResponse<BrandingDeleteResponse>>(
    `/admin/sites/${siteId}/assets/branding/${type}`,
  );
  return response.data.data;
}

// ===== Admin Category API =====

export async function getAdminCategories(siteId: string): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>(`/admin/sites/${siteId}/categories`);
  return response.data.data;
}

export async function createCategory(
  siteId: string,
  data: CreateCategoryRequest,
): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>(`/admin/sites/${siteId}/categories`, data);
  return response.data.data;
}

export async function updateCategory(
  siteId: string,
  id: string,
  data: UpdateCategoryRequest,
): Promise<Category> {
  const response = await api.put<ApiResponse<Category>>(
    `/admin/sites/${siteId}/categories/${id}`,
    data,
  );
  return response.data.data;
}

export async function deleteCategory(siteId: string, id: string): Promise<void> {
  await api.delete(`/admin/sites/${siteId}/categories/${id}`);
}

// ===== Public Category API (클라이언트) =====

export async function getPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const response = await api.get<ApiResponse<PublicCategory[]>>('/public/categories', {
    params: { siteSlug: siteSlug },
  });
  return response.data.data;
}

// ===== Admin Site API =====

export async function getAdminSites(): Promise<AdminSite[]> {
  const response = await api.get<ApiResponse<AdminSite[]>>('/admin/sites');
  return response.data.data;
}

// ===== Admin Banner API =====

export async function createBanner(siteId: string, data: CreateBannerRequest): Promise<Banner> {
  const response = await api.post<ApiResponse<Banner>>(`/admin/sites/${siteId}/banners`, data);
  return response.data.data;
}

export async function getAdminBanners(siteId: string): Promise<Banner[]> {
  const response = await api.get<ApiResponse<Banner[]>>(`/admin/sites/${siteId}/banners`);
  return response.data.data;
}

export async function getAdminBanner(siteId: string, bannerId: string): Promise<Banner> {
  const response = await api.get<ApiResponse<Banner>>(`/admin/sites/${siteId}/banners/${bannerId}`);
  return response.data.data;
}

export async function updateBanner(
  siteId: string,
  bannerId: string,
  data: UpdateBannerRequest,
): Promise<Banner> {
  const response = await api.put<ApiResponse<Banner>>(
    `/admin/sites/${siteId}/banners/${bannerId}`,
    data,
  );
  return response.data.data;
}

export async function deleteBanner(siteId: string, bannerId: string): Promise<void> {
  await api.delete(`/admin/sites/${siteId}/banners/${bannerId}`);
}

export async function updateBannerOrder(
  siteId: string,
  data: BannerOrderRequest,
): Promise<Banner[]> {
  const response = await api.put<ApiResponse<Banner[]>>(
    `/admin/sites/${siteId}/banners/order`,
    data,
  );
  return response.data.data;
}

// ===== Post Search API =====

export async function searchPosts(
  siteId: string,
  query: string,
  limit: number = 10,
): Promise<PostSearchResult[]> {
  const response = await api.get<ApiResponse<PostSearchResult[]>>(
    `/admin/sites/${siteId}/posts/search`,
    {
      params: { q: query, limit },
    },
  );
  return response.data.data;
}

// ===== Admin Analytics API =====

export async function getAnalyticsOverview(siteId: string): Promise<AnalyticsOverview> {
  const response = await api.get<ApiResponse<AnalyticsOverview>>(
    `/admin/sites/${siteId}/analytics/overview`,
  );
  return response.data.data;
}

export async function getPostsAnalytics(siteId: string): Promise<PostAnalytics[]> {
  const response = await api.get<ApiResponse<PostAnalytics[]>>(
    `/admin/sites/${siteId}/analytics/posts`,
  );
  return response.data.data;
}

export async function getDailyAnalytics(siteId: string, days: number = 7): Promise<DailyAnalytics[]> {
  const response = await api.get<ApiResponse<DailyAnalytics[]>>(
    `/admin/sites/${siteId}/analytics/daily`,
    {
      params: { days },
    },
  );
  return response.data.data;
}
