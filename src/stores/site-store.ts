import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface SiteState {
  currentSiteId: string | null;
}

interface SiteActions {
  setCurrentSiteId: (siteId: string | null) => void;
}

type SiteStore = SiteState & SiteActions;

/**
 * Site 상태 관리 스토어
 * URL에서 siteId를 제거하기 위한 중앙 집중식 상태 관리
 * localStorage에 persist하여 새로고침 후에도 상태 유지
 */
export const useSiteStore = create<SiteStore>()(
  devtools(
    persist(
      (set) => ({
        currentSiteId: null,

        setCurrentSiteId: (siteId) => set({ currentSiteId: siteId }),
      }),
      {
        name: 'site-store',
        partialize: (state) => ({ currentSiteId: state.currentSiteId }),
      },
    ),
    { name: 'site-store' },
  ),
);

/**
 * 스토어 외부에서 currentSiteId를 가져오는 헬퍼 함수
 * interceptor 등 React 외부에서 사용
 */
export function getCurrentSiteId(): string | null {
  return useSiteStore.getState().currentSiteId;
}

/**
 * 현재 사이트 ID를 가져오는 hook
 * Admin 페이지에서 siteId가 필요할 때 사용
 * @throws Error if currentSiteId is null
 */
export function useSiteId(): string {
  const currentSiteId = useSiteStore((state) => state.currentSiteId);
  if (!currentSiteId) {
    throw new Error('useSiteId: currentSiteId is not set. Make sure you are within AdminLayout.');
  }
  return currentSiteId;
}
