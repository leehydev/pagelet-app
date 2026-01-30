'use client';

/**
 * 브랜딩 에셋 업로드 훅 (use-branding-upload.ts)
 *
 * 로고, 파비콘, OG 이미지, CTA 이미지 등 브랜딩 에셋의 업로드를 관리합니다.
 *
 * ============================================================================
 * 업로드 프로세스 (2단계 업로드)
 * ============================================================================
 *
 * [1단계: 파일 선택 → S3 업로드]
 *
 *   사용자가 파일 선택
 *         ↓
 *   로컬 미리보기 생성 (URL.createObjectURL)
 *   → 파일 선택 즉시 미리보기 표시 (S3 업로드 완료 전에도)
 *         ↓
 *   presign API 호출
 *   → 서버에서 S3 업로드용 presigned URL 발급
 *   → 고유한 S3 key 생성 (timestamp 포함)
 *         ↓
 *   S3에 직접 업로드 (presigned URL 사용)
 *   → 진행률 실시간 업데이트
 *         ↓
 *   상태: 'uploaded' (업로드 완료, 아직 미적용)
 *
 *
 * [2단계: 적용하기 (Commit)]
 *
 *   "지금 적용하기" 버튼 클릭
 *         ↓
 *   commit API 호출
 *   → 서버에서 DB에 활성 이미지로 저장
 *   → 기존 이미지는 비활성화 (나중에 정리)
 *         ↓
 *   React Query 캐시 무효화
 *   → 사이트 설정 데이터 새로 로드
 *         ↓
 *   상태 초기화 → 완료
 *
 *
 * ============================================================================
 * 상태 흐름도
 * ============================================================================
 *
 *   idle ──[파일 선택]──→ uploading ──[S3 업로드 완료]──→ uploaded
 *     ↑                      │                              │
 *     │                      │                              │
 *     │                      ↓                              ↓
 *     │                    error ←──[에러 발생]───────── committing
 *     │                      │                              │
 *     │                      │                              │
 *     └──────[reset/완료]────┴──────────[commit 성공]───────┘
 *
 *
 * ============================================================================
 * 로컬 미리보기 vs 서버 URL
 * ============================================================================
 *
 * - localPreviewUrl: File 객체에서 생성한 blob URL (즉시 표시용)
 * - tmpPreviewUrl: S3에 업로드된 파일의 CDN URL (서버 저장용)
 *
 * 왜 로컬 미리보기가 필요한가?
 * → S3 key가 고유하더라도, CDN 캐시로 인해 이전 이미지가 보일 수 있음
 * → 로컬 blob URL은 캐시 영향 없이 즉시 선택한 이미지를 표시
 *
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  presignBrandingUpload,
  commitBrandingUpload,
  deleteBrandingAsset,
  BrandingType,
  BrandingPresignResponse,
} from '@/lib/api';
import { toast } from 'sonner';
import { getErrorDisplayMessage } from '@/lib/error-handler';
import { uploadFileToS3 } from './use-upload';
import { siteSettingsKeys } from './use-site-settings';

// ============================================================================
// 타입 정의
// ============================================================================

/**
 * 업로드 상태
 *
 * - idle: 초기 상태 (아무 작업 없음)
 * - uploading: S3 업로드 진행 중
 * - uploaded: S3 업로드 완료, commit 대기 중 ("지금 적용하기" 버튼 표시)
 * - committing: commit API 호출 중
 * - error: 에러 발생
 */
type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'committing' | 'error';

export interface BrandingUploadState {
  /** 현재 업로드 상태 */
  status: UploadStatus;

  /** S3 업로드 진행률 (0-100) */
  progress: number;

  /** 로컬 미리보기 URL (File blob) - 파일 선택 즉시 생성, 캐시 영향 없음 */
  localPreviewUrl?: string;

  /** 서버 미리보기 URL (S3 CDN) - presign 응답에서 받음 */
  tmpPreviewUrl?: string;

  /** S3 key - commit 시 서버에 전달 */
  tmpKey?: string;

  /** 에러 메시지 */
  error?: string;
}

/** 초기 상태 */
const initialState: BrandingUploadState = {
  status: 'idle',
  progress: 0,
};

// ============================================================================
// 훅 구현
// ============================================================================

/**
 * 브랜딩 에셋 업로드 훅
 * siteId는 interceptor가 X-Site-Id 헤더로 자동 주입
 *
 * @param siteId - 캐시 키 용도로만 사용
 * @param type - 브랜딩 타입 (logo, favicon, og, cta)
 *
 * @example
 * ```tsx
 * const { state, upload, commit, reset, isUploading, isUploaded } = useBrandingUpload(siteId, 'logo');
 *
 * // 파일 선택 시
 * await upload(file);
 *
 * // 적용하기 클릭 시
 * await commit();
 *
 * // 취소 시
 * reset();
 * ```
 */
