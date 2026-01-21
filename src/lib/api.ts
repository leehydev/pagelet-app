import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러 시 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const PostStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  accountStatus: AccountStatus;
  onboardingStep: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: PostStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
}

export interface SiteSettings {
  id: string;
  name: string;
  slug: string;
  // 브랜딩
  logo_image_url: string | null;
  favicon_url: string | null;
  // SEO
  og_image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_base_url: string | null;
  robots_index: boolean;
  // 연락처
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  // 소셜 링크
  kakao_channel_url: string | null;
  naver_map_url: string | null;
  instagram_url: string | null;
  // 사업자 정보
  business_number: string | null;
  business_name: string | null;
  representative_name: string | null;
}

export interface UpdateSiteSettingsRequest {
  logo_image_url?: string | null;
  favicon_url?: string | null;
  og_image_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_base_url?: string | null;
  robots_index?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  kakao_channel_url?: string | null;
  naver_map_url?: string | null;
  instagram_url?: string | null;
  business_number?: string | null;
  business_name?: string | null;
  representative_name?: string | null;
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  published_at: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// API functions
export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<void> {
  await api.post('/onboarding/profile', data);
}

export interface CreateSiteRequest {
  name: string;
  slug: string;
}

export async function createSite(data: CreateSiteRequest): Promise<void> {
  await api.post('/onboarding/site', data);
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/sites/check-slug?slug=${encodeURIComponent(slug)}`
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

export interface CreatePostRequest {
  title: string;
  content: string;
  slug?: string;
  status?: PostStatus;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
  category_id?: string;
}

export async function createPost(data: CreatePostRequest): Promise<void> {
  await api.post('/posts', data);
}

export async function skipFirstPost(): Promise<void> {
  await api.post('/onboarding/skip-first-post');
}

export async function completeOnboarding(): Promise<void> {
  await api.post('/onboarding/complete');
}

// ===== Admin Post API =====

export async function createAdminPost(data: CreatePostRequest): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>('/admin/posts', data);
  return response.data.data;
}

export async function getAdminPosts(categoryId?: string): Promise<PostListItem[]> {
  const response = await api.get<ApiResponse<PostListItem[]>>('/admin/posts', {
    params: categoryId ? { category_id: categoryId } : {},
  });
  return response.data.data;
}

export async function checkPostSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/admin/posts/check-slug`,
      { params: { slug } }
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

// ===== Public Post API =====

export async function getPublicPosts(siteSlug: string, categorySlug?: string): Promise<PublicPost[]> {
  const params: { site_slug: string; category_slug?: string } = { site_slug: siteSlug };
  if (categorySlug) {
    params.category_slug = categorySlug;
  }
  const response = await api.get<ApiResponse<PublicPost[]>>('/public/posts', { params });
  return response.data.data;
}

export async function getPublicPostBySlug(siteSlug: string, postSlug: string): Promise<PublicPost> {
  const response = await api.get<ApiResponse<PublicPost>>(`/public/posts/${postSlug}`, {
    params: { site_slug: siteSlug },
  });
  return response.data.data;
}

// Server-side fetch for ISR (without axios interceptors)
export async function fetchPublicPosts(siteSlug: string, categorySlug?: string): Promise<PublicPost[]> {
  const params = new URLSearchParams({ site_slug: siteSlug });
  if (categorySlug) {
    params.append('category_slug', categorySlug);
  }
  const res = await fetch(`${API_BASE_URL}/public/posts?${params.toString()}`, {
    next: { revalidate: 60 }, // ISR: 60초
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }
  
  const data: ApiResponse<PublicPost[]> = await res.json();
  return data.data;
}

// ===== Site Settings API (Admin) =====

export async function getMySiteSettings(): Promise<SiteSettings | null> {
  const response = await api.get<ApiResponse<SiteSettings | null>>('/site-settings');
  return response.data.data;
}

export async function updateMySiteSettings(data: UpdateSiteSettingsRequest): Promise<SiteSettings> {
  const response = await api.put<ApiResponse<SiteSettings>>('/site-settings', data);
  return response.data.data;
}

export async function getSiteSettingsBySlug(slug: string): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>(`/sites/${encodeURIComponent(slug)}/settings`);
  return response.data.data;
}

// Server-side fetch for ISR (without axios interceptors)
// X-Site-Slug 헤더를 사용하여 /public/site-settings 호출
export async function fetchSiteSettings(slug: string): Promise<SiteSettings> {
  const res = await fetch(`${API_BASE_URL}/public/site-settings`, {
    headers: {
      'X-Site-Slug': slug,
    },
    next: { revalidate: 60 }, // ISR: 60초
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch site settings: ${res.status}`);
  }
  
  const data: ApiResponse<SiteSettings> = await res.json();
  return data.data;
}

// ===== Upload API =====

export type PostImageType = 'THUMBNAIL' | 'CONTENT' | 'GALLERY';

export interface PresignUploadRequest {
  filename: string;
  size: number;
  mimeType: string;
  imageType?: PostImageType;
  postId?: string;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  s3Key: string;
  maxSize: number;
  imageId: string;
}

export interface CompleteUploadRequest {
  s3Key: string;
  postId?: string;
  imageType?: PostImageType;
}

export interface CompleteUploadResponse {
  imageId: string;
  publicUrl: string;
}

export interface AbortUploadRequest {
  s3Key: string;
}

/**
 * Presigned URL 생성 요청
 */
export async function presignUpload(data: PresignUploadRequest): Promise<PresignUploadResponse> {
  const response = await api.post<ApiResponse<PresignUploadResponse>>('/uploads/presign', data);
  return response.data.data;
}

/**
 * 업로드 완료 확정
 */
export async function completeUpload(data: CompleteUploadRequest): Promise<CompleteUploadResponse> {
  const response = await api.post<ApiResponse<CompleteUploadResponse>>('/uploads/complete', data);
  return response.data.data;
}

/**
 * 업로드 중단
 */
export async function abortUpload(data: AbortUploadRequest): Promise<void> {
  await api.post('/uploads/abort', data);
}

// ===== Category API =====

export interface Category {
  id: string;
  site_id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  post_count?: number;
}

export interface PublicCategory {
  slug: string;
  name: string;
  description: string | null;
  post_count?: number;
}

export interface CreateCategoryRequest {
  slug: string;
  name: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateCategoryRequest {
  slug?: string;
  name?: string;
  description?: string;
  sort_order?: number;
}

// ===== Admin Category API =====

export async function getAdminCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>('/admin/categories');
  return response.data.data;
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>('/admin/categories', data);
  return response.data.data;
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const response = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
  return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/admin/categories/${id}`);
}

// ===== Public Category API =====

export async function getPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const response = await api.get<ApiResponse<PublicCategory[]>>('/public/categories', {
    params: { site_slug: siteSlug },
  });
  return response.data.data;
}

// Server-side fetch for ISR (without axios interceptors)
export async function fetchPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const res = await fetch(
    `${API_BASE_URL}/public/categories?site_slug=${encodeURIComponent(siteSlug)}`,
    {
      next: { revalidate: 60 }, // ISR: 60초
    }
  );
  
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }
  
  const data: ApiResponse<PublicCategory[]> = await res.json();
  return data.data;
}
