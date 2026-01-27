# [FE] CTA 설정 UI

## GitHub 이슈

- **이슈 번호**: #46
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/46
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-api#41 (의존)

## 개요

사이트 설정 페이지에서 CTA 버튼을 구성할 수 있는 UI 구현.
버튼 타입, 텍스트/이미지, 링크 URL을 설정할 수 있다.

## 의존성

- pagelet-api#41 (CTA 설정 API) 완료 후 진행

## 작업 범위

### 포함

- 사이트 설정 페이지에 "CTA 버튼" 섹션 추가
- 버튼 타입 선택 (텍스트/이미지)
- 텍스트 입력 또는 이미지 업로드
- 링크 URL 입력
- 활성화/비활성화 토글

### 제외

- CTA 버튼 표시 (pagelet-app#47)
- 백엔드 API (pagelet-api#41)

## 기술 명세

### 영향받는 파일

- `app/(app)/admin/[siteId]/settings/page.tsx`
- `src/components/app/settings/CtaSettingsSection.tsx` (신규)
- `src/hooks/use-site-settings.ts` (기존 훅 수정)

### UI 구성

```
┌─────────────────────────────────────────┐
│ CTA 버튼 설정                           │
├─────────────────────────────────────────┤
│ [토글] CTA 버튼 활성화                  │
│                                         │
│ 버튼 타입                               │
│ ○ 텍스트 버튼  ○ 이미지 버튼           │
│                                         │
│ (텍스트 선택시)                         │
│ 버튼 문구: [________________]           │
│                                         │
│ (이미지 선택시)                         │
│ [이미지 업로드 영역]                    │
│                                         │
│ 링크 URL                                │
│ [https://________________]              │
│                                         │
│ [미리보기]                              │
│ ┌─────────────────────┐                │
│ │   상담 신청하기     │                │
│ └─────────────────────┘                │
└─────────────────────────────────────────┘
```

### 컴포넌트 Props

```typescript
interface CtaSettingsSectionProps {
  settings: SiteSettings;
  onUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
  isLoading: boolean;
}
```

### 상태 관리

기존 사이트 설정 훅(use-site-settings)을 확장하여 CTA 필드 관리

## 구현 체크리스트

- [ ] CtaSettingsSection 컴포넌트 생성
- [ ] 활성화 토글 구현
- [ ] 버튼 타입 라디오 버튼 구현
- [ ] 텍스트 입력 필드 구현
- [ ] 이미지 업로드 구현
- [ ] 링크 URL 입력 필드 구현
- [ ] 미리보기 영역 구현
- [ ] settings 페이지에 섹션 추가
- [ ] API 연동 (저장/조회)

## 테스트 계획

- [ ] 텍스트 버튼 설정 및 저장
- [ ] 이미지 버튼 설정 및 저장
- [ ] 활성화/비활성화 토글
- [ ] 유효성 검증 (URL 형식 등)
