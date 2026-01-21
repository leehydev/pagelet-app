'use client';

import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMySiteSettings, useUpdateSiteSettings } from '@/hooks/use-site-settings';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/form/ValidationInput';
import { ValidationTextarea } from '@/components/form/ValidationTextarea';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';

// Zod 스키마 정의
const siteSettingsSchema = z.object({
  // 브랜딩
  logo_image_url: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  favicon_url: z.string().url('올바른 URL 형식이어야 합니다').max(500).nullable().or(z.literal('')),
  // SEO
  og_image_url: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  seo_title: z.string().max(120, '최대 120자까지 입력 가능합니다').nullable().or(z.literal('')),
  seo_description: z.string().nullable().or(z.literal('')),
  seo_keywords: z.string().max(500).nullable().or(z.literal('')),
  canonical_base_url: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  robots_index: z.boolean(),
  // 연락처
  contact_email: z
    .string()
    .email('올바른 이메일 형식이어야 합니다')
    .max(255)
    .nullable()
    .or(z.literal('')),
  contact_phone: z.string().max(50).nullable().or(z.literal('')),
  address: z.string().nullable().or(z.literal('')),
  // 소셜 링크
  kakao_channel_url: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  naver_map_url: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  instagram_url: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  // 사업자 정보
  business_number: z.string().max(20).nullable().or(z.literal('')),
  business_name: z.string().max(100).nullable().or(z.literal('')),
  representative_name: z.string().max(50).nullable().or(z.literal('')),
});

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;

