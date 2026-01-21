'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  presignBrandingUpload,
  commitBrandingUpload,
  BrandingType,
  BrandingPresignResponse,
} from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { uploadFileToS3 } from './use-upload';

export interface BrandingUploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'committing' | 'error';
  progress: number;
  tmpPreviewUrl?: string;
  tmpKey?: string;
  error?: string;
}

const initialState: BrandingUploadState = {
  status: 'idle',
  progress: 0,
};

/**
 * 브랜딩 에셋 업로드 훅
 */
export function useBrandingUpload(type: BrandingType) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BrandingUploadState>(initialState);

  // Presign mutation
  const presignMutation = useMutation({
    mutationFn: presignBrandingUpload,
  });

  // Commit mutation
  const commitMutation = useMutation({
    mutationFn: commitBrandingUpload,
    onSuccess: () => {
      // 설정 캐시 무효화 (모든 siteSettings 관련 쿼리)
      queryClient.invalidateQueries({ queryKey: ['siteSettings'], exact: false });
    },
  });

  /**
   * 파일 업로드 (presign → S3 PUT)
   */
  const upload = useCallback(
    async (file: File) => {
      setState({
        status: 'uploading',
        progress: 0,
      });

      try {
        // 1. Presign 요청
        const presignResponse: BrandingPresignResponse = await presignMutation.mutateAsync({
          type,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        });

        // 2. S3에 직접 업로드
        await uploadFileToS3(presignResponse.uploadUrl, file, file.type, (progress) => {
          setState((prev) => ({
            ...prev,
            progress,
          }));
        });

        // 3. 업로드 완료 상태
        setState({
          status: 'uploaded',
          progress: 100,
          tmpPreviewUrl: presignResponse.tmpPublicUrl,
          tmpKey: presignResponse.tmpKey,
        });

        return presignResponse;
      } catch (error) {
        const errorMessage = getErrorDisplayMessage(error, '파일 업로드에 실패했습니다.');
        setState({
          status: 'error',
          progress: 0,
          error: errorMessage,
        });
        throw error;
      }
    },
    [type, presignMutation],
  );

  /**
   * 업로드 확정 (commit)
   */
  const commit = useCallback(async () => {
    if (!state.tmpKey) {
      throw new Error('업로드된 파일이 없습니다.');
    }

    setState((prev) => ({
      ...prev,
      status: 'committing',
    }));

    try {
      const response = await commitMutation.mutateAsync({
        type,
        tmpKey: state.tmpKey,
      });

      // 완료 후 상태 초기화
      setState(initialState);

      return response;
    } catch (error) {
      const errorMessage = getErrorDisplayMessage(error, '저장에 실패했습니다.');
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: errorMessage,
      }));
      throw error;
    }
  }, [type, state.tmpKey, commitMutation]);

  /**
   * 상태 초기화 (취소)
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    upload,
    commit,
    reset,
    isUploading: state.status === 'uploading',
    isUploaded: state.status === 'uploaded',
    isCommitting: state.status === 'committing',
    hasChanges: state.status === 'uploaded',
  };
}
