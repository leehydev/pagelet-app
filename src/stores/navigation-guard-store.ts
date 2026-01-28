'use client';

/**
 * 네비게이션 가드 스토어
 * 페이지 이탈 시 확인이 필요한 경우 네비게이션을 차단
 */

import { create } from 'zustand';

interface NavigationGuardState {
  /** 저장되지 않은 변경사항 존재 여부 */
  hasUnsavedChanges: boolean;
  /** 네비게이션 시도 시 호출될 콜백 (경로 전달) */
  onNavigationAttempt: ((path: string) => void) | null;
}

interface NavigationGuardActions {
  /** 가드 활성화 */
  setGuard: (onNavigationAttempt: (path: string) => void) => void;
  /** 변경사항 상태 업데이트 */
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  /** 가드 해제 */
  clearGuard: () => void;
}

export const useNavigationGuardStore = create<NavigationGuardState & NavigationGuardActions>(
  (set) => ({
    hasUnsavedChanges: false,
    onNavigationAttempt: null,

    setGuard: (onNavigationAttempt) => set({ onNavigationAttempt }),

    setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

    clearGuard: () => set({ hasUnsavedChanges: false, onNavigationAttempt: null }),
  }),
);
