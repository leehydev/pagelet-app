import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-Demand Revalidation API
 * POST /api/revalidate
 *
 * Body:
 * - siteSlug: 사이트 slug
 * - postSlug?: 게시글 slug (없으면 사이트 전체 revalidate)
 * - secret?: 보안 토큰 (production에서 사용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteSlug, postSlug, secret } = body;

    console.log('[Revalidate] Request received:', { siteSlug, postSlug });

    // Production에서는 secret 검증 (optional)
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret && secret !== revalidateSecret) {
      console.log('[Revalidate] Invalid secret');
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (!siteSlug) {
      return NextResponse.json({ error: 'siteSlug is required' }, { status: 400 });
    }

    // 캐시 무효화할 경로들
    const pathsToRevalidate: string[] = [];
    const tagsToRevalidate: string[] = [];

    if (postSlug) {
      // 특정 게시글 관련 경로
      pathsToRevalidate.push(`/t/${siteSlug}/posts/${postSlug}`);
      pathsToRevalidate.push(`/t/${siteSlug}/posts`);
      pathsToRevalidate.push(`/t/${siteSlug}`);
      // 데이터 캐시 태그
      tagsToRevalidate.push(`post-${siteSlug}-${postSlug}`);
      tagsToRevalidate.push(`posts-${siteSlug}`);
    } else {
      // 사이트 전체 관련 경로
      pathsToRevalidate.push(`/t/${siteSlug}`);
      pathsToRevalidate.push(`/t/${siteSlug}/posts`);
      // 데이터 캐시 태그
      tagsToRevalidate.push(`posts-${siteSlug}`);
    }

    // 데이터 캐시 무효화 (태그 기반)
    // expire: 0 = 즉시 만료 (SWR 없이 바로 적용)
    for (const tag of tagsToRevalidate) {
      console.log('[Revalidate] Revalidating tag:', tag);
      revalidateTag(tag, { expire: 0 });
    }

    // 페이지 캐시 무효화 (경로 기반)
    // 동적 세그먼트가 있는 경로는 'page' 타입 지정
    for (const path of pathsToRevalidate) {
      console.log('[Revalidate] Revalidating path:', path);
      revalidatePath(path, 'page');
    }

    console.log('[Revalidate] Success - tags:', tagsToRevalidate, 'paths:', pathsToRevalidate);

    return NextResponse.json({
      success: true,
      revalidatedTags: tagsToRevalidate,
      revalidatedPaths: pathsToRevalidate,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json({ error: 'Failed to revalidate' }, { status: 500 });
  }
}