export default function SiteSettingsPage() {
  const { data: settings, isLoading, error } = useMySiteSettings();
  const updateSettings = useUpdateSiteSettings();

  const methods = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      logo_image_url: '',
      favicon_url: '',
      og_image_url: '',
      seo_title: '',
      seo_description: '',
      seo_keywords: '',
      canonical_base_url: '',
      robots_index: false,
      contact_email: '',
      contact_phone: '',
      address: '',
      kakao_channel_url: '',
      naver_map_url: '',
      instagram_url: '',
      business_number: '',
      business_name: '',
      representative_name: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
    setValue,
  } = methods;

  // 설정 로드 시 폼에 반영
  useEffect(() => {
    if (settings) {
      reset({
        logo_image_url: settings.logo_image_url || '',
        favicon_url: settings.favicon_url || '',
        og_image_url: settings.og_image_url || '',
        seo_title: settings.seo_title || '',
        seo_description: settings.seo_description || '',
        seo_keywords: settings.seo_keywords || '',
        canonical_base_url: settings.canonical_base_url || '',
        robots_index: settings.robots_index || false,
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        address: settings.address || '',
        kakao_channel_url: settings.kakao_channel_url || '',
        naver_map_url: settings.naver_map_url || '',
        instagram_url: settings.instagram_url || '',
        business_number: settings.business_number || '',
        business_name: settings.business_name || '',
        representative_name: settings.representative_name || '',
      });
    }
  }, [settings, reset]);

  // robots_index 필드 값 구독
  const robotsIndex = useWatch({
    control: methods.control,
    name: 'robots_index',
    defaultValue: false,
  });

  const onSubmit = async (data: SiteSettingsFormData) => {
    try {
      // 빈 문자열을 null로 변환
      const payload = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]),
      );
      await updateSettings.mutateAsync(payload);
    } catch {
      // 에러는 mutation에서 처리
    }
  };

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader breadcrumb="Management" title="Site Settings" />
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <AdminPageHeader breadcrumb="Management" title="Site Settings" />
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">설정을 불러오는데 실패했습니다.</div>
        </div>
      </div>
    );
  }

  // 사이트가 없는 경우 (온보딩 미완료)
  if (!settings) {
    return (
      <div>
        <AdminPageHeader breadcrumb="Management" title="Site Settings" />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🏠</div>
            <h2 className="text-xl font-medium text-gray-600 mb-2">
              사이트가 아직 생성되지 않았습니다
            </h2>
            <p className="text-gray-400">먼저 온보딩을 완료해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader breadcrumb="Management" title="Site Settings" />
      <div className="p-6">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">
              {settings.name} ({settings.slug})
            </span>
          </div>

          {/* 성공/에러 메시지 */}
          {updateSettings.isSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
              설정이 저장되었습니다.
            </div>
          )}
          {updateSettings.isError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              저장에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* 브랜딩 섹션 */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">브랜딩</h2>
                <div className="space-y-4">
                  <ValidationInput
                    name="logo_image_url"
                    label="로고 이미지 URL"
                    type="url"
                    placeholder="https://example.com/logo.png"
                  />
                  <ValidationInput
                    name="favicon_url"
                    label="파비콘 URL"
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </section>

              {/* SEO 섹션 */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO 설정</h2>
                <div className="space-y-4">
                  <ValidationInput
                    name="og_image_url"
                    label="OG 이미지 URL"
                    description="소셜 미디어 공유 시 표시될 이미지 (권장: 1200x630px)"
                    type="url"
                    placeholder="https://example.com/og-image.jpg"
                  />
                  <ValidationInput
                    name="seo_title"
                    label="SEO 제목"
                    description="최대 120자"
                    placeholder="사이트 제목"
                    maxLength={120}
                  />
                  <ValidationTextarea
                    name="seo_description"
                    label="SEO 설명"
                    placeholder="검색 결과에 표시될 사이트 설명"
                    rows={3}
                  />
                  <ValidationInput
                    name="seo_keywords"
                    label="SEO 키워드"
                    description="쉼표로 구분하여 입력"
                    placeholder="키워드1, 키워드2, 키워드3"
                  />
                  <ValidationInput
                    name="canonical_base_url"
                    label="Canonical 기본 URL"
                    type="url"
                    placeholder="https://yourdomain.com"
                  />
                  <SwitchField
                    label="검색 엔진 인덱싱 허용"
                    hint="비활성화 시 검색 엔진에서 사이트가 노출되지 않습니다"
                    checked={robotsIndex}
                    onChange={(checked) => setValue('robots_index', checked, { shouldDirty: true })}
                  />
                </div>
              </section>

              {/* 연락처 섹션 */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">연락처</h2>
                <div className="space-y-4">
                  <ValidationInput
                    name="contact_email"
                    label="이메일"
                    type="email"
                    placeholder="contact@example.com"
                  />
                  <ValidationInput
                    name="contact_phone"
                    label="전화번호"
                    type="tel"
                    placeholder="02-1234-5678"
                  />
                  <ValidationTextarea
                    name="address"
                    label="주소"
                    placeholder="서울시 강남구..."
                    rows={2}
                  />
                </div>
              </section>

              {/* 소셜 링크 섹션 */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">소셜 링크</h2>
                <div className="space-y-4">
                  <ValidationInput
                    name="kakao_channel_url"
                    label="카카오 채널 URL"
                    type="url"
                    placeholder="https://pf.kakao.com/..."
                  />
                  <ValidationInput
                    name="naver_map_url"
                    label="네이버 지도 URL"
                    type="url"
                    placeholder="https://naver.me/..."
                  />
                  <ValidationInput
                    name="instagram_url"
                    label="인스타그램 URL"
                    type="url"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </section>

              {/* 사업자 정보 섹션 */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">사업자 정보</h2>
                <div className="space-y-4">
                  <ValidationInput
                    name="business_number"
                    label="사업자등록번호"
                    placeholder="123-45-67890"
                  />
                  <ValidationInput name="business_name" label="상호명" placeholder="(주)예시회사" />
                  <ValidationInput
                    name="representative_name"
                    label="대표자명"
                    placeholder="홍길동"
                  />
                </div>
              </section>

              {/* 저장 버튼 */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={!isDirty || isSubmitting}
                >
                  초기화
                </Button>
                <Button type="submit" disabled={isSubmitting || updateSettings.isPending}>
                  {isSubmitting || updateSettings.isPending ? '저장 중...' : '저장하기'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}

// ===== 폼 컴포넌트 =====

interface SwitchFieldProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchField({ label, hint, checked, onChange }: SwitchFieldProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
