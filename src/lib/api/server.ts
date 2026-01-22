/**
 * 서버 사이드 API
 * Next.js 서버 컴포넌트, ISR에서 사용
 * axios interceptor 없이 순수 fetch 사용
 */

import type { ApiResponse, PublicPost, SiteSettings, PublicCategory, PublicBanner, DeviceType } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// ===== Public Post API (서버/ISR) =====

export async function fetchPublicPosts(
  siteSlug: string,
  categorySlug?: string,
): Promise<PublicPost[]> {
  const params = new URLSearchParams({ siteSlug: siteSlug });
  if (categorySlug) {
    params.append('categorySlug', categorySlug);
  }
  const res = await fetch(`${API_BASE_URL}/public/posts?${params.toString()}`, {
    next: {
      revalidate: 60,
      tags: [`posts-${siteSlug}`, categorySlug ? `posts-${siteSlug}-${categorySlug}` : ''].filter(
        Boolean,
      ),
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }

  const data: ApiResponse<PublicPost[]> = await res.json();
  return data.data;
}

export async function fetchPublicPostBySlug(
  siteSlug: string,
  postSlug: string,
): Promise<PublicPost> {
  const res = await fetch(
    `${API_BASE_URL}/public/posts/${encodeURIComponent(postSlug)}?siteSlug=${encodeURIComponent(
      siteSlug,
    )}`,
    {
      next: {
        revalidate: 60,
        tags: [`post-${siteSlug}-${postSlug}`, `posts-${siteSlug}`],
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch post: ${res.status}`);
  }

  const data: ApiResponse<PublicPost> = await res.json();
  return data.data;
}

// ===== Site Settings API (서버/ISR) =====

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

// ===== Public Category API (서버/ISR) =====

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

// ===== Public Banner API (서버/ISR) =====

export async function fetchPublicBanners(
  siteSlug: string,
  deviceType: DeviceType,
): Promise<PublicBanner[]> {
  const params = new URLSearchParams({
    siteSlug,
    deviceType,
  });

  const res = await fetch(`${API_BASE_URL}/public/banners?${params.toString()}`, {
    next: {
      revalidate: 60,
      tags: [`banners-${siteSlug}-${deviceType}`],
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch banners: ${res.status}`);
  }

  const data: ApiResponse<PublicBanner[]> = await res.json();
  return data.data;
}
