'use client';

/**
 * 독립적인 Draft(임시저장 글) 관련 훅
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDrafts,
  createDraft,
  getDraftById,
  updateDraft,
  deleteDraftById,
  publishDraft,
  CreateDraftRequest,
  UpdateDraftRequest,
  DraftListItem,
  Draft,
  Post,
} from '@/lib/api';
import { AxiosError } from 'axios';

// Query Keys
export const draftKeys = {
  all: ['drafts'] as const,
  list: (siteId: string) => [...draftKeys.all, 'list', siteId] as const,
  detail: (siteId: string, draftId: string) =>
    [...draftKeys.all, 'detail', siteId, draftId] as const,
};

/**
 * 임시저장 글 목록 조회 훅
 */
export function useDrafts(siteId: string) {
  return useQuery<DraftListItem[], AxiosError>({
    queryKey: draftKeys.list(siteId),
    queryFn: () => getDrafts(),
    enabled: !!siteId,
  });
}

/**
 * 임시저장 글 상세 조회 훅
 */
export function useDraft(siteId: string, draftId: string | null) {
  return useQuery<Draft, AxiosError>({
    queryKey: draftKeys.detail(siteId, draftId || ''),
    queryFn: () => getDraftById(draftId!),
    enabled: !!siteId && !!draftId,
  });
}

/**
 * 임시저장 글 생성 mutation 훅
 */
export function useCreateDraft(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation<Draft, AxiosError, CreateDraftRequest>({
    mutationFn: (data) => createDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.list(siteId) });
    },
    onError: (error) => {
      console.error('Failed to create draft:', error.response?.data);
    },
  });
}

/**
 * 임시저장 글 수정 mutation 훅
 */
export function useUpdateDraft(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation<Draft, AxiosError, { draftId: string; data: UpdateDraftRequest }>({
    mutationFn: ({ draftId, data }) => updateDraft(draftId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: draftKeys.list(siteId) });
      queryClient.invalidateQueries({ queryKey: draftKeys.detail(siteId, variables.draftId) });
    },
    onError: (error) => {
      console.error('Failed to update draft:', error.response?.data);
    },
  });
}

/**
 * 임시저장 글 삭제 mutation 훅
 */
export function useDeleteDraft(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: (draftId) => deleteDraftById(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.list(siteId) });
    },
    onError: (error) => {
      console.error('Failed to delete draft:', error.response?.data);
    },
  });
}

/**
 * 임시저장 글을 게시글로 발행 mutation 훅
 */
export function usePublishDraft(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation<Post, AxiosError, string>({
    mutationFn: (draftId) => publishDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.list(siteId) });
      queryClient.invalidateQueries({ queryKey: ['posts', 'admin', siteId] });
    },
    onError: (error) => {
      console.error('Failed to publish draft:', error.response?.data);
    },
  });
}
