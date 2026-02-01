'use client';

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  presignUpload,
  completeUpload,
  abortUpload,
  PresignUploadRequest,
  CompleteUploadRequest,
  PresignUploadResponse,
} from '@/lib/api';
import { getErrorDisplayMessage } from '@/lib/error-handler';

export interface UploadProgress {
  status: 'idle' | 'presigning' | 'uploading' | 'completing' | 'completed' | 'error';
  progress: number; // 0-100
  error?: string;
  publicUrl?: string;
  s3Key?: string;
}

/**
 * 이미지 파일의 해상도 조회
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * File 객체와 함께 S3 업로드
 */
export async function uploadFileToS3(
  uploadUrl: string,
  file: File,
  mimeType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.send(file);
  });
}

/**
 * 파일 업로드 훅
 * siteId는 interceptor가 X-Site-Id 헤더로 자동 주입
 */
export function useUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });

  const presignMutation = useMutation({
    mutationFn: ({ request }: { request: PresignUploadRequest; file: File }) =>
      presignUpload(request),
    onSuccess: async (response: PresignUploadResponse, { request, file }) => {
      setUploadProgress({
        status: 'uploading',
        progress: 0,
        s3Key: response.s3Key,
      });

      try {
        await uploadFileToS3(response.uploadUrl, file, request.mimeType, (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            progress,
          }));
        });

        setUploadProgress((prev) => ({
          ...prev,
          status: 'completing',
        }));

        const completeData: CompleteUploadRequest = {
          s3Key: response.s3Key,
          postId: request.postId,
          imageType: request.imageType,
        };
        const completeResponse = await completeUpload(completeData);

        setUploadProgress({
          status: 'completed',
          progress: 100,
          publicUrl: completeResponse.publicUrl,
          s3Key: response.s3Key,
        });
      } catch (error) {
        try {
          await abortUpload({ s3Key: response.s3Key });
        } catch (abortError) {
          console.warn('Failed to abort upload:', abortError);
        }

        const errorMessage = getErrorDisplayMessage(
          error,
          '파일 업로드에 실패했습니다. 다시 시도해주세요.',
        );

        setUploadProgress({
          status: 'error',
          progress: 0,
          error: errorMessage,
        });
      }
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorDisplayMessage(error, '업로드 준비에 실패했습니다.');

      setUploadProgress({
        status: 'error',
        progress: 0,
        error: errorMessage,
      });
    },
  });

  const upload = async (
    file: File,
    options?: { postId?: string; imageType?: 'THUMBNAIL' | 'CONTENT' | 'GALLERY' },
  ) => {
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: '파일 크기는 최대 2MB까지 가능합니다.',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: '지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF만 가능합니다.',
      });
      return;
    }

    try {
      const imageDimensions = await getImageDimensions(file);
      const maxWidth = 2000;

      if (imageDimensions.width > maxWidth) {
        setUploadProgress({
          status: 'error',
          progress: 0,
          error: `이미지 가로 크기가 너무 큽니다. 최대 ${maxWidth}px까지 가능합니다. (현재: ${imageDimensions.width}px)`,
        });
        return;
      }

      const recommendedWidth = 1200;
      const recommendedHeight = 630;
      if (imageDimensions.width < recommendedWidth || imageDimensions.height < recommendedHeight) {
        console.warn(
          `권장 해상도는 ${recommendedWidth}×${recommendedHeight}px입니다. (현재: ${imageDimensions.width}×${imageDimensions.height}px)`,
        );
      }
    } catch (error) {
      setUploadProgress({
        status: 'error',
        progress: 0,
        error: '이미지 파일을 읽을 수 없습니다. 유효한 이미지 파일인지 확인해주세요.',
      });
      console.error(error);
      return;
    }

    setUploadProgress({
      status: 'presigning',
      progress: 0,
    });

    const request: PresignUploadRequest = {
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      imageType: options?.imageType || 'THUMBNAIL',
      postId: options?.postId,
    };

    presignMutation.mutate({ request, file });
  };

  const reset = useCallback(() => {
    setUploadProgress({
      status: 'idle',
      progress: 0,
    });
  }, []);

  return {
    upload,
    uploadProgress,
    reset,
    isUploading:
      uploadProgress.status === 'presigning' ||
      uploadProgress.status === 'uploading' ||
      uploadProgress.status === 'completing',
  };
}
