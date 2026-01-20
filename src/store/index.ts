import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Store 타입 정의
interface AppState {
  // 예시 상태 - 실제 사용 시 수정 필요
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// 기본 store (persist 없음)
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
      reset: () => set({ count: 0 }, false, 'reset'),
    }),
    { name: 'AppStore' }
  )
);

// Persist가 필요한 store 예시 (주석 처리)
// export const usePersistedStore = create<PersistedState>()(
//   devtools(
//     persist(
//       (set) => ({
//         // 상태 정의
//       }),
//       {
//         name: 'persisted-store', // localStorage key
//       }
//     ),
//     { name: 'PersistedStore' }
//   )
// );
