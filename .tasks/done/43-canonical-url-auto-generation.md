# [FE] canonicalBaseUrl 자동 결정 기능 - 프론트엔드

## GitHub 이슈

- **이슈 번호**: #43
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/43
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-api#38 (백엔드)

## 개요

현재 `canonicalBaseUrl`은 사용자가 관리자 설정 페이지에서 직접 입력하는 방식입니다.
이를 제거하고 백엔드에서 자동 생성된 값을 사용하도록 변경합니다.

### 변경 이유

- 사용자 실수 방지 (잘못된 URL 입력)
- 불필요한 설정 복잡성 제거
- 플랫폼 차원의 canonical URL 정책 일관성 보장

### Canonical URL 생성 규칙

- 개발: `https://{slug}.pagelet-dev.kr`
- 상용: `https://{slug}.pagelet.kr`
- 백엔드 API 응답에 자동 생성된 값 포함

## 작업 범위

### 포함

- 관리자 설정 페이지에서 `canonicalBaseUrl` 입력 필드 제거
- 폼 스키마에서 `canonicalBaseUrl` 필드 제거
- `UpdateSiteSettingsRequest` 타입에서 `canonicalBaseUrl` 필드 제거
- 공개 페이지 메타데이터에서 백엔드 응답의 `canonicalBaseUrl` 값 사용 (기존 로직 유지)

### 제외

- 백엔드 API 수정 (별도 태스크)
- `SiteSettings` 응답 타입에서 `canonicalBaseUrl` 필드는 유지 (읽기 전용)

## 기술 명세

### 영향받는 파일

- `app/(app)/admin/[siteId]/settings/page.tsx` - 입력 필드 제거, 폼 스키마 수정
- `src/lib/api/types.ts` - `UpdateSiteSettingsRequest`에서 필드 제거

### 설정 페이지 수정사항

**폼 스키마에서 제거:**

```typescript
// 제거할 부분
canonicalBaseUrl: z
  .string()
  .url('올바른 URL 형식이어야 합니다')
  .max(500)
  .nullable()
  .or(z.literal('')),
```

**기본값에서 제거:**

```typescript
// 제거할 부분
canonicalBaseUrl: '',
```

**useEffect에서 제거:**

```typescript
// 제거할 부분
canonicalBaseUrl: settings.canonicalBaseUrl || '',
```

**UI에서 제거:**

```tsx
// 제거할 부분
<ValidationInput
  name="canonicalBaseUrl"
  label="Canonical 기본 URL"
  type="url"
  placeholder="https://yourdomain.com"
/>
```

### 타입 수정

**UpdateSiteSettingsRequest에서 제거:**

```typescript
// src/lib/api/types.ts
export interface UpdateSiteSettingsRequest {
  // canonicalBaseUrl?: string | null;  // 제거
  // ... 다른 필드 유지
}
```

**SiteSettings 인터페이스는 유지:**

```typescript
// src/lib/api/types.ts
export interface SiteSettings {
  // canonicalBaseUrl은 유지 (읽기 전용, 백엔드에서 자동 생성)
  canonicalBaseUrl: string | null;
  // ...
}
```

### 공개 페이지 메타데이터

기존 로직 유지 - 백엔드에서 자동 생성된 `canonicalBaseUrl` 값 사용:

```typescript
// 변경 없음 - 기존 코드 유지
...(settings.canonicalBaseUrl && {
  alternates: {
    canonical: `${settings.canonicalBaseUrl}`,
  },
}),
```

## 구현 체크리스트

- [ ] 설정 페이지 폼 스키마에서 `canonicalBaseUrl` 제거
- [ ] 설정 페이지 기본값에서 `canonicalBaseUrl` 제거
- [ ] 설정 페이지 useEffect에서 `canonicalBaseUrl` 제거
- [ ] 설정 페이지 UI에서 `canonicalBaseUrl` 입력 필드 제거
- [ ] `UpdateSiteSettingsRequest` 타입에서 `canonicalBaseUrl` 제거
- [ ] 빌드 테스트
- [ ] 린트 검사

## 테스트 계획

- [ ] 설정 페이지에서 canonical URL 입력 필드가 없는지 확인
- [ ] 설정 저장 시 에러 없이 동작하는지 확인
- [ ] 공개 페이지 메타데이터에 canonical URL이 올바르게 설정되는지 확인

## 의존성

- 백엔드 태스크 완료 후 진행 권장 (API 응답에 자동 생성된 canonicalBaseUrl 포함)
- 프론트엔드 단독 배포 시에도 동작 가능 (기존 DB에 저장된 값 사용)

## 참고 자료

- 기존 설정 페이지: `app/(app)/admin/[siteId]/settings/page.tsx`
- API 타입: `src/lib/api/types.ts`
