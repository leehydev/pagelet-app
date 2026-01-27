'use client';

/**
 * 페이지 이탈 확인 모달
 * 작성 중인 내용이 있을 때 페이지 이탈 시 표시
 */

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
import { Button } from '@/components/ui/button';
import type { EditorMode } from '@/hooks/use-leave-confirm';

interface LeaveConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: EditorMode;
  /** 임시저장 후 나가기 */
  onSaveAndLeave?: () => void;
  /** 저장하지 않고 나가기 */
  onLeaveWithoutSave: () => void;
  /** 취소 (이탈 취소) */
  onCancel: () => void;
  /** 저장 중 상태 */
  isSaving?: boolean;
}

/**
 * 페이지 이탈 확인 모달
 */
export function LeaveConfirmModal({
  open,
  onOpenChange,
  mode,
  onSaveAndLeave,
  onLeaveWithoutSave,
  onCancel,
  isSaving = false,
}: LeaveConfirmModalProps) {
  const isPostEdit = mode === 'edit-post';

  const title = isPostEdit ? '저장하지 않은 변경사항이 있습니다' : '작성 중인 내용이 있습니다';

  const description = isPostEdit
    ? '페이지를 나가면 변경사항이 사라집니다.'
    : '페이지를 나가면 작성 중인 내용이 사라집니다.';

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} disabled={isSaving}>
            취소
          </AlertDialogCancel>

          {!isPostEdit && onSaveAndLeave && (
            <Button onClick={onSaveAndLeave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '임시저장'}
            </Button>
          )}

          <AlertDialogAction
            onClick={onLeaveWithoutSave}
            className="bg-red-600 hover:bg-red-700"
            disabled={isSaving}
          >
            {isPostEdit ? '나가기' : '저장하지 않고 나가기'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