export function useBrandingUpload(siteId: string, type: BrandingType) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BrandingUploadState>(initialState);

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // --------------------------------------------------------------------------
  // API Mutations
  // --------------------------------------------------------------------------

  /** Presign API - S3 업로드용 URL 발급 */
  const presignMutation = useMutation({
    mutationFn: (data: { type: BrandingType; filename: string; size: number; mimeType: string }) =>
      presignBrandingUpload(data),
  });

  /** Commit API - 업로드된 이미지를 활성화 */
  const commitMutation = useMutation({
    mutationFn: (data: { type: BrandingType; tmpKey: string }) => commitBrandingUpload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.admin(siteId) });
    },
  });

  /** Delete API - 서버에 저장된 이미지 삭제 */
  const deleteMutation = useMutation({
    mutationFn: () => deleteBrandingAsset(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.admin(siteId) });
    },
  });

  // --------------------------------------------------------------------------
  // 메모리 관리: blob URL 해제
  // --------------------------------------------------------------------------

  /** 로컬 미리보기 URL 메모리 해제 */
  const revokeLocalPreview = useCallback(() => {
    if (stateRef.current.localPreviewUrl) {
      URL.revokeObjectURL(stateRef.current.localPreviewUrl);
    }
  }, []);

  // --------------------------------------------------------------------------
  // 액션 함수들
  // --------------------------------------------------------------------------

  /**
   * 파일 업로드 (1단계)
   *
   * 프로세스:
   * 1. 로컬 미리보기 URL 생성 (즉시 표시)
   * 2. presign API 호출 → S3 업로드 URL 발급
   * 3. S3에 직접 업로드 (진행률 추적)
   * 4. 완료 → 'uploaded' 상태로 전환
   */
  const upload = useCallback(
    async (file: File) => {
      const localPreviewUrl = URL.createObjectURL(file);

      setState({
        status: 'uploading',
        progress: 0,
        localPreviewUrl,
      });

      try {
        const presignResponse: BrandingPresignResponse = await presignMutation.mutateAsync({
          type,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        });

        await uploadFileToS3(presignResponse.uploadUrl, file, file.type, (progress) => {
          setState((prev) => ({ ...prev, progress }));
        });

        setState({
          status: 'uploaded',
          progress: 100,
          localPreviewUrl,
          tmpPreviewUrl: presignResponse.tmpPublicUrl,
          tmpKey: presignResponse.tmpKey,
        });

        return presignResponse;
      } catch (error) {
        URL.revokeObjectURL(localPreviewUrl);

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
   * 업로드 확정 (2단계 - Commit)
   *
   * 프로세스:
   * 1. commit API 호출 → 서버에서 DB에 활성 이미지로 저장
   * 2. React Query 캐시 무효화 → 새 이미지 URL 반영
   * 3. 상태 초기화
   */
  const commit = useCallback(async () => {
    const currentTmpKey = stateRef.current.tmpKey;
    if (!currentTmpKey) {
      throw new Error('업로드된 파일이 없습니다.');
    }

    setState((prev) => ({ ...prev, status: 'committing' }));

    try {
      const response = await commitMutation.mutateAsync({
        type,
        tmpKey: currentTmpKey,
      });

      revokeLocalPreview();
      setState(initialState);

      return response;
    } catch (error) {
      const errorMessage = getErrorDisplayMessage(error, '저장에 실패했습니다.');
      setState((prev) => ({ ...prev, status: 'error', error: errorMessage }));
      throw error;
    }
  }, [type, commitMutation, revokeLocalPreview]);

  /**
   * 상태 초기화 (취소)
   */
  const reset = useCallback(() => {
    revokeLocalPreview();
    setState(initialState);
  }, [revokeLocalPreview]);

  /**
   * 서버에 저장된 이미지 삭제
   */
  const deleteAsset = useCallback(async () => {
    try {
      const response = await deleteMutation.mutateAsync();
      toast.success('이미지가 삭제되었습니다');
      return response;
    } catch (error) {
      const errorMessage = getErrorDisplayMessage(error, '이미지 삭제에 실패했습니다');
      toast.error(errorMessage);
      throw error;
    }
  }, [deleteMutation]);

  // --------------------------------------------------------------------------
  // 반환값
  // --------------------------------------------------------------------------

  return {
    /** 현재 상태 */
    state,

    /** 파일 업로드 (1단계) */
    upload,

    /** 업로드 확정 (2단계) */
    commit,

    /** 상태 초기화 (취소) */
    reset,

    /** 서버 이미지 삭제 */
    deleteAsset,

    // 편의 플래그
    isUploading: state.status === 'uploading',
    isUploaded: state.status === 'uploaded',
    isCommitting: state.status === 'committing',
    isDeleting: deleteMutation.isPending,
    hasChanges: state.status === 'uploaded',
  };
}
