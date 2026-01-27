'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * 네비게이션 스택 Store
 *
 * 현재 비활성화 상태입니다.
 * 활성화하려면:
 * 1. app/layout.tsx에서 NavigationTracker 주석 해제
 * 2. src/components/NavigationTracker.tsx에서 pushIfNeeded 호출 주석 해제
 * 3. src/hooks/use-app-back.ts에서 네비게이션 스택 로직 주석 해제
 *
 * 사용 사례:
 * - 복잡한 마법사 플로우에서 뒤로가기 지원
 * - 깊은 중첩 네비게이션 관리
 * - 모달/드로어 기반 네비게이션
 */

export type NavEntry = {
  url: string; // "/posts/123?tab=a"
  ts: number;
};

type NavStackState = {
  stack: NavEntry[];
  lastUrl: string | null; // 직전 URL 캐시
  poppedUrl: string | null; // pop()으로 반환된 URL (뒤로가기로 이동할 URL)
  pushIfNeeded: (currentUrl: string, prevUrl: string | null) => void;
  pop: () => NavEntry | null;
  reset: () => void;
};

const MAX = 20;

// 쌓지 않을 URL 규칙(필수)
const shouldIgnore = (url: string) => {
  return (
    url.startsWith('/oauth/') ||
    url.startsWith('/verify-email') ||
    url.startsWith('/api/') ||
    url === '/signin' ||
    url === '/login' ||
    url === '/auth/'
  );
};

export const useNavStack = create<NavStackState>()(
  persist(
    (set, get) => ({
      stack: [],
      lastUrl: null,
      poppedUrl: null,

      pushIfNeeded: (currentUrl, prevUrl) => {
        // 현재 URL이 pop()으로 반환된 URL과 같으면 뒤로가기로 이동한 것이므로 스택에 추가하지 않음
        const poppedUrl = get().poppedUrl;
        if (poppedUrl === currentUrl) {
          set({ poppedUrl: null });
          return;
        }

        if (!prevUrl) return;
        if (prevUrl === currentUrl) return;
        if (shouldIgnore(prevUrl) || shouldIgnore(currentUrl)) return;

        // 중복 연속 push 방지
        const stack = get().stack;
        if (stack.length && stack[stack.length - 1].url === prevUrl) return;

        const next = [...stack, { url: prevUrl, ts: Date.now() }].slice(-MAX);
        set({ stack: next });
      },

      pop: () => {
        const s = get().stack;
        if (!s.length) return null;
        const last = s[s.length - 1];
        set({ stack: s.slice(0, -1), poppedUrl: last.url });
        return last;
      },

      reset: () => set({ stack: [], lastUrl: null, poppedUrl: null }),
    }),
    {
      name: 'nav-stack',
      storage: createJSONStorage(() => sessionStorage), // 새로고침 유지, 탭 닫으면 삭제
      partialize: (state) => ({ stack: state.stack }), // lastUrl은 굳이 영속화 안 해도 됨
    },
  ),
);
