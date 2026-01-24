'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * ISR 캐시 무효화 Server Action
 * 게시글 상태 변경, 삭제 시 호출
 * 서버에서만 실행되므로 secret 노출 없음
 */
export async function revalidatePostAction(siteSlug: string, postSlug?: string): Promise<void> {
  const tagsToRevalidate: string[] = [];
  const pathsToRevalidate: string[] = [];

  if (postSlug) {
    // 특정 게시글 관련
    pathsToRevalidate.push(`/t/${siteSlug}/posts/${postSlug}`);
    pathsToRevalidate.push(`/t/${siteSlug}/posts`);
    pathsToRevalidate.push(`/t/${siteSlug}`);
    tagsToRevalidate.push(`post-${siteSlug}-${postSlug}`);
    tagsToRevalidate.push(`posts-${siteSlug}`);
    tagsToRevalidate.push(`banners-${siteSlug}`);
  } else {
    // 사이트 전체 관련
    pathsToRevalidate.push(`/t/${siteSlug}`);
    pathsToRevalidate.push(`/t/${siteSlug}/posts`);
    tagsToRevalidate.push(`posts-${siteSlug}`);
    tagsToRevalidate.push(`banners-${siteSlug}`);
    tagsToRevalidate.push(`site-settings-${siteSlug}`);
  }

  // 태그 기반 캐시 무효화 (expire: 0 = 즉시 만료)
  for (const tag of tagsToRevalidate) {
    revalidateTag(tag, { expire: 0 });
  }

  // 경로 기반 캐시 무효화
  for (const path of pathsToRevalidate) {
    revalidatePath(path, 'page');
  }
}

/**
 * 사이트 설정 캐시 무효화 Server Action
 * 폰트, 브랜딩 등 설정 변경 시 호출
 */
export async function revalidateSiteSettingsAction(siteSlug: string): Promise<void> {
  revalidateTag(`site-settings-${siteSlug}`, { expire: 0 });
  revalidateTag(`banners-${siteSlug}`, { expire: 0 });
  revalidatePath(`/t/${siteSlug}`, 'page');
}
