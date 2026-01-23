'use client';

import { useCallback, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAdminSiteSettings, useUpdateAdminSiteSettings } from '@/hooks/use-site-settings';
import { useSiteId } from '@/contexts/site-context';
import { Button } from '@/components/ui/button';
import { ValidationInput } from '@/components/app/form/ValidationInput';
import { ValidationTextarea } from '@/components/app/form/ValidationTextarea';
import { BrandingUploader } from '@/components/app/settings/BrandingUploader';
import { FontSelector } from '@/components/app/settings/FontSelector';
import { CtaSettingsSection } from '@/components/app/settings/CtaSettingsSection';
import { AdminPageHeader } from '@/components/app/layout/AdminPageHeader';

// 섹션 정의
const SECTIONS = [
  { id: 'branding', label: '브랜딩' },
  { id: 'cta', label: 'CTA 버튼' },
  { id: 'seo', label: 'SEO 설정' },
  { id: 'contact', label: '연락처' },
  { id: 'social', label: '소셜 링크' },
  { id: 'business', label: '사업자 정보' },
] as const;

// Zod 스키마 정의 (브랜딩 URL은 별도 업로드로 관리)
const siteSettingsSchema = z.object({
  // SEO
  seoTitle: z.string().max(120, '최대 120자까지 입력 가능합니다').nullable().or(z.literal('')),
  seoDescription: z.string().nullable().or(z.literal('')),
  seoKeywords: z.string().max(500).nullable().or(z.literal('')),
  robotsIndex: z.boolean(),
  // 연락처
  contactEmail: z
    .string()
    .email('올바른 이메일 형식이어야 합니다')
    .max(255)
    .nullable()
    .or(z.literal('')),
  contactPhone: z.string().max(50).nullable().or(z.literal('')),
  address: z.string().nullable().or(z.literal('')),
  // 소셜 링크
  kakaoChannelUrl: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  naverMapUrl: z.string().url('올바른 URL 형식이어야 합니다').max(500).nullable().or(z.literal('')),
  instagramUrl: z
    .string()
    .url('올바른 URL 형식이어야 합니다')
    .max(500)
    .nullable()
    .or(z.literal('')),
  // 사업자 정보
  businessNumber: z.string().max(20).nullable().or(z.literal('')),
  businessName: z.string().max(100).nullable().or(z.literal('')),
  representativeName: z.string().max(50).nullable().or(z.literal('')),
});

type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;

