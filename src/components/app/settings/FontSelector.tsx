'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUpdateAdminSiteSettings } from '@/hooks/use-site-settings';
import { FontKey } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface FontSelectorProps {
  siteId: string;
  currentFontKey: FontKey | null;
}

const FONT_OPTIONS = [
  {
    key: 'noto_sans' as FontKey,
    label: 'Noto Sans KR',
    description: '깔끔한 고딕체',
    fontFamily: '"Noto Sans KR", sans-serif',
  },
  {
    key: 'noto_serif' as FontKey,
    label: 'Noto Serif KR',
    description: '클래식한 명조체',
    fontFamily: '"Noto Serif KR", serif',
  },
] as const;

export function FontSelector({ siteId, currentFontKey }: FontSelectorProps) {
  const [selectedFont, setSelectedFont] = useState<FontKey | null>(currentFontKey);
  const updateSettings = useUpdateAdminSiteSettings(siteId);

  const isChanged = selectedFont !== currentFontKey;

  const handleSelect = useCallback((fontKey: FontKey) => {
    setSelectedFont(fontKey);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedFont) return;
    try {
      await updateSettings.mutateAsync({ fontKey: selectedFont });
    } catch {
      // 에러는 mutation에서 처리
    }
  }, [selectedFont, updateSettings]);

  const handleCancel = useCallback(() => {
    setSelectedFont(currentFontKey);
  }, [currentFontKey]);

  return (
    <div className="py-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">본문 폰트</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            블로그 전체에 적용될 기본 폰트를 선택하세요
          </p>
        </div>
        {isChanged && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={updateSettings.isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              {updateSettings.isPending ? '적용 중...' : '적용하기'}
            </Button>
          </div>
        )}
      </div>

      {/* 폰트 선택 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {FONT_OPTIONS.map((font) => {
          const isSelected = selectedFont === font.key;
          return (
            <button
              key={font.key}
              type="button"
              onClick={() => handleSelect(font.key)}
              className={cn(
                'relative p-4 rounded-lg border-2 text-left transition-all',
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{font.label}</p>
                  <p className="text-xs text-gray-500">{font.description}</p>
                </div>
                {/* 미리보기 */}
                <div
                  className="text-base text-gray-700 leading-relaxed"
                  style={{ fontFamily: font.fontFamily }}
                >
                  가나다라마바사
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
