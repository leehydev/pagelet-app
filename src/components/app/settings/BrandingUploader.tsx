'use client';

/**
 * 브랜딩 이미지 업로더 컴포넌트 (BrandingUploader.tsx)
 *
 * 로고, 파비콘, OG 이미지 등 브랜딩 에셋을 업로드하는 UI 컴포넌트입니다.
 *
 * ============================================================================
 * UI 상태별 동작
 * ============================================================================
 *
 * [기본 상태 (idle)]
 * ┌─────────────────────────────────────────────────────────┐
 * │  로고                                                    │
 * │  권장: 가로형 200×60px 이상                    [미리보기] │
 * │                                                          │
 * │  [업로드] [삭제]                                          │
 * └─────────────────────────────────────────────────────────┘
 *
 * [업로드 중 (uploading)]
 * ┌─────────────────────────────────────────────────────────┐
 * │  로고                                                    │
 * │  권장: 가로형 200×60px 이상                    [미리보기] │
 * │                                                ← 로컬    │
 * │  [업로드 중...]                                          │
 * │  ████████░░░░░░ 60%                                      │
 * └─────────────────────────────────────────────────────────┘
 *
 * [업로드 완료, 적용 대기 (uploaded)]
 * ┌─────────────────────────────────────────────────────────┐
 * │  로고                                                    │
 * │  권장: 가로형 200×60px 이상                    [미리보기] │
 * │                                                ← 로컬    │
 * │  [지금 적용하기] [취소]                                   │
 * └─────────────────────────────────────────────────────────┘
 *
 * [적용 중 (committing)]
 * ┌─────────────────────────────────────────────────────────┐
 * │  로고                                                    │
 * │  권장: 가로형 200×60px 이상                    [미리보기] │
 * │                                                          │
 * │  [적용 중...] [취소]  ← 비활성화                          │
 * └─────────────────────────────────────────────────────────┘
 *
 *
 * ============================================================================
 * 이미지 URL 우선순위
 * ============================================================================
 *
 * 1. localPreviewUrl (로컬 blob) - 파일 선택 즉시 표시, 캐시 영향 없음
 * 2. currentUrl (서버 URL) - commit된 이미지, 캐시 버스트 적용
 *
 * 왜 이 순서인가?
 * → 파일 선택 시 즉각적인 피드백 제공
 * → CDN 캐시로 인한 이전 이미지 표시 문제 방지
 *
 */

import { useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { useBrandingUpload } from '@/hooks/use-branding-upload';
import { BrandingType } from '@/lib/api';
import { cn } from '@/lib/utils';

// ============================================================================
// 타입 정의
// ============================================================================

interface BrandingUploaderProps {
  /** 사이트 ID */
  siteId: string;

  /** 브랜딩 타입 (logo, favicon, og, cta) */
  type: BrandingType;

  /** 표시 제목 (예: "로고", "파비콘") */
  title: string;

  /** 설명 텍스트 (권장 사이즈 등) */
  description: string;

  /** 현재 서버에 저장된 이미지 URL (없으면 null) */
  currentUrl: string | null;

  /** 마지막 업데이트 시간 (캐시 버스트용) */
  updatedAt?: string;

  /** commit 완료 시 호출되는 콜백 */
  onCommit?: () => void;
}

// ============================================================================
// 타입별 검증 규칙
// ============================================================================

/**
 * 브랜딩 타입별 파일 검증 규칙
 *
 * 백엔드(BrandingAssetService)와 동일한 규칙 적용
 * → 프론트에서 먼저 검증하여 불필요한 API 호출 방지
 */
const VALIDATION_RULES: Record<
  BrandingType,
  {
    maxSize: number; // 최대 파일 크기 (bytes)
    allowedTypes: string[]; // 허용 MIME 타입
    accept: string; // input[type=file] accept 속성
  }
> = {
  logo: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
  },
  favicon: {
    maxSize: 512 * 1024, // 512KB
    allowedTypes: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'],
    accept: 'image/png,image/x-icon,.ico',
  },
  og: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    accept: 'image/png,image/jpeg,image/webp',
  },
  cta: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    accept: 'image/png,image/jpeg,image/webp',
  },
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function BrandingUploader({
  siteId,
  type,
  title,
  description,
  currentUrl,
  updatedAt,
  onCommit,
}: BrandingUploaderProps) {
  // --------------------------------------------------------------------------
  // 상태 및 훅
  // --------------------------------------------------------------------------

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    state,
    upload,
    commit,
    reset,
    deleteAsset,
    isUploading,
    isUploaded,
    isCommitting,
    isDeleting,
  } = useBrandingUpload(siteId, type);

  const rules = VALIDATION_RULES[type];

  // --------------------------------------------------------------------------
  // 이미지 URL 결정
  // --------------------------------------------------------------------------

  /**
   * 표시할 이미지 URL 결정
   *
   * 우선순위:
   * 1. localPreviewUrl - 파일 선택 즉시 표시 (캐시 영향 없음)
   * 2. currentUrl - 서버에 저장된 이미지 (캐시 버스트 적용)
   */
  const displayUrl = state.localPreviewUrl || currentUrl;

  /**
   * 최종 이미지 URL (캐시 버스트 적용)
   *
   * - 로컬 blob URL: 캐시 버스트 불필요 (매번 새 URL)
   * - 서버 URL: ?v=timestamp 쿼리 파라미터로 캐시 무효화
   */
  const imageUrl = displayUrl
    ? state.localPreviewUrl
      ? displayUrl // 로컬 blob URL은 그대로 사용
      : `${displayUrl}?v=${updatedAt || ''}` // 서버 URL은 캐시 버스트
    : null;

  // --------------------------------------------------------------------------
  // 이벤트 핸들러
  // --------------------------------------------------------------------------

  /**
   * 파일 선택 핸들러
   *
   * 프로세스:
   * 1. 파일 크기 검증
   * 2. MIME 타입 검증
   * 3. upload() 호출 → presign → S3 업로드
   */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 파일 크기 검증
      if (file.size > rules.maxSize) {
        alert(`파일 크기는 최대 ${Math.floor(rules.maxSize / 1024)}KB까지 가능합니다.`);
        return;
      }

      // MIME 타입 검증
      if (!rules.allowedTypes.includes(file.type)) {
        alert('지원하지 않는 파일 형식입니다.');
        return;
      }

      try {
        await upload(file);
      } catch {
        // 에러는 state.error로 표시됨
      }

      // input 초기화 (같은 파일 재선택 가능하도록)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, rules],
  );

  /** 업로드/변경 버튼 클릭 → 파일 선택 다이얼로그 열기 */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * 삭제/취소 버튼 클릭
   *
   * - uploaded 상태: 로컬 리셋 (업로드 취소)
   * - idle 상태 + 서버 이미지 있음: 삭제 확인 다이얼로그 표시
   */
  const handleRemoveClick = useCallback(() => {
    if (isUploaded) {
      // 업로드 상태 취소 (로컬 리셋)
      reset();
    } else if (currentUrl) {
      // 서버 이미지 삭제 확인 다이얼로그 표시
      setShowDeleteConfirm(true);
    }
  }, [isUploaded, currentUrl, reset]);

  /** 삭제 확인 → 서버 이미지 삭제 */
  const handleConfirmDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteAsset();
      onCommit?.();
    } catch {
      // 에러는 훅에서 toast로 표시됨
    }
  }, [deleteAsset, onCommit]);

  /** 적용하기 버튼 클릭 → commit API 호출 */
  const handleCommitClick = useCallback(async () => {
    try {
      await commit();
      onCommit?.();
    } catch {
      // 에러는 state.error로 표시됨
    }
  }, [commit, onCommit]);

  // --------------------------------------------------------------------------
  // 렌더링
  // --------------------------------------------------------------------------

  return (
    <>
      <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-b-0">
        {/* 왼쪽: 정보 + 버튼 */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 mt-3">
            {/* 숨겨진 file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={rules.accept}
              onChange={handleFileSelect}
              className="hidden"
            />

            {isUploaded ? (
              // 업로드 완료 상태: 적용하기 + 취소 버튼
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCommitClick}
                  disabled={isCommitting}
                >
                  {isCommitting ? '적용 중...' : '지금 적용하기'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveClick}
                  disabled={isCommitting}
                >
                  취소
                </Button>
              </>
            ) : (
              // 기본 상태: 업로드/변경 + 삭제 버튼
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                >
                  {isUploading ? '업로드 중...' : currentUrl ? '변경' : '업로드'}
                </Button>
                {currentUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveClick}
                    disabled={isUploading || isDeleting}
                  >
                    {isDeleting ? '삭제 중...' : '삭제'}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* 에러 메시지 */}
          {state.error && <p className="text-xs text-red-500 mt-2">{state.error}</p>}

          {/* 업로드 진행률 바 */}
          {isUploading && state.progress > 0 && (
            <div className="mt-2 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* 오른쪽: 이미지 미리보기 */}
        <div
          className={cn(
            'shrink-0 ml-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center',
            type === 'logo' && 'w-24 h-10',
            type === 'favicon' && 'w-12 h-12',
            type === 'og' && 'w-32 h-17',
          )}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                // 이미지 로드 실패 시 숨김 (placeholder 표시)
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-gray-300">
              <PlaceholderIcon type={type} />
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title} 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 이미지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================================
// 서브 컴포넌트
// ============================================================================

/**
 * 이미지 없을 때 표시되는 플레이스홀더 아이콘
 */
function PlaceholderIcon({ type }: { type: BrandingType }) {
  if (type === 'favicon') {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    );
  }

  // logo, og, cta 공통 아이콘
  return (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
