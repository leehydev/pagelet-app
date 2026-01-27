# [FE] 베타 버전 가입 대기(Waitlist) UI 구현

## GitHub 이슈

- **이슈 번호**: #44
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/44
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-api#39 (백엔드)

## 개요

베타 기간 동안 신규 가입자가 바로 서비스를 사용할 수 없도록 가입 대기 페이지를 구현합니다.
온보딩 완료 후 `PENDING` 상태 사용자에게 "가입 대기중" 페이지만 보여주고, 관리자 승인 후 어드민 대시보드 접근을 허용합니다.

## 작업 범위

### 포함

- `PENDING` 계정 상태 타입 추가
- 가입 대기 페이지 (`/waiting`) 구현
- 온보딩 완료 후 대기 페이지로 리다이렉트
- `PENDING` 상태에서 어드민 접근 차단 로직
- 에러 메시지 매핑 추가 (`ACCOUNT_PENDING`)

### 제외

- 슈퍼 관리자 대시보드 UI (MVP 이후)
- 승인 알림 (이메일 등)

## 기술 명세

### 영향받는 파일

```
src/lib/api/types.ts                        # AccountStatus에 PENDING 추가
src/lib/error-messages.ts                   # ACCOUNT_PENDING 에러 메시지
app/(auth)/waiting/page.tsx                 # (신규) 가입 대기 페이지
app/(auth)/onboarding/site/page.tsx         # 완료 후 /waiting으로 리다이렉트
app/(auth)/auth/success/page.tsx            # PENDING 상태 처리
app/(app)/admin/page.tsx                    # PENDING 상태 처리
```

### 새 페이지

#### `/waiting` - 가입 대기 페이지

```tsx
// app/(auth)/waiting/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function WaitingPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading || !user) return;

    // ACTIVE 상태면 어드민으로 리다이렉트
    if (user.accountStatus === AccountStatus.ACTIVE) {
      router.replace('/admin');
    }
    // ONBOARDING 상태면 온보딩으로 리다이렉트
    if (user.accountStatus === AccountStatus.ONBOARDING) {
      router.replace('/onboarding/profile');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">가입 신청이 완료되었습니다</h1>
        <p className="text-gray-600 mb-6">
          현재 베타 서비스 운영 중이므로 관리자 승인 후 서비스를 이용하실 수 있습니다.
        </p>
        <p className="text-sm text-gray-500">승인이 완료되면 등록하신 이메일로 안내드리겠습니다.</p>
      </div>
    </div>
  );
}
```

### 라우팅 로직 변경

#### 1. 온보딩 완료 후 (site/page.tsx)

```typescript
// 기존
router.push('/admin');

// 변경
router.push('/waiting');
```

#### 2. 인증 성공 후 (auth/success/page.tsx)

```typescript
useEffect(() => {
  if (isSuccess && user) {
    if (user.accountStatus === AccountStatus.PENDING) {
      router.replace('/waiting');
    } else if (user.accountStatus === AccountStatus.ONBOARDING) {
      router.replace('/onboarding/profile');
    } else {
      router.replace('/admin');
    }
  }
}, [isSuccess, user, router]);
```

#### 3. 어드민 접근 시 (admin/page.tsx)

```typescript
const { data: user } = useUser();

useEffect(() => {
  if (!user) return;

  // PENDING 상태면 /waiting으로 리다이렉트
  if (user.accountStatus === AccountStatus.PENDING) {
    router.replace('/waiting');
    return;
  }
  // ONBOARDING 상태면 온보딩으로 리다이렉트
  if (user.accountStatus === AccountStatus.ONBOARDING) {
    router.replace('/onboarding/profile');
    return;
  }

  // ... 기존 사이트 로딩 로직
}, [user, router]);
```

### 타입 정의

```typescript
// src/lib/api/types.ts
export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  PENDING: 'PENDING', // 추가: 가입 대기
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
```

### 에러 메시지

```typescript
// src/lib/error-messages.ts
const errorMessages: Record<string, string> = {
  // ... 기존 에러 메시지
  ACCOUNT_003: '계정이 승인 대기 중입니다. 관리자 승인 후 서비스를 이용할 수 있습니다.',
};
```

## 구현 체크리스트

- [ ] `AccountStatus`에 `PENDING` 상태 추가 (types.ts)
- [ ] 에러 메시지 매핑 추가 (error-messages.ts)
- [ ] 가입 대기 페이지 생성 (`/waiting`)
- [ ] 온보딩 완료 후 `/waiting` 리다이렉트 (site/page.tsx)
- [ ] `auth/success` 페이지 PENDING 상태 처리
- [ ] `admin` 페이지 PENDING 상태 처리
- [ ] UI/UX 테스트

## 테스트 계획

- [ ] 신규 가입 → 온보딩 완료 → /waiting 리다이렉트 확인
- [ ] PENDING 상태에서 /admin 접근 시 /waiting 리다이렉트
- [ ] ACTIVE 상태에서 정상적으로 /admin 접근 가능
- [ ] /waiting 페이지에서 ACTIVE 상태면 /admin으로 리다이렉트
- [ ] 에러 메시지 표시 확인

## 참고 자료

- 기존 코드: `app/(auth)/auth/success/page.tsx`
- 온보딩: `app/(auth)/onboarding/site/page.tsx`
- 어드민: `app/(app)/admin/page.tsx`
- API 타입: `src/lib/api/types.ts`
- 에러 메시지: `src/lib/error-messages.ts`
