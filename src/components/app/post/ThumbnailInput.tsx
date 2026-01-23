'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Thumbnail } from './Thumbnail';
import { useUpload } from '@/hooks/use-upload';
import { cn } from '@/lib/utils';

export interface ThumbnailInputProps {
  siteId: string;
  value?: string | null;
  onChange?: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}

type InputMode = 'url' | 'upload';

/**
 * 썸네일 입력 컴포넌트
 * URL 입력 모드와 파일 업로드 모드를 지원
 */
export function ThumbnailInput({
  siteId,
  value,
  onChange,
  disabled = false,
  className,
}: ThumbnailInputProps) {
  const [mode, setMode] = useState<InputMode>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploadProgress, reset, isUploading } = useUpload(siteId);

  // 업로드 완료 시 onChange 호출
  useEffect(() => {
    if (uploadProgress.status === 'completed' && uploadProgress.publicUrl) {
      onChange?.(uploadProgress.publicUrl);
      reset();
    }
  }, [uploadProgress.status, uploadProgress.publicUrl, onChange, reset]);

  const handleUrlChange = (newUrl: string) => {
    onChange?.(newUrl || null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await upload(file, { imageType: 'THUMBNAIL' });
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange?.(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentThumbnailUrl = uploadProgress.publicUrl || value;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 모드 토글 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setMode('url');
            reset();
          }}
          disabled={disabled || isUploading}
        >
          URL로 입력
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setMode('upload');
            fileInputRef.current?.click();
          }}
          disabled={disabled || isUploading}
        >
          <Upload className="w-4 h-4" />
          이미지 업로드
        </Button>
      </div>

      {/* URL 모드 */}
      {mode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={value || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* 업로드 모드 */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {/* 업로드 진행 상태 */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                {uploadProgress.status === 'presigning' && <span>업로드 준비 중...</span>}
                {uploadProgress.status === 'uploading' && (
                  <span>업로드 중... {uploadProgress.progress}%</span>
                )}
                {uploadProgress.status === 'completing' && <span>업로드 완료 처리 중...</span>}
              </div>
              {uploadProgress.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* 에러 메시지 */}
          {uploadProgress.status === 'error' && uploadProgress.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {uploadProgress.error}
            </div>
          )}
        </div>
      )}

      {/* 미리보기 */}
      {currentThumbnailUrl && (
        <div className="relative">
          <Thumbnail src={currentThumbnailUrl} alt="Thumbnail preview" className="w-full" />
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 빈 상태 */}
      {!currentThumbnailUrl && !isUploading && (
        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-8 bg-gray-50">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {mode === 'url' ? '이미지 URL을 입력하세요' : '이미지를 선택하세요'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
