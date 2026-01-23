'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { presignBannerUpload, BannerPresignRequest, BannerPresignResponse } from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { uploadFileToS3 } from './use-upload';

export interface BannerUploadState {
  status: 'idle' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  publicUrl?: string;
  error?: string;
}

const initialState: BannerUploadState = {
  status: 'idle',
  progress: 0,
};

/**
 * 배너 이미지 업로드 훅
 */
export function useBannerUpload(siteId: string) {
  const [state, setState] = useState<BannerUploadState>(initialState);

  // Presign mutation
  const presignMutation = useMutation({
    mutationFn: (data: BannerPresignRequest) => presignBannerUpload(siteId, data),
  });

  /**
   * 파일 업로드 (presign → S3 PUT)
   */
  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      // 파일 검증
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setState({
          status: 'error',
          progress: 0,
          error: '파일 크기는 최대 5MB까지 가능합니다.',
        });
        return null;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setState({
          status: 'error',
          progress: 0,
          error: '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP만 가능합니다.',
        });
        return null;
      }

      setState({
        status: 'uploading',
        progress: 0,
      });

      try {
        // 1. Presign 요청
        const presignResponse: BannerPresignResponse = await presignMutation.mutateAsync({
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
          publicUrl: presignResponse.publicUrl,
        });

        return presignResponse.publicUrl;
      } catch (error) {
        const errorMessage = getErrorDisplayMessage(error, '파일 업로드에 실패했습니다.');
        setState({
          status: 'error',
          progress: 0,
          error: errorMessage,
        });
        return null;
      }
    },
    [presignMutation],
  );

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    upload,
    reset,
    isUploading: state.status === 'uploading',
    isUploaded: state.status === 'uploaded',
    publicUrl: state.publicUrl,
  };
}
