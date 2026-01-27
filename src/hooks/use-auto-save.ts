'use client';

/**
 * 게시글 자동 저장 훅
 *
 * 저장 로직:
 * - 새 글 작성: 5분마다 PRIVATE post 생성 후 draft 저장
 * - 기존 글 수정: 5분마다 draft로 저장 (상태 무관)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  saveDraft,
  createAdminPost,
  CreatePostRequest,
  SaveDraftRequest,
  PostStatus,
} from '@/lib/api';

// ============================================================================
// 타입 정의
// ============================================================================

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
}

type FormData = SaveDraftRequest;

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 에디터 내용이 비어있는지 확인
 */
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

/**
 * 새 글 생성용 필수 필드 채우기
 */
function toCreateRequest(data: FormData): CreatePostRequest {
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
    status: PostStatus.PRIVATE, // 새 글은 항상 PRIVATE
  };
}

// ============================================================================
// 메인 훅
// ============================================================================

export function useAutoSave({
  siteId,
  postId: initialPostId,
  intervalMs = 5 * 60 * 1000, // 5분
  onSaveSuccess,
  onSaveError,
  onPostCreated,
}: UseAutoSaveOptions) {
  // 상태
  const [state, setState] = useState<AutoSaveState>({
    lastSavedAt: null,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  // Refs
  const postIdRef = useRef<string | null>(initialPostId);
  const pendingDataRef = useRef<FormData | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // postId 변경 시 동기화
  useEffect(() => {
    postIdRef.current = initialPostId;
  }, [initialPostId]);

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------

  /**
   * 새 게시글 생성 (PRIVATE 상태)
   */
  const createMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => createAdminPost(siteId, data),
    onSuccess: (post) => {
      postIdRef.current = post.id;
      setState((prev) => ({
        ...prev,
        lastSavedAt: dayjs().toDate(),
        isSaving: false,
        hasUnsavedChanges: false,
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

  /**
   * draft 저장 (항상 draft로 저장)
   */
  const saveDraftMutation = useMutation({
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

  // --------------------------------------------------------------------------
  // 저장 로직
  // --------------------------------------------------------------------------

  /**
   * 데이터 변경 감지
   */
  const markAsChanged = useCallback((data: FormData) => {
    const dataStr = JSON.stringify(data);
    if (dataStr !== lastSavedDataRef.current) {
      pendingDataRef.current = data;
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, []);

  /**
   * 저장 실행
   *
   * 저장 분기:
   * 1. postId 없음 → 새 글 생성 (PRIVATE) → draft 저장
   * 2. postId 있음 → draft 저장
   *
   * @returns 저장 성공 여부
   */
  const executeSave = useCallback(async (): Promise<boolean> => {
    const data = pendingDataRef.current;
    if (!data) return false;

    // 이미 저장 중이면 스킵
    const isPending = createMutation.isPending || saveDraftMutation.isPending;
    if (isPending) return false;

    setState((prev) => ({ ...prev, isSaving: true }));

    // Case 1: 새 글 (postId 없음) → post 생성 후 draft 저장
    if (!postIdRef.current) {
      // 내용이 비어있으면 저장하지 않음
      if (isContentEmpty(data.contentJson)) {
        setState((prev) => ({ ...prev, isSaving: false }));
        return false;
      }

      try {
        const post = await createMutation.mutateAsync(toCreateRequest(data));
        // post 생성 후 draft도 저장
        postIdRef.current = post.id;
        await saveDraftMutation.mutateAsync(data);
        return true;
      } catch {
        return false;
      }
    }

    // Case 2: 기존 글 → draft 저장 (상태 무관)
    try {
      await saveDraftMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  }, [createMutation, saveDraftMutation]);

  /**
   * 수동 저장 트리거
   * @returns 저장 성공 여부
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (!pendingDataRef.current) return false;
    return await executeSave();
  }, [executeSave]);

  /**
   * 현재 postId 반환
   */
  const getPostId = useCallback(() => postIdRef.current, []);

  // --------------------------------------------------------------------------
  // 자동 저장 인터벌
  // --------------------------------------------------------------------------

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingDataRef.current && state.hasUnsavedChanges) {
        const isPending = createMutation.isPending || saveDraftMutation.isPending;
        if (!isPending) {
          executeSave();
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    intervalMs,
    state.hasUnsavedChanges,
    createMutation.isPending,
    saveDraftMutation.isPending,
    executeSave,
  ]);

  // --------------------------------------------------------------------------
  // 페이지 이탈 경고
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // 반환
  // --------------------------------------------------------------------------

  return {
    ...state,
    markAsChanged,
    saveNow,
    getPostId,
  };
}
