/**
 * API 공통 타입 정의
 * 서버/클라이언트 양쪽에서 사용
 */

export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  PENDING: 'PENDING', // 가입 대기 (관리자 승인 필요)
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED', // 서비스 이용불가
  WITHDRAWN: 'WITHDRAWN', // 탈퇴
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export const PostStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PRIVATE: 'PRIVATE', // 발행했지만 비공개
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];

// ===== Font Types =====

export type FontKey = 'noto_sans' | 'noto_serif';

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
  adjacentPosts?: AdjacentPost[];
}

// ===== CTA Types =====

export type CtaType = 'text' | 'image';

export interface SiteSettings {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  // 브랜딩
  logoImageUrl: string | null;
  faviconUrl: string | null;
  fontKey: FontKey | null;
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
  // CTA 설정
  ctaEnabled: boolean;
  ctaType: CtaType | null;
  ctaText: string | null;
  ctaImageUrl: string | null;
  ctaLink: string | null;
}

export interface UpdateSiteSettingsRequest {
  logoImageUrl?: string | null;
  faviconUrl?: string | null;
  fontKey?: FontKey | null;
  ogImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
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
  // CTA 설정
  ctaEnabled?: boolean;
  ctaType?: CtaType | null;
  ctaText?: string | null;
  ctaImageUrl?: string | null;
  ctaLink?: string | null;
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

export interface UpdateProfileRequest {
  name: string;
  email: string;
}

export interface CreateSiteRequest {
  name: string;
  slug: string;
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

// ===== Upload Types =====

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

// ===== Branding Types =====

export type BrandingType = 'logo' | 'favicon' | 'og' | 'cta';

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

// ===== Category Types =====

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

// ===== Pagination Types =====

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ===== Admin Site Types =====

export interface AdminSite {
  id: string;
  name: string;
  slug: string;
}

// ===== Banner Types =====

export interface BannerPost {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  ogImageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  status: PostStatus;
}

export interface Banner {
  id: string;
  postId: string;
  post: BannerPost;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBannerPost {
  title: string;
  subtitle: string;
  slug: string;
  ogImageUrl: string | null;
  categoryName: string | null;
  publishedAt: string | null;
}

export interface PublicBanner {
  id: string;
  post: PublicBannerPost;
  displayOrder: number;
}

export interface CreateBannerRequest {
  postId: string;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
  displayOrder?: number;
}

export interface UpdateBannerRequest {
  postId?: string;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  displayOrder?: number;
}

export interface BannerOrderRequest {
  bannerIds: string[];
}

// ===== Post Search Types =====

export interface PostSearchResult {
  id: string;
  title: string;
  subtitle: string;
  ogImageUrl: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  status: string;
}

// ===== Adjacent Post Types =====

export interface AdjacentPost {
  id: string;
  title: string;
  slug: string;
  ogImageUrl: string | null;
  publishedAt: string;
  isCurrent: boolean;
}

// ===== Analytics Types =====

export interface AnalyticsOverview {
  totalViews: number;
  uniqueVisitors: number;
  todayVisitors: number;
  yesterdayVisitors: number;
  totalCtaClicks: number;
  todayCtaClicks: number;
}

export interface PostAnalytics {
  postId: string;
  title: string;
  views: number;
  uniqueVisitors: number;
  ctaClicks: number;
}

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  views: number;
  visitors: number;
  ctaClicks: number;
}