export default function SiteSettingsPage() {
  const siteId = useSiteId();
  const { data: settings, isLoading, error } = useAdminSiteSettings(siteId);
  const updateSettings = useUpdateAdminSiteSettings(siteId);

  const methods = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      robotsIndex: false,
      contactEmail: '',
      contactPhone: '',
      address: '',
      kakaoChannelUrl: '',
      naverMapUrl: '',
      instagramUrl: '',
      businessNumber: '',
      businessName: '',
      representativeName: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
    setValue,
  } = methods;

  // 설정 로드 시 폼에 반영 (브랜딩 URL은 별도 관리)
  useEffect(() => {
    if (settings) {
      reset({
        seoTitle: settings.seoTitle || '',
        seoDescription: settings.seoDescription || '',
        seoKeywords: settings.seoKeywords || '',
        robotsIndex: settings.robotsIndex || false,
        contactEmail: settings.contactEmail || '',
        contactPhone: settings.contactPhone || '',
        address: settings.address || '',
        kakaoChannelUrl: settings.kakaoChannelUrl || '',
        naverMapUrl: settings.naverMapUrl || '',
        instagramUrl: settings.instagramUrl || '',
        businessNumber: settings.businessNumber || '',
        businessName: settings.businessName || '',
        representativeName: settings.representativeName || '',
      });
    }
  }, [settings, reset]);

  // 필드 값 구독
  const robotsIndex = useWatch({
    control: methods.control,
    name: 'robotsIndex',
    defaultValue: false,
  });

  // 폼 제출 핸들러
  const onSubmit = useCallback(
    async (data: SiteSettingsFormData) => {
      try {
        // 빈 문자열을 null로 변환
        const payload = Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]),
        );
        await updateSettings.mutateAsync(payload);
      } catch {
        // 에러는 mutation에서 처리
      }
    },
    [updateSettings],
  );

  // 섹션으로 스크롤
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 헤더 extra 컴포넌트
  const headerExtra = settings ? (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => reset()}
        disabled={!isDirty || isSubmitting}
      >
        초기화
      </Button>
      <Button
        type="button"
        size="sm"
        disabled={isSubmitting || updateSettings.isPending}
        onClick={handleSubmit(onSubmit)}
      >
        {isSubmitting || updateSettings.isPending ? '저장 중...' : '저장하기'}
      </Button>
    </div>
  ) : undefined;

  if (isLoading) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Site Settings" />
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminPageHeader breadcrumb="Management" title="Site Settings" />
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">설정을 불러오는데 실패했습니다.</div>
        </div>
      </>
    );
  }

  // 사이트가 없는 경우 (온보딩 미완료)
  if (!settings) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <AdminPageHeader breadcrumb="Management" title="Site Settings" extra={headerExtra} />
      <div className="p-6">
        <div className="flex gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1 max-w-7xl">
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

            {/* 브랜딩 섹션 (폼 밖에서 독립적으로 관리) */}
            <section
              id="branding"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20 mb-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">브랜딩</h2>
              <div className="divide-y divide-gray-100">
                <BrandingUploader
                  siteId={siteId}
                  type="logo"
                  title="로고"
                  description="권장: 가로형 200×60px 이상, PNG/JPG/SVG/WebP"
                  currentUrl={settings.logoImageUrl}
                  updatedAt={settings.updatedAt}
                />
                <BrandingUploader
                  siteId={siteId}
                  type="favicon"
                  title="파비콘"
                  description="브라우저 탭에 표시되는 아이콘. 권장: 32×32px, PNG/ICO"
                  currentUrl={settings.faviconUrl}
                  updatedAt={settings.updatedAt}
                />
                <BrandingUploader
                  siteId={siteId}
                  type="og"
                  title="OG 이미지"
                  description="소셜 미디어 공유 시 표시될 이미지. 권장: 1200×630px, PNG/JPG/WebP"
                  currentUrl={settings.ogImageUrl}
                  updatedAt={settings.updatedAt}
                />
                <FontSelector siteId={siteId} currentFontKey={settings.fontKey} />
              </div>
            </section>

            {/* CTA 버튼 섹션 (독립적으로 관리) */}
            <div className="mb-8">
              <CtaSettingsSection
                siteId={siteId}
                settings={settings}
                onUpdate={async (updates) => {
                  await updateSettings.mutateAsync(updates);
                }}
                isUpdating={updateSettings.isPending}
              />
            </div>

            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* SEO 섹션 */}
                <section
                  id="seo"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO 설정</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ValidationInput
                        name="seoTitle"
                        label="SEO 제목"
                        description="최대 120자"
                        placeholder="사이트 제목"
                        maxLength={120}
                      />
                      <ValidationInput
                        name="seoKeywords"
                        label="SEO 키워드"
                        description="쉼표로 구분하여 입력"
                        placeholder="키워드1, 키워드2, 키워드3"
                      />
                    </div>
                    <ValidationTextarea
                      name="seoDescription"
                      label="SEO 설명"
                      placeholder="검색 결과에 표시될 사이트 설명"
                      rows={3}
                    />
                    <SwitchField
                      label="검색 엔진 인덱싱 허용"
                      hint="비활성화 시 검색 엔진에서 사이트가 노출되지 않습니다"
                      checked={robotsIndex}
                      onChange={(checked) =>
                        setValue('robotsIndex', checked, { shouldDirty: true })
                      }
                    />
                  </div>
                </section>

                {/* 연락처 섹션 */}
                <section
                  id="contact"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">연락처</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ValidationInput
                        name="contactEmail"
                        label="이메일"
                        type="email"
                        placeholder="contact@example.com"
                      />
                      <ValidationInput
                        name="contactPhone"
                        label="전화번호"
                        type="tel"
                        placeholder="02-1234-5678"
                      />
                    </div>
                    <ValidationTextarea
                      name="address"
                      label="주소"
                      placeholder="서울시 강남구..."
                      rows={2}
                    />
                  </div>
                </section>

                {/* 소셜 링크 섹션 */}
                <section
                  id="social"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">소셜 링크</h2>
                  <div className="space-y-4">
                    <ValidationInput
                      name="kakaoChannelUrl"
                      label="카카오 채널 URL"
                      type="url"
                      placeholder="https://pf.kakao.com/..."
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <ValidationInput
                        name="naverMapUrl"
                        label="네이버 지도 URL"
                        type="url"
                        placeholder="https://naver.me/..."
                      />
                      <ValidationInput
                        name="instagramUrl"
                        label="인스타그램 URL"
                        type="url"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                </section>

                {/* 사업자 정보 섹션 */}
                <section
                  id="business"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 scroll-mt-20"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">사업자 정보</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ValidationInput
                        name="businessNumber"
                        label="사업자등록번호"
                        placeholder="123-45-67890"
                      />
                      <ValidationInput
                        name="businessName"
                        label="상호명"
                        placeholder="(주)예시회사"
                      />
                    </div>
                    <ValidationInput
                      name="representativeName"
                      label="대표자명"
                      placeholder="홍길동"
                      className="max-w-[calc(50%-0.5rem)]"
                    />
                  </div>
                </section>
              </form>
            </FormProvider>
          </div>

          {/* 오른쪽 섹션 네비게이션 */}
          <aside className="hidden lg:block w-48 shrink-0">
            <nav className="sticky top-24">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                섹션
              </p>
              <ul className="space-y-1">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left px-3 py-2 text-sm rounded-md transition-colors text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    >
                      {section.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </>
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
