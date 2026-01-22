'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { updateAdminPost, UpdatePostRequest } from '@/lib/api';

interface UseAutoSaveOptions {
  siteId: string;
  postId: string | null; // null이면 자동저장 비활성화 (새 글)
  intervalMs?: number; // 자동저장 간격 (기본 5분)
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

interface AutoSaveState {
  lastSavedAt: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export function useAutoSave({
  siteId,
  postId,
  intervalMs = 5 * 60 * 1000, // 5분
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    lastSavedAt: null,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  const pendingDataRef = useRef<UpdatePostRequest | null>(null);
  const lastSavedDataRef = useRef<string>('');

  const mutation = useMutation({
    mutationFn: (data: UpdatePostRequest) => {
      if (!postId) throw new Error('postId is required');
      return updateAdminPost(siteId, postId, data);
    },
    onSuccess: () => {
      setState((prev) => ({
        ...prev,
        lastSavedAt: dayjs().toDate(),
        isSaving: false,
        hasUnsavedChanges: false,
      }));
      // 저장된 데이터 기록
      if (pendingDataRef.current) {
        lastSavedDataRef.current = JSON.stringify(pendingDataRef.current);
      }
      onSaveSuccess?.();
    },
    onError: (error: Error) => {
      setState((prev) => ({ ...prev, isSaving: false }));
      onSaveError?.(error);
    },
  });

  // 데이터 변경 감지
  const markAsChanged = useCallback((data: UpdatePostRequest) => {
    const dataStr = JSON.stringify(data);
    if (dataStr !== lastSavedDataRef.current) {
      pendingDataRef.current = data;
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, []);

  // 수동 저장 트리거
  const saveNow = useCallback(async () => {
    if (!postId || !pendingDataRef.current || mutation.isPending) return;

    setState((prev) => ({ ...prev, isSaving: true }));
    await mutation.mutateAsync(pendingDataRef.current);
  }, [postId, mutation]);

  // 자동저장 인터벌
  useEffect(() => {
    if (!postId) return;

    const interval = setInterval(() => {
      if (pendingDataRef.current && state.hasUnsavedChanges && !mutation.isPending) {
        setState((prev) => ({ ...prev, isSaving: true }));
        mutation.mutate(pendingDataRef.current!);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [postId, intervalMs, state.hasUnsavedChanges, mutation]);

  // 페이지 떠날 때 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  return {
    ...state,
    markAsChanged,
    saveNow,
  };
}
