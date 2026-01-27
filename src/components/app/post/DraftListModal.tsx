'use client';

/**
 * 저장된 글 불러오기 모달
 * 독립적인 Draft 목록을 표시하고 선택/삭제 기능 제공
 */

import { useState } from 'react';
import dayjs from 'dayjs';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { useDrafts, useDeleteDraft } from '@/hooks/use-drafts';
import type { DraftListItem } from '@/lib/api';
import { toast } from 'sonner';

interface DraftListModalProps {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Draft 선택 시 콜백 */
  onSelect: (draft: DraftListItem) => void;
  /** 현재 작성 중인 내용이 있는지 */
  hasUnsavedChanges?: boolean;
  /** 임시저장 후 불러오기 콜백 (hasUnsavedChanges가 true일 때 사용) */
  onSaveBeforeLoad?: () => Promise<void>;
}

/**
 * 저장된 글 불러오기 모달
 */
export function DraftListModal({
  siteId,
  open,
  onOpenChange,
  onSelect,
  hasUnsavedChanges = false,
  onSaveBeforeLoad,
}: DraftListModalProps) {
  const { data: drafts, isLoading, error } = useDrafts(siteId);
  const deleteMutation = useDeleteDraft(siteId);

  const [selectedDraft, setSelectedDraft] = useState<DraftListItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleSelectDraft = (draft: DraftListItem) => {
    if (hasUnsavedChanges && onSaveBeforeLoad) {
      setSelectedDraft(draft);
      setShowSaveConfirm(true);
    } else {
      onSelect(draft);
      onOpenChange(false);
    }
  };

  const handleSaveAndLoad = async () => {
    if (!selectedDraft || !onSaveBeforeLoad) return;

    try {
      await onSaveBeforeLoad();
      onSelect(selectedDraft);
      onOpenChange(false);
    } catch {
      toast.error('임시저장에 실패했습니다');
    } finally {
      setShowSaveConfirm(false);
      setSelectedDraft(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    setDraftToDelete(draftId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;

    try {
      await deleteMutation.mutateAsync(draftToDelete);
      toast.success('삭제되었습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    } finally {
      setShowDeleteConfirm(false);
      setDraftToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>저장된 글 불러오기</DialogTitle>
            <DialogDescription>임시저장된 글을 선택하세요</DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto -mx-6 px-6">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}

            {error && (
              <div className="py-8 text-center text-sm text-red-500">목록을 불러올 수 없습니다</div>
            )}

            {!isLoading && !error && drafts?.length === 0 && (
              <div className="py-8 text-center text-sm text-gray-500">저장된 글이 없습니다</div>
            )}

            {!isLoading && !error && drafts && drafts.length > 0 && (
              <ul className="space-y-2">
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectDraft(draft)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <FileText className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {draft.title || '제목 없음'}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {dayjs(draft.updatedAt).format('YYYY-MM-DD HH:mm')} 저장
                          {draft.categoryName && (
                            <span className="ml-2 text-gray-400">{draft.categoryName}</span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, draft.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            저장된 글은 14일 후 자동 삭제됩니다
          </p>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제된 글은 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 임시저장 후 불러오기 확인 다이얼로그 */}
      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 중인 내용이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              작성 중인 내용을 임시저장하고 선택한 문서를 불러오시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDraft(null)}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndLoad}>임시저장 후 불러오기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
