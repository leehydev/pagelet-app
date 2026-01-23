'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrandingUpload } from '@/hooks/use-branding-upload';
import { SiteSettings, CtaType, UpdateSiteSettingsRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface CtaSettingsSectionProps {
  siteId: string;
  settings: SiteSettings;
  onUpdate: (updates: UpdateSiteSettingsRequest) => Promise<void>;
  isUpdating: boolean;
}

const IMAGE_VALIDATION = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  accept: 'image/png,image/jpeg,image/webp',
};

export function CtaSettingsSection({
  siteId,
  settings,
  onUpdate,
  isUpdating,
}: CtaSettingsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, upload, commit, reset, isUploading, isUploaded, isCommitting } = useBrandingUpload(
    siteId,
    'cta',
  );

  // settings.id를 key로 사용해 settings 변경 시 상태 리셋 추적
  const settingsKey = `${settings.id}-${settings.updatedAt}`;
  const [localSettingsKey, setLocalSettingsKey] = useState(settingsKey);

  // 로컬 상태 초기화 (settings가 외부에서 변경된 경우)
  const getInitialState = useCallback(() => ({
    ctaEnabled: settings.ctaEnabled || false,
    ctaType: (settings.ctaType || 'text') as CtaType,
    ctaText: settings.ctaText || '',
    ctaLink: settings.ctaLink || '',
  }), [settings]);

  const [ctaEnabled, setCtaEnabled] = useState(() => settings.ctaEnabled || false);
  const [ctaType, setCtaType] = useState<CtaType>(() => settings.ctaType || 'text');
  const [ctaText, setCtaText] = useState(() => settings.ctaText || '');
  const [ctaLink, setCtaLink] = useState(() => settings.ctaLink || '');

  // settings가 외부에서 변경된 경우 로컬 상태 리셋
  if (settingsKey !== localSettingsKey) {
    setLocalSettingsKey(settingsKey);
    const initial = getInitialState();
    setCtaEnabled(initial.ctaEnabled);
    setCtaType(initial.ctaType);
    setCtaText(initial.ctaText);
    setCtaLink(initial.ctaLink);
  }

  // 변경 감지 (useMemo로 계산)
  const hasChanges = useMemo(() => {
    return (
      ctaEnabled !== (settings.ctaEnabled || false) ||
      ctaType !== (settings.ctaType || 'text') ||
      ctaText !== (settings.ctaText || '') ||
      ctaLink !== (settings.ctaLink || '')
    );
  }, [ctaEnabled, ctaType, ctaText, ctaLink, settings]);

  // 이미지 URL (업로드 중이면 tmp, 아니면 현재 URL)
  const displayImageUrl = state.tmpPreviewUrl || settings.ctaImageUrl;
  const imageUrl = displayImageUrl
    ? state.tmpPreviewUrl
      ? displayImageUrl
      : `${displayImageUrl}?v=${settings.updatedAt || ''}`
    : null;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > IMAGE_VALIDATION.maxSize) {
        alert('파일 크기는 최대 2MB까지 가능합니다.');
        return;
      }

      if (!IMAGE_VALIDATION.allowedTypes.includes(file.type)) {
        alert('PNG, JPG, WebP 파일만 업로드 가능합니다.');
        return;
      }

      try {
        await upload(file);
      } catch {
        // 에러는 state.error로 표시됨
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [upload],
  );

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageCommit = useCallback(async () => {
    try {
      await commit();
    } catch {
      // 에러는 state.error로 표시됨
    }
  }, [commit]);

  const handleSave = useCallback(async () => {
    try {
      await onUpdate({
        ctaEnabled,
        ctaType,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
      });
      // 저장 후 settings가 업데이트되면 hasChanges가 자동으로 false가 됨
    } catch {
      // 에러 처리는 상위에서 수행
    }
  }, [onUpdate, ctaEnabled, ctaType, ctaText, ctaLink]);

  const handleReset = useCallback(() => {
    setCtaEnabled(settings.ctaEnabled || false);
    setCtaType(settings.ctaType || 'text');
    setCtaText(settings.ctaText || '');
    setCtaLink(settings.ctaLink || '');
    reset();
  }, [settings, reset]);

  return (
    <section
      id="cta"
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">CTA 버튼</h2>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isUpdating}
              >
                취소
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? '저장 중...' : '저장'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* 활성화 토글 */}
        <div className="flex items-start justify-between">
          <div>
            <Label className="text-sm font-medium text-gray-700">CTA 버튼 활성화</Label>
            <p className="text-xs text-gray-500 mt-0.5">
              블로그 게시글 하단에 CTA 버튼을 표시합니다
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={ctaEnabled}
            onClick={() => setCtaEnabled(!ctaEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              ctaEnabled ? 'bg-blue-600' : 'bg-gray-200',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                ctaEnabled ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        {ctaEnabled && (
          <>
            {/* 버튼 타입 선택 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">버튼 타입</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ctaType"
                    value="text"
                    checked={ctaType === 'text'}
                    onChange={() => setCtaType('text')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">텍스트 버튼</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ctaType"
                    value="image"
                    checked={ctaType === 'image'}
                    onChange={() => setCtaType('image')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">이미지 버튼</span>
                </label>
              </div>
            </div>

            {/* 텍스트 입력 (텍스트 타입 선택 시) */}
            {ctaType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="ctaText" className="text-sm font-medium text-gray-700">
                  버튼 문구
                </Label>
                <Input
                  id="ctaText"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="상담 신청하기"
                  maxLength={100}
                  className="max-w-md"
                />
                <p className="text-xs text-gray-500">최대 100자</p>
              </div>
            )}

            {/* 이미지 업로드 (이미지 타입 선택 시) */}
            {ctaType === 'image' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">버튼 이미지</Label>
                <div className="flex items-start gap-4">
                  {/* 이미지 미리보기 */}
                  <div className="shrink-0 w-48 h-12 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt="CTA 버튼 이미지"
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-gray-300">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 업로드 버튼 */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={IMAGE_VALIDATION.accept}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {isUploaded ? (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleImageCommit}
                          disabled={isCommitting}
                        >
                          {isCommitting ? '적용 중...' : '지금 적용하기'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={reset}
                          disabled={isCommitting}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImageUploadClick}
                        disabled={isUploading}
                      >
                        {isUploading ? '업로드 중...' : imageUrl ? '변경' : '업로드'}
                      </Button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      권장: 가로형 배너, PNG/JPG/WebP, 최대 2MB
                    </p>
                  </div>
                </div>

                {/* 에러 메시지 */}
                {state.error && <p className="text-xs text-red-500">{state.error}</p>}

                {/* 업로드 진행률 */}
                {isUploading && state.progress > 0 && (
                  <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 링크 URL */}
            <div className="space-y-2">
              <Label htmlFor="ctaLink" className="text-sm font-medium text-gray-700">
                링크 URL
              </Label>
              <Input
                id="ctaLink"
                type="url"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="https://example.com/contact"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500">버튼 클릭 시 이동할 URL</p>
            </div>

            {/* 미리보기 */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <Label className="text-sm font-medium text-gray-700">미리보기</Label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <CtaPreview
                  type={ctaType}
                  text={ctaText}
                  imageUrl={imageUrl}
                  link={ctaLink}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// CTA 버튼 미리보기 컴포넌트
function CtaPreview({
  type,
  text,
  imageUrl,
  link,
}: {
  type: CtaType;
  text: string;
  imageUrl: string | null;
  link: string;
}) {
  const buttonContent =
    type === 'text' ? (
      <span className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg inline-flex items-center gap-2 hover:bg-blue-700 transition-colors">
        {text || '버튼 문구를 입력하세요'}
        <ExternalLink className="w-4 h-4" />
      </span>
    ) : imageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt="CTA 버튼"
        className="max-h-12 rounded-lg hover:opacity-90 transition-opacity"
      />
    ) : (
      <span className="px-6 py-3 bg-gray-200 text-gray-500 font-medium rounded-lg">
        이미지를 업로드하세요
      </span>
    );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
        onClick={(e) => e.preventDefault()}
      >
        {buttonContent}
      </a>
    );
  }

  return <div className="inline-block">{buttonContent}</div>;
}
