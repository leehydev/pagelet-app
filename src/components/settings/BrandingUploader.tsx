'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useBrandingUpload } from '@/hooks/use-branding-upload';
import { BrandingType } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BrandingUploaderProps {
  siteId: string;
  type: BrandingType;
  title: string;
  description: string;
  currentUrl: string | null;
  updatedAt?: string;
  onCommit?: () => void;
}

// 타입별 검증 규칙
const VALIDATION_RULES: Record<
  BrandingType,
  {
    maxSize: number;
    allowedTypes: string[];
    accept: string;
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
};

export function BrandingUploader({
  siteId,
  type,
  title,
  description,
  currentUrl,
  updatedAt,
  onCommit,
}: BrandingUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, upload, commit, reset, isUploading, isUploaded, isCommitting } =
    useBrandingUpload(siteId, type);

  const rules = VALIDATION_RULES[type];

  // 표시할 이미지 URL (업로드 중이면 tmp, 아니면 현재 URL)
  const displayUrl = state.tmpPreviewUrl || currentUrl;
  // 캐시 버스트 적용 (tmp URL은 이미 유니크하므로 버스트 불필요)
  const imageUrl = displayUrl
    ? state.tmpPreviewUrl
      ? displayUrl
      : `${displayUrl}?v=${updatedAt || ''}`
    : null;

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

      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, rules],
  );

  const handleReplace = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    reset();
  }, [reset]);

  const handleSave = useCallback(async () => {
    try {
      await commit();
      onCommit?.();
    } catch {
      // 에러는 state.error로 표시됨
    }
  }, [commit, onCommit]);

  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-b-0">
      {/* 왼쪽: 정보 + 버튼 */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>

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
            <>
              <Button type="button" size="sm" onClick={handleSave} disabled={isCommitting}>
                {isCommitting ? '적용 중...' : '지금 적용하기'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isCommitting}
              >
                취소
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReplace}
                disabled={isUploading}
              >
                {isUploading ? '업로드 중...' : currentUrl ? '변경' : '업로드'}
              </Button>
              {currentUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={isUploading}
                >
                  삭제
                </Button>
              )}
            </>
          )}
        </div>

        {/* 에러 메시지 */}
        {state.error && <p className="text-xs text-red-500 mt-2">{state.error}</p>}

        {/* 업로드 진행률 */}
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
          type === 'og' && 'w-32 h-[68px]',
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
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
  );
}

function PlaceholderIcon({ type }: { type: BrandingType }) {
  if (type === 'favicon') {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    );
  }

  return (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
