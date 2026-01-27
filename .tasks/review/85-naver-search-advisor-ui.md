# [FE] Naver Search Advisor 키값 설정 UI 및 메타태그 구현

## GitHub 이슈

- **이슈 번호**: #85
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/85
- **생성일**: 2026-01-25
- **우선순위**: 중간
- **관련 태스크**: [BE] pagelet-api#88 (선행 필요)

## 개요

Naver Search Advisor 키값을 사이트 설정에서 입력할 수 있는 UI를 추가하고, 각 블로그 방문 시 해당 키값이 메타태그로 동적 렌더링되도록 구현합니다.

## 의존성

- [ ] leehydev/pagelet-api#88 - 백엔드 API 구현 완료 필요

## 작업 범위

### 포함

- API 타입 정의 업데이트
- 사이트 설정 페이지 SEO 섹션에 입력 필드 추가
- 블로그 레이아웃에서 동적 메타태그 렌더링

### 제외

- 백엔드 API 구현 (pagelet-api 담당)

## 기술 명세

### 영향받는 파일

- `src/lib/api/types.ts`
- `app/(app)/admin/[siteId]/settings/page.tsx`
- `app/(blog)/[slug]/layout.tsx`

### API 타입 변경

```typescript
// types.ts - SiteSettings 인터페이스
export interface SiteSettings {
  // ...기존 필드
  naverSearchAdvisorKey: string | null;
}

// types.ts - UpdateSiteSettingsRequest 인터페이스
export interface UpdateSiteSettingsRequest {
  // ...기존 필드
  naverSearchAdvisorKey?: string | null;
}
```

### Settings 페이지 UI

SEO 섹션에 입력 필드 추가:

```tsx
// app/(app)/admin/[siteId]/settings/page.tsx - SEO 섹션
<ValidationInput
  name="naverSearchAdvisorKey"
  label="Naver Search Advisor 키"
  placeholder="예: a1a0e077b45645abecc54a767e6d2eb997f12124"
  maxLength={255}
/>
<p className="text-sm text-muted-foreground">
  네이버 서치어드바이저에서 발급받은 사이트 인증 키값을 입력하세요.
</p>
```

Zod 스키마 업데이트:

```typescript
const settingsSchema = z.object({
  // ...기존 필드
  naverSearchAdvisorKey: z.string().max(255).nullable().optional(),
});
```

### 블로그 메타태그 렌더링

```typescript
// app/(blog)/[slug]/layout.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const settings = await getSiteSettingsBySlug(params.slug);

  return {
    // ...기존 메타데이터
    verification: {
      other: settings.naverSearchAdvisorKey
        ? { 'naver-site-verification': settings.naverSearchAdvisorKey }
        : undefined,
    },
  };
}
```

### 렌더링 결과

HTML head에 다음 메타태그 출력:

```html
<meta name="naver-site-verification" content="입력한키값" />
```

## 구현 체크리스트

- [ ] SiteSettings 인터페이스에 naverSearchAdvisorKey 추가
- [ ] UpdateSiteSettingsRequest에 naverSearchAdvisorKey 추가
- [ ] Zod 스키마에 naverSearchAdvisorKey 추가
- [ ] SEO 섹션에 입력 필드 UI 추가
- [ ] 블로그 layout.tsx에 동적 메타태그 렌더링 추가
- [ ] 기존 하드코딩된 verification 값과 충돌 없는지 확인

## 테스트 계획

- [ ] Settings 페이지에서 키값 입력 및 저장 테스트
- [ ] 저장된 키값이 정상적으로 불러와지는지 확인
- [ ] 블로그 페이지 소스에서 메타태그 출력 확인
- [ ] 키값이 없는 사이트에서 메타태그 미출력 확인
- [ ] Naver Search Advisor 사이트 인증 테스트

## 참고 자료

- 기존 SEO 필드 UI: `app/(app)/admin/[siteId]/settings/page.tsx`
- Next.js Metadata API: https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- Naver Search Advisor: https://searchadvisor.naver.com/
