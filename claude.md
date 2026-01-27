# CLAUDE.md

## 프로젝트 개요

사용자가 자신만의 블로그를 생성하고 관리할 수 있는 Next.js 기반 멀티테넌트 블로깅 플랫폼

## 기술 스택

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| Framework | Next.js | 16.1.3 |
| Runtime | React | 19.2.3 |
| Language | TypeScript | ^5 |
| State (Server) | TanStack React Query | ^5.90.19 |
| State (Client) | Zustand | ^5.0.10 |
| HTTP Client | Axios | ^1.13.2 |
| Styling | Tailwind CSS | ^4 |
| UI Components | Radix UI + shadcn/ui | v1.1-2.0 |
| Editor | Tiptap | ^3.16.0 |
| Form | React Hook Form + Zod | ^7.71.1 / ^4.3.5 |
| Animation | Framer Motion | ^12.29.0 |
| Icons | Lucide React | ^0.562.0 |
| Date | Day.js | ^1.11.19 |
| Testing | Vitest + Testing Library | ^1.0.4 |

## 디렉토리 구조

```
src/
├── app/                  # Next.js App Router 페이지
├── components/
│   ├── ui/              # shadcn/ui 기본 컴포넌트
│   ├── app/             # 어드민 관련 컴포넌트
│   │   ├── editor/      # Tiptap 에디터
│   │   ├── post/        # 포스트 표시
│   │   ├── settings/    # 사이트 설정
│   │   ├── form/        # 폼 입력 컴포넌트
│   │   ├── layout/      # 어드민 레이아웃
│   │   └── modal/       # 모달
│   ├── public/          # 퍼블릭 블로그 컴포넌트
│   ├── auth/            # 인증 관련
│   └── common/          # 공통 유틸리티 컴포넌트
├── hooks/               # 커스텀 훅 (use-*.ts)
├── lib/
│   ├── api/             # API 클라이언트 (client.ts, server.ts)
│   ├── error-handler.ts # 에러 처리
│   ├── error-messages.ts # 에러 코드 → 메시지 매핑
│   ├── sanitize.ts      # HTML sanitization
│   └── utils.ts         # cn() 헬퍼
├── stores/              # Zustand 스토어 (*-store.ts)
└── test/                # 테스트 유틸리티
```

## 자주 쓰는 명령어

```bash
# 개발 서버 (로컬)
pnpm local          # APP_ENV=local, port 3001

# 개발 서버
pnpm dev

# 빌드 & 실행
pnpm build
pnpm start          # port 3001

# 린트
pnpm lint

# 테스트
pnpm test           # 단위 테스트
pnpm test:ui        # 테스트 UI
pnpm test:coverage  # 커버리지 리포트
```

## 코딩 컨벤션

### 파일 네이밍

| 유형 | 규칙 | 예시 |
|-----|------|-----|
| 컴포넌트 | PascalCase | `AdminSidebar.tsx` |
| 훅 | kebab-case + `use-` | `use-posts.ts` |
| 유틸리티 | kebab-case | `error-handler.ts` |
| 스토어 | kebab-case + `-store` | `modal-store.ts` |
| 타입 | kebab-case | `types.ts` |

### Import 순서

```typescript
'use client';

// 1. React/Next.js
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// 2. 외부 라이브러리
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';

// 3. 내부 모듈 (@/ alias)
import { useAdminPosts } from '@/hooks/use-posts';
import { PostStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

### TypeScript 규칙

- Props 인터페이스: `{ComponentName}Props`
- State 인터페이스: `{Feature}State`
- Action 인터페이스: `{Feature}Actions`
- 컴포넌트에 JSDoc 주석 작성
- strict 모드 활성화

### 컴포넌트 구조

```typescript
'use client';

interface MyComponentProps {
  /** 설명 */
  value: string;
  onChange?: (value: string) => void;
}

/**
 * 컴포넌트 설명
 */
export function MyComponent({ value, onChange }: MyComponentProps) {
  // hooks
  // handlers
  // render
}
```

## 아키텍처 패턴

### 레이어 구조

```
Pages (app/)
  ↓
Components (Client/Server)
  ↓
Hooks (데이터 페칭, 비즈니스 로직)
  ↓
Stores (Zustand - UI 상태만)
  ↓
API Layer (lib/api/)
  ↓
Backend
```

### 상태 관리 원칙

| 상태 유형 | 도구 | 예시 |
|----------|------|-----|
| 서버 상태 | React Query | 포스트, 카테고리, 사용자 데이터 |
| UI 상태 | Zustand | 사이드바 열림/닫힘, 모달 |
| 폼 상태 | React Hook Form | 입력값, 유효성 검사 |
| 로컬 상태 | useState | 임시 UI 상태 |

### API 호출 패턴

**클라이언트 (lib/api/client.ts)**
- Axios + 인터셉터
- 401 시 자동 토큰 갱신
- 요청 큐잉 (토큰 갱신 중)

**서버 (lib/api/server.ts)**
- Native fetch
- ISR 60초 revalidate
- 태그 기반 on-demand revalidation

### 에러 처리

```typescript
// lib/error-handler.ts에서 중앙 처리
// 에러 코드 → 한국어 메시지 (lib/error-messages.ts)

// API 에러 응답 형식
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "에러 메시지",
    details?: object
  }
}

// 특수 케이스
// 401 → 세션 만료 → 로그아웃
// 403 → 권한 없음
```

### 파일 업로드 (S3 Pre-signed URL)

1. 백엔드에서 pre-signed URL 요청
2. S3에 직접 PUT 업로드
3. 백엔드에 업로드 완료 알림
4. 업로드 중 진행률 표시

### 폼 패턴

```typescript
// React Hook Form + Zod
const schema = z.object({
  title: z.string().min(1, '필수 입력'),
});

const form = useForm({
  resolver: zodResolver(schema),
});

// FormProvider로 중첩 폼 지원
// Controller로 복잡한 필드 통합
```

## 환경 설정

### 환경 변수 (.env.local)

| 변수 | 필수 | 설명 |
|-----|:----:|------|
| `NEXT_PUBLIC_API_BASE_URL` | * | API 서버 URL |
| `NEXT_PUBLIC_APP_URL` | * | 앱 URL |
| `NEXT_PUBLIC_TENANT_DOMAIN` | * | 멀티테넌트 도메인 |
| `REVALIDATE_SECRET` | * | ISR 재검증 시크릿 |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | | 카카오 OAuth |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | | 네이버 OAuth |
| `GITHUB_TOKEN` | | GitHub API 토큰 |

### 멀티테넌트 구조

- 어드민: `/sites/[siteId]/...`
- 퍼블릭: `https://[slug].pagelet-dev.kr`

## 암묵적 규칙

### 반드시 지켜야 할 것

1. **클라이언트 컴포넌트**에는 `'use client'` 명시
2. **HTML 렌더링** 시 반드시 `sanitize()` 사용 (XSS 방지)
3. **서버 상태**는 React Query, **UI 상태**만 Zustand
4. **에러 토스트**는 React Query mutation cache에서 전역 처리
5. **ref 전달**이 필요한 컴포넌트는 `forwardRef` 사용

### 피해야 할 것

1. Props drilling - 훅으로 데이터 접근
2. 컴포넌트 내 직접 fetch - 반드시 훅 사용
3. localStorage 직접 접근 - 훅으로 추상화
4. 인라인 스타일 - Tailwind 클래스 사용

### 테스트 규칙

- 테스트 파일: `__tests__/` 디렉토리
- 통합 테스트 우선
- Testing Library + Vitest 사용
