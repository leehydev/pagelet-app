# [FE] 블로그 폰트 설정 UI 구현

## GitHub 이슈
- **이슈 번호**: #37
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/37
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: leehydev/pagelet-api#31 (백엔드) - **의존성**

## 개요
사용자가 블로그에 적용할 폰트를 어드민에서 선택하고, 공개 블로그 전체에 적용되도록 합니다.

## 작업 범위

### 포함
- 어드민 설정 페이지에 폰트 선택 UI 추가
- 미리보기 기능
- 공개 블로그 레이아웃에 폰트 CSS 변수 적용
- ISR 재검증 트리거

### 제외
- 커스텀 폰트 업로드
- Google Fonts 전체 목록 지원 (MVP는 2개만)

## 기술 명세

### 영향받는 파일
- `src/lib/api/types.ts`
- `app/(app)/admin/[siteId]/settings/page.tsx`
- `app/(public)/t/[slug]/layout.tsx`
- `src/components/app/settings/FontSelector.tsx` (신규)

### 타입 정의

```typescript
// src/lib/api/types.ts
export type FontKey = 'noto_sans' | 'noto_serif';

export interface SiteSettings {
  // ... 기존 필드
  fontKey: FontKey | null;
}

export interface UpdateSiteSettingsRequest {
  // ... 기존 필드
  fontKey?: FontKey | null;
}
```

### 폰트 설정

```typescript
// app/(public)/t/[slug]/layout.tsx
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';

const notoSans = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-base',
  display: 'swap',
});

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-base',
  display: 'swap',
});

function getFontClass(fontKey?: string | null) {
  switch (fontKey) {
    case 'noto_serif':
      return notoSerif.variable;
    case 'noto_sans':
    default:
      return notoSans.variable;
  }
}
```

### 어드민 UI 컴포넌트

```typescript
// src/components/app/settings/FontSelector.tsx
interface FontSelectorProps {
  value: FontKey | null;
  onChange: (fontKey: FontKey) => void;
}

const FONT_OPTIONS = [
  { key: 'noto_sans', label: 'Noto Sans KR', description: '깔끔한 고딕체' },
  { key: 'noto_serif', label: 'Noto Serif KR', description: '클래식한 명조체' },
] as const;
```

## 구현 체크리스트
- [ ] `src/lib/api/types.ts`에 `FontKey` 타입 및 필드 추가
- [ ] `FontSelector` 컴포넌트 생성 (드롭다운 + 미리보기)
- [ ] 어드민 설정 페이지 브랜딩 섹션에 폰트 선택 UI 통합
- [ ] 공개 블로그 레이아웃에 `next/font/google` 폰트 설정
- [ ] `fontKey`에 따른 CSS 변수 클래스 동적 적용
- [ ] 저장 시 ISR 재검증 확인

## 테스트 계획
- [ ] 어드민에서 폰트 드롭다운 선택 동작 확인
- [ ] 미리보기 텍스트에 선택한 폰트 즉시 반영
- [ ] 저장 후 공개 블로그 새로고침 시 폰트 적용 확인
- [ ] 기본값(noto_sans) 정상 동작 확인
- [ ] null 값일 때 기본 폰트 적용 확인

## 참고 자료
- 기존 설정 페이지: `app/(app)/admin/[siteId]/settings/page.tsx`
- 기존 테넌트 레이아웃: `app/(public)/t/[slug]/layout.tsx`
- BrandingUploader 패턴: `src/components/app/settings/BrandingUploader.tsx`
- Next.js Font 최적화: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
