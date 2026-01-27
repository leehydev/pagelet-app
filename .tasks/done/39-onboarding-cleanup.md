# [FE] 온보딩 완료 로직 정리

## GitHub 이슈

- **이슈 번호**: #39
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/39
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: pagelet-api#35 (백엔드 간소화) - **선행 작업**

## 개요

백엔드 온보딩 플로우 간소화(pagelet-api#35)에 맞춰 프론트엔드 온보딩 완료 로직을 정리합니다. 백엔드에서 `createSite()` 호출 시 자동으로 온보딩이 완료되므로, 프론트엔드에서 별도의 `completeOnboarding()` 호출이 불필요해집니다.

## 작업 범위

### 포함

- `site/page.tsx`에서 `completeOnboarding()` 호출 제거
- API 클라이언트에서 불필요한 함수 제거

### 제외

- 온보딩 UI 변경 (이미 2단계로 구현됨)
- Stepper 컴포넌트 변경 (이미 2단계만 표시)

## 기술 명세

### 영향받는 파일

- `app/(auth)/onboarding/site/page.tsx`
- `src/lib/api/client.ts`

### 코드 변경

#### site/page.tsx

```typescript
// 변경 전
const mutation = useMutation({
  mutationFn: async (data: { name: string; slug: string }) => {
    await createSite(data);
    await completeOnboarding(); // 제거
  },
  // ...
});

// 변경 후
const mutation = useMutation({
  mutationFn: async (data: { name: string; slug: string }) => {
    await createSite(data);
    // completeOnboarding() 제거됨
  },
  // ...
});
```

#### client.ts

```typescript
// 제거할 함수들
export async function skipFirstPost(): Promise<void> {
  await api.post('/onboarding/skip-first-post');
}

export async function completeOnboarding(): Promise<void> {
  await api.post('/onboarding/complete');
}
```

### Import 정리

```typescript
// site/page.tsx
// 변경 전
import { createSite, checkSlugAvailability, completeOnboarding } from '@/lib/api';

// 변경 후
import { createSite, checkSlugAvailability } from '@/lib/api';
```

## 구현 체크리스트

- [ ] `site/page.tsx`: mutation에서 `completeOnboarding()` 호출 제거
- [ ] `site/page.tsx`: import에서 `completeOnboarding` 제거
- [ ] `client.ts`: `skipFirstPost()` 함수 제거
- [ ] `client.ts`: `completeOnboarding()` 함수 제거
- [ ] `index.ts`: 재내보내기 정리 (있다면)
- [ ] TypeScript 컴파일 에러 없는지 확인
- [ ] ESLint 에러 없는지 확인

## 테스트 계획

- [ ] 온보딩 전체 플로우 테스트 (프로필 -> 사이트 생성 -> /admin 이동)
- [ ] 사이트 생성 후 사용자 상태가 ACTIVE인지 확인
- [ ] 빌드 성공 확인 (`npm run build`)
- [ ] 린트 통과 확인 (`npm run lint`)

## 참고 자료

- 현재 온보딩 레이아웃: `app/(auth)/onboarding/layout.tsx`
- 사이트 생성 페이지: `app/(auth)/onboarding/site/page.tsx`
- API 클라이언트: `src/lib/api/client.ts`
- 백엔드 이슈: https://github.com/leehydev/pagelet-api/issues/35
