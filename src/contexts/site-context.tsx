'use client';

/**
 * Site Context
 *
 * Note: URL에서 siteId를 제거하면서 이 Context는 더 이상 사용하지 않습니다.
 * 대신 @/stores/site-store의 useSiteId()를 사용하세요.
 *
 * 하위 호환성을 위해 이 파일에서도 useSiteId를 re-export합니다.
 */

export { useSiteId, useSiteStore, getCurrentSiteId } from '@/stores/site-store';
