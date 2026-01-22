# Stores 디렉토리

Zustand 클라이언트 상태 관리

## 스토어 목록

### admin-sidebar-store.ts
관리자 사이드바 열기/닫기

```typescript
interface AdminSidebarStore {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}
```

### modal-store.ts
전역 모달 관리

```typescript
interface ModalStore {
  isOpen: boolean;
  content: React.ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}
```

### nav-stack.ts
네비게이션 히스토리 스택

```typescript
interface NavStackStore {
  stack: string[];
  push: (path: string) => void;
  pop: () => string | undefined;
  clear: () => void;
}
```

## 사용 패턴

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useModalStore = create<ModalStore>()(
  devtools(
    (set) => ({
      isOpen: false,
      content: null,
      openModal: (content) => set({ isOpen: true, content }),
      closeModal: () => set({ isOpen: false, content: null }),
    }),
    { name: 'modal-store' }
  )
);
```

```typescript
// 컴포넌트에서 사용
const isOpen = useModalStore((state) => state.isOpen);
const { openModal, closeModal } = useModalStore();
```

## 설계 원칙

- **클라이언트 UI 상태만**: 서버 상태는 React Query
- **비영속**: 새로고침 시 초기화
- **DevTools**: 디버깅용 미들웨어 활성화
