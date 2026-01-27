'use client';

import { useCallback, useRef } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useModalStore } from '@/stores/modal-store';

export function GlobalModal() {
  const { current, close } = useModalStore();
  const contentRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때 첫 번째 포커스 가능한 요소로 포커스 이동
  const handleOpenAutoFocus = useCallback((e: Event) => {
    e.preventDefault();
    const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, []);

  if (!current) return null;

  const isOpen = !!current;

  if (current.type === 'custom') {
    const CustomComponent = current.component;
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <AlertDialogContent ref={contentRef} onOpenAutoFocus={handleOpenAutoFocus}>
          <CustomComponent onClose={() => close()} {...current.props} />
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent ref={contentRef} onOpenAutoFocus={handleOpenAutoFocus}>
        <AlertDialogHeader>
          {current.title && <AlertDialogTitle>{current.title}</AlertDialogTitle>}
          {current.description && (
            <AlertDialogDescription>{current.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {current.type === 'confirm' && (
            <AlertDialogCancel onClick={() => close(false)}>
              {current.cancelText ?? '취소'}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={() => close(true)}>
            {current.confirmText ?? '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
