import { ComponentType } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ModalType = 'alert' | 'confirm' | 'custom';

interface BaseModal {
  type: ModalType;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
}

interface AlertModal extends BaseModal {
  type: 'alert';
}

interface ConfirmModal extends BaseModal {
  type: 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomModal extends BaseModal {
  type: 'custom';
  component: ComponentType<{ onClose: () => void }>;
  props?: Record<string, unknown>;
}

type Modal = AlertModal | ConfirmModal | CustomModal;

interface ModalState {
  current: Modal | null;
  queue: Modal[];
}

interface ModalActions {
  alert: (options: Omit<AlertModal, 'type' | 'resolve'>) => Promise<void>;
  confirm: (options: Omit<ConfirmModal, 'type' | 'resolve'>) => Promise<boolean>;
  openCustom: <P extends Record<string, unknown>>(
    component: ComponentType<P & { onClose: () => void }>,
    props?: Omit<P, 'onClose'>,
  ) => Promise<void>;
  close: (result?: boolean) => void;
}

type ModalStore = ModalState & ModalActions;

function enqueueOrShow(state: ModalState, modal: Modal): ModalState {
  if (state.current === null) {
    return { current: modal, queue: state.queue };
  }
  return { current: state.current, queue: [...state.queue, modal] };
}

export const useModalStore = create<ModalStore>()(
  devtools(
    (set, get) => ({
      current: null,
      queue: [],

      alert: (options) => {
        // 중복 내용 방지
        if (
          get().current?.type === 'alert' &&
          get().current?.title === options.title &&
          get().current?.description === options.description
        ) {
          return;
        }

        return new Promise<void>((resolve) => {
          const modal: AlertModal = {
            type: 'alert',
            ...options,
            resolve: () => resolve(),
          };
          set((state) => enqueueOrShow(state, modal));
        });
      },

      confirm: (options) => {
        return new Promise<boolean>((resolve) => {
          const modal: ConfirmModal = {
            type: 'confirm',
            ...options,
            resolve,
          };
          set((state) => enqueueOrShow(state, modal));
        });
      },

      openCustom: (component, props) => {
        return new Promise<void>((resolve) => {
          const modal: CustomModal = {
            type: 'custom',
            component: component as ComponentType<{ onClose: () => void }>,
            props: props as Record<string, unknown>,
            resolve: () => resolve(),
          };
          set((state) => enqueueOrShow(state, modal));
        });
      },

      close: (result = false) => {
        const { current, queue } = get();

        if (current) {
          // confirm 콜백 처리
          if (current.type === 'confirm') {
            if (result) {
              current.onConfirm?.();
            } else {
              current.onCancel?.();
            }
          }

          // Promise resolve
          current.resolve?.(result);
        }

        // 현재 모달 먼저 닫기
        set({ current: null, queue });

        // 큐에 다음 모달이 있으면 약간의 delay 후 표시 (애니메이션 충돌 방지)
        if (queue.length > 0) {
          const [next, ...rest] = queue;
          setTimeout(() => {
            set({ current: next, queue: rest });
          }, 150);
        }
      },
    }),
    { name: 'modal-store' },
  ),
);
