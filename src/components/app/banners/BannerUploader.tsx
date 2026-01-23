'use client';

import { useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBannerUpload } from '@/hooks/use-banner-upload';
import { cn } from '@/lib/utils';

interface BannerUploaderProps {
  siteId: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export function BannerUploader({ siteId, currentUrl, onUpload }: BannerUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, upload, reset, isUploading } = useBannerUpload(siteId);

  // 표시할 이미지 URL
  const displayUrl = state.publicUrl || currentUrl;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = await upload(file);
      if (url) {
        onUpload(url);
      }

      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload, onUpload],
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback(() => {
    reset();
    onUpload('');
  }, [reset, onUpload]);

  return (
    <div className="space-y-2">
      {/* 숨겨진 file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative rounded-lg border border-gray-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="배너 미리보기"
            className="w-full aspect-[4/1] object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClick}
              disabled={isUploading}
            >
              {isUploading ? '업로드 중...' : '변경'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className={cn(
            'w-full aspect-[4/1] rounded-lg border-2 border-dashed border-gray-300',
            'flex flex-col items-center justify-center gap-2',
            'hover:border-gray-400 hover:bg-gray-50 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {isUploading ? (
            <>
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">업로드 중...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">클릭하여 이미지 업로드</span>
            </>
          )}
        </button>
      )}

      {/* 업로드 진행률 */}
      {isUploading && state.progress > 0 && (
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}

      {/* 에러 메시지 */}
      {state.error && <p className="text-xs text-red-500">{state.error}</p>}
    </div>
  );
}
