'use client';

/**
 * 페이지 이탈 감지 훅
 * 작성 중인 내용이 있을 때 이탈 시 경고 표시
 */

import { useEffect, useCallback, useRef, useState } from 'react';

export type EditorMode = 'create' | 'edit-draft' | 'edit-post';

interface UseLeaveConfirmOptions {
  /** 변경사항 존재 여부 */
  hasChanges: boolean;
  /** 에디터 모드 */
  mode: EditorMode;
  /** 이탈 확인 모달을 표시할 콜백 */
  onShowConfirm?: () => void;
}

interface UseLeaveConfirmReturn {
  /** 이탈 허용 (저장 후 또는 저장하지 않고 나가기) */
  allowLeave: () => void;
  /** 이탈 차단 상태 리셋 */
  resetLeaveState: () => void;
  /** 현재 이탈이 허용된 상태인지 */
  isLeaveAllowed: boolean;
}

/**
 * 페이지 이탈 감지 및 경고 훅
 *
 * @example
 * ```tsx
 * const { allowLeave, isLeaveAllowed } = useLeaveConfirm({
 *   hasChanges,
 *   mode: 'create',
 *   onShowConfirm: () => setShowModal(true),
 * });
 *
 * // 저장 후 이탈
 * const handleSaveAndLeave = async () => {
 *   await saveDraft();
 *   allowLeave();
 *   router.push('/admin/posts');
 * };
 * ```
 */
export function useLeaveConfirm(options: UseLeaveConfirmOptions): UseLeaveConfirmReturn {
  const { hasChanges } = options;
  const [isLeaveAllowed, setIsLeaveAllowed] = useState(false);
  const hasChangesRef = useRef(hasChanges);

  // hasChanges 변경 시 ref 업데이트
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  // beforeunload 이벤트 핸들러 (브라우저 기본 경고)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current && !isLeaveAllowed) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLeaveAllowed]);

  // 이탈 허용
  const allowLeave = useCallback(() => {
    setIsLeaveAllowed(true);
  }, []);

  // 이탈 상태 리셋
  const resetLeaveState = useCallback(() => {
    setIsLeaveAllowed(false);
  }, []);

  return {
    allowLeave,
    resetLeaveState,
    isLeaveAllowed,
  };
}

/**
 * 모달에서 사용할 이탈 확인 메시지 반환
 */
export function getLeaveConfirmMessage(mode: EditorMode): {
  title: string;
  description: string;
  saveButtonText?: string;
  leaveButtonText: string;
} {
  if (mode === 'edit-post') {
    return {
      title: '저장하지 않은 변경사항이 있습니다',
      description: '페이지를 나가면 변경사항이 사라집니다.',
      leaveButtonText: '나가기',
    };
  }

  // create or edit-draft
  return {
    title: '작성 중인 내용이 있습니다',
    description: '페이지를 나가면 작성 중인 내용이 사라집니다. 임시저장 하시겠습니까?',
    saveButtonText: '임시저장',
    leaveButtonText: '저장하지 않고 나가기',
  };
}
