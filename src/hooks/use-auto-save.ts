'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { saveDraft, createAdminPost, CreatePostRequest, SaveDraftRequest, PostStatus } from '@/lib/api';

interface UseAutoSaveOptions {
  siteId: string;
  postId: string | null; // null이면 새 글 모드
  intervalMs?: number; // 자동저장 간격 (기본 5분)
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onPostCreated?: (postId: string) => void; // 새 게시글 생성 시 호출
}

interface AutoSaveState {
  lastSavedAt: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  isEditingDraft: boolean; // 드래프트 편집 중 여부
}

// 내용이 비어있는지 확인
function isContentEmpty(contentJson: Record<string, unknown> | undefined): boolean {
  if (!contentJson) return true;

  const content = contentJson.content as Array<Record<string, unknown>> | undefined;
  if (!content || content.length === 0) return true;

  // 빈 paragraph만 있는 경우
  if (
    content.length === 1 &&
    content[0].type === 'paragraph' &&
    (!content[0].content || (content[0].content as Array<unknown>).length === 0)
  ) {
    return true;
  }

  return false;
}

// 필수 필드 기본값 채우기
function fillRequiredFields(data: SaveDraftRequest): CreatePostRequest {
  return {
    title: data.title?.trim() || '제목 없음',
    subtitle: data.subtitle?.trim() || ' ',
    contentJson: data.contentJson || { type: 'doc', content: [] },
    contentHtml: data.contentHtml,
    contentText: data.contentText,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    ogImageUrl: data.ogImageUrl,
    categoryId: data.categoryId,
    status: PostStatus.PRIVATE,
  };
}

export function useAutoSave({
  siteId,
  postId: initialPostId,
  intervalMs = 5 * 60 * 1000, // 5분
  onSaveSuccess,
  onSaveError,
  onPostCreated,
}: UseAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    lastSavedAt: null,
    isSaving: false,
    hasUnsavedChanges: false,
    isEditingDraft: false,
  });

  // postId를 내부 상태로 관리 (새 글 생성 후 업데이트)
  const postIdRef = useRef<string | null>(initialPostId);

  const pendingDataRef = useRef<SaveDraftRequest | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // initialPostId 변경 시 동기화
  useEffect(() => {
    postIdRef.current = initialPostId;
  }, [initialPostId]);

  // 새 게시글 생성 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(siteId, data),
    onSuccess: (post) => {
      postIdRef.current = post.id;
      setState((prev) => ({
        ...prev,
        lastSavedAt: dayjs().toDate(),
        isSaving: false,
        hasUnsavedChanges: false,
        isEditingDraft: true,
      }));
      if (pendingDataRef.current) {
        lastSavedDataRef.current = JSON.stringify(pendingDataRef.current);
      }
      onPostCreated?.(post.id);
      onSaveSuccess?.();
    },
    onError: (error: Error) => {
      setState((prev) => ({ ...prev, isSaving: false }));
      onSaveError?.(error);
    },
  });

  // 드래프트 저장 mutation
  const saveMutation = useMutation({
    mutationFn: (data: SaveDraftRequest) => {
      if (!postIdRef.current) throw new Error('postId is required');
      return saveDraft(siteId, postIdRef.current, data);
    },
    onSuccess: () => {
      setState((prev) => ({
        ...prev,
        lastSavedAt: dayjs().toDate(),
        isSaving: false,
        hasUnsavedChanges: false,
        isEditingDraft: true,
      }));
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
  const markAsChanged = useCallback((data: SaveDraftRequest) => {
    const dataStr = JSON.stringify(data);
    if (dataStr !== lastSavedDataRef.current) {
      pendingDataRef.current = data;
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, []);

  // 저장 실행 (내부 함수)
  const executeSave = useCallback(async () => {
    const data = pendingDataRef.current;
    if (!data) return;

    const isPending = createMutation.isPending || saveMutation.isPending;
    if (isPending) return;

    setState((prev) => ({ ...prev, isSaving: true }));

    if (postIdRef.current) {
      // postId가 있으면 드래프트 저장
      await saveMutation.mutateAsync(data);
    } else {
      // postId가 없으면 새 게시글 생성
      // 내용이 없으면 저장하지 않음
      if (isContentEmpty(data.contentJson)) {
        setState((prev) => ({ ...prev, isSaving: false }));
        return;
      }

      const createData = fillRequiredFields(data);
      await createMutation.mutateAsync(createData);
    }
  }, [createMutation, saveMutation]);

  // 수동 저장 트리거
  const saveNow = useCallback(async () => {
    if (!pendingDataRef.current) return;
    await executeSave();
  }, [executeSave]);

  // 드래프트 편집 상태 설정 (에디터 초기화 시 사용)
  const setIsEditingDraft = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isEditingDraft: value }));
  }, []);

  // 현재 postId 반환 (새 글 생성 후 업데이트된 값)
  const getPostId = useCallback(() => postIdRef.current, []);

  // 자동저장 인터벌
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingDataRef.current && state.hasUnsavedChanges) {
        const isPending = createMutation.isPending || saveMutation.isPending;
        if (!isPending) {
          executeSave();
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, state.hasUnsavedChanges, createMutation.isPending, saveMutation.isPending, executeSave]);

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
    setIsEditingDraft,
    getPostId,
  };
}
