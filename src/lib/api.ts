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
  },
);

// Types
export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED', // 서비스 이용불가
  WITHDRAWN: 'WITHDRAWN', // 탈퇴
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
  subtitle: string;
  slug: string;
  content: string | null; // Deprecated: 하위 호환성
  contentJson: Record<string, unknown> | null;
  contentHtml: string | null;
  contentText: string | null;
  status: PostStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPost {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string | null; // Deprecated: 하위 호환성
  contentJson: Record<string, unknown> | null;
  contentHtml: string | null;
  contentText: string | null;
  publishedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

export interface SiteSettings {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  // 브랜딩
  logoImageUrl: string | null;
  faviconUrl: string | null;
  // SEO
  ogImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalBaseUrl: string | null;
  robotsIndex: boolean;
  // 연락처
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  // 소셜 링크
  kakaoChannelUrl: string | null;
  naverMapUrl: string | null;
  instagramUrl: string | null;
  // 사업자 정보
  businessNumber: string | null;
  businessName: string | null;
  representativeName: string | null;
}

export interface UpdateSiteSettingsRequest {
  logoImageUrl?: string | null;
  faviconUrl?: string | null;
  ogImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalBaseUrl?: string | null;
  robotsIndex?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  kakaoChannelUrl?: string | null;
  naverMapUrl?: string | null;
  instagramUrl?: string | null;
  businessNumber?: string | null;
  businessName?: string | null;
  representativeName?: string | null;
}

export interface PostListItem {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  status: PostStatus;
  publishedAt: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  createdAt: string;
  categoryId: string | null;
  categoryName: string | null;
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
      `/sites/check-slug?slug=${encodeURIComponent(slug)}`,
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

export interface CreatePostRequest {
  title: string;
  subtitle: string;
  content?: string; // Deprecated: 하위 호환성
  contentJson: Record<string, unknown>;
  contentHtml?: string;
  contentText?: string;
  slug?: string;
  status?: PostStatus;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  categoryId?: string;
}

export interface UpdatePostRequest {
  title?: string;
  subtitle?: string;
  content?: string; // Deprecated: 하위 호환성
  contentJson?: Record<string, unknown>;
  contentHtml?: string;
  contentText?: string;
  slug?: string;
  status?: PostStatus;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  categoryId?: string;
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

export async function createAdminPost(siteId: string, data: CreatePostRequest): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(`/admin/sites/${siteId}/posts`, data);
  return response.data.data;
}

export async function getAdminPosts(siteId: string, categoryId?: string): Promise<PostListItem[]> {
  const response = await api.get<ApiResponse<PostListItem[]>>(`/admin/sites/${siteId}/posts`, {
    params: categoryId ? { categoryId: categoryId } : {},
  });
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

// ===== Public Post API =====

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

// Server-side fetch for ISR (without axios interceptors)
export async function fetchPublicPosts(
  siteSlug: string,
  categorySlug?: string,
): Promise<PublicPost[]> {
  const params = new URLSearchParams({ siteSlug: siteSlug });
  if (categorySlug) {
    params.append('categorySlug', categorySlug);
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

// Server-side fetch for ISR - 게시글 단건 조회 (slug 기반)
export async function fetchPublicPostBySlug(
  siteSlug: string,
  postSlug: string,
): Promise<PublicPost> {
  const res = await fetch(
    `${API_BASE_URL}/public/posts/${encodeURIComponent(postSlug)}?siteSlug=${encodeURIComponent(
      siteSlug,
    )}`,
    {
      next: { revalidate: 60 }, // ISR: 60초
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status}`);
  }

  const data: ApiResponse<PublicPost> = await res.json();
  return data.data;
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
  const response = await api.put<ApiResponse<SiteSettings>>(`/admin/sites/${siteId}/settings`, data);
  return response.data.data;
}

export async function getSiteSettingsBySlug(slug: string): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>(
    `/sites/${encodeURIComponent(slug)}/settings`,
  );
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

/**
 * 업로드 완료 확정
 */
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

/**
 * 업로드 중단
 */
export async function abortUpload(siteId: string, data: AbortUploadRequest): Promise<void> {
  await api.post(`/admin/sites/${siteId}/uploads/abort`, data);
}

// ===== Branding Asset API =====

export type BrandingType = 'logo' | 'favicon' | 'og';

export interface BrandingPresignRequest {
  type: BrandingType;
  filename: string;
  size: number;
  mimeType: string;
}

export interface BrandingPresignResponse {
  uploadUrl: string;
  tmpPublicUrl: string;
  tmpKey: string;
}

export interface BrandingCommitRequest {
  type: BrandingType;
  tmpKey: string;
}

export interface BrandingCommitResponse {
  publicUrl: string;
  updatedAt: string;
}

/**
 * 브랜딩 에셋 Presigned URL 생성
 */
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

/**
 * 브랜딩 에셋 업로드 확정
 */
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

// ===== Category API =====

export interface Category {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  postCount?: number;
}

export interface PublicCategory {
  slug: string;
  name: string;
  description: string | null;
  postCount?: number;
}

export interface CreateCategoryRequest {
  slug: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  slug?: string;
  name?: string;
  description?: string;
  sortOrder?: number;
}

// ===== Admin Category API =====

export async function getAdminCategories(siteId: string): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>(`/admin/sites/${siteId}/categories`);
  return response.data.data;
}

export async function createCategory(siteId: string, data: CreateCategoryRequest): Promise<Category> {
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

// ===== Public Category API =====

export async function getPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const response = await api.get<ApiResponse<PublicCategory[]>>('/public/categories', {
    params: { siteSlug: siteSlug },
  });
  return response.data.data;
}

// Server-side fetch for ISR (without axios interceptors)
export async function fetchPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const res = await fetch(
    `${API_BASE_URL}/public/categories?siteSlug=${encodeURIComponent(siteSlug)}`,
    {
      next: { revalidate: 60 }, // ISR: 60초
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }

  const data: ApiResponse<PublicCategory[]> = await res.json();
  return data.data;
}

// ===== Admin Site API =====

export interface AdminSite {
  id: string;
  name: string;
  slug: string;
}

export async function getAdminSites(): Promise<AdminSite[]> {
  const response = await api.get<ApiResponse<AdminSite[]>>('/admin/sites');
  return response.data.data;
}
