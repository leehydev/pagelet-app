# Pagelet Frontend Project

## 프로젝트 개요

Pagelet은 멀티테넌트 블로그 플랫폼입니다. 사용자가 자신만의 블로그 사이트를 생성하고 관리할 수 있습니다.

- **프레임워크**: Next.js 16.1.3 (App Router, Turbopack)
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS v4
- **상태관리**: TanStack Query (서버 상태), Zustand (클라이언트 상태)
- **폼 처리**: React Hook Form + Zod
- **UI 컴포넌트**: shadcn/ui (new-york 스타일)
- **에디터**: Tiptap
- **아이콘**: Lucide React

## 아키텍처

### 멀티테넌트 구조

```
app.pagelet-dev.kr     → 관리자 대시보드 (app 라우트 그룹)
{slug}.pagelet-dev.kr  → 테넌트별 공개 블로그 (public 라우트 그룹)
```

`proxy.ts` 미들웨어가 서브도메인을 감지하여 `/t/[slug]/*` 경로로 rewrite합니다.

### 디렉토리 구조

```
app/
├── (app)/          # 인증 필요 페이지 (Admin 대시보드)
│   └── admin/[siteId]/  # 사이트별 관리 페이지
├── (auth)/         # 인증 관련 (signin, signup, onboarding)
├── (public)/       # 공개 페이지 (테넌트 블로그)
│   └── t/[slug]/   # 테넌트별 블로그 라우트
└── api/            # API Routes

src/
├── components/     # React 컴포넌트
│   ├── ui/        # shadcn/ui 기본 컴포넌트
│   ├── editor/    # Tiptap 에디터 관련
│   ├── layout/    # 레이아웃 (AdminSidebar, Header 등)
│   └── public/    # 공개 블로그용 컴포넌트
├── hooks/          # Custom React Hooks (use-*.ts)
├── lib/
│   ├── api/       # API 클라이언트 (client.ts: CSR, server.ts: SSR/ISR)
│   └── ...        # 유틸리티 함수들
└── stores/         # Zustand 스토어
```

## 필수 규칙

### 1. 언어

- **모든 UI 텍스트, 에러 메시지, 주석은 한국어로 작성**
- 코드(변수명, 함수명, 타입명)는 영어 사용

### 2. API 응답 규격

백엔드는 일관된 응답 형식을 사용합니다:

```typescript
// 성공
{ success: true, data: T, timestamp: string }

// 실패
{ success: false, error: { code: string, message: string, timestamp: string } }
```

**API 함수 작성 시 반드시 `response.data.data`로 접근:**

```typescript
// ✅ 올바른 예시
export async function getAdminPosts(): Promise<Post[]> {
  const response = await api.get<ApiResponse<Post[]>>('/admin/posts');
  return response.data.data;
}
```

### 3. React Query 패턴

```typescript
// 1. src/lib/api/client.ts에 API 함수 정의
// 2. src/hooks/use-*.ts에 훅으로 래핑
// 3. 컴포넌트에서 훅 사용

// Query Key 규칙
const postKeys = {
  all: ['posts'] as const,
  adminList: (siteId: string) => ['admin', 'posts', siteId] as const,
  detail: (siteId: string, postId: string) => ['admin', 'post', siteId, postId] as const,
};
```

### 4. ISR (Incremental Static Regeneration)

공개 블로그 페이지는 ISR을 사용합니다:

```typescript
// src/lib/api/server.ts - SSR/ISR용
const res = await fetch(url, {
  next: {
    revalidate: 60,
    tags: [`posts-${siteSlug}`],
  },
});
```

**콘텐츠 변경 시 반드시 revalidation 호출:**

```typescript
import { revalidatePost } from '@/lib/api';
await revalidatePost(siteSlug, postSlug);
```

### 5. 폼 처리

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  slug: z.string().regex(/^[a-z0-9-]+$/, '영소문자, 숫자, 하이픈만 사용 가능'),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { title: '', slug: '' },
});
```

### 6. 에러 처리

```typescript
import { getErrorDisplayMessage, getErrorCode } from '@/lib/error-handler';
import { toast } from 'sonner';

try {
  await mutation.mutateAsync(data);
  toast.success('저장되었습니다');
} catch (err) {
  const message = getErrorDisplayMessage(err, '저장에 실패했습니다');
  toast.error(message);
}
```

새 에러 코드 추가 시 `src/lib/error-messages.ts`에 매핑 필수.

### 7. 클라이언트 컴포넌트

React Query, 상태관리, 이벤트 핸들러 사용 시 반드시 `'use client'` 지시어 추가:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
```

### 8. shadcn/ui 컴포넌트

새 컴포넌트 필요 시:

```bash
npx shadcn@latest add [component-name]
```

기존 설치된 주요 컴포넌트: button, input, textarea, label, alert-dialog, separator, sheet, sidebar, skeleton, tooltip, badge, select

### 9. 파일 네이밍

| 유형     | 네이밍                  | 예시                   |
| -------- | ----------------------- | ---------------------- |
| 컴포넌트 | PascalCase              | `PostContent.tsx`      |
| Hooks    | kebab-case + use prefix | `use-posts.ts`         |
| 유틸리티 | kebab-case              | `error-handler.ts`     |
| API 타입 | types.ts에 통합         | `src/lib/api/types.ts` |

### 10. 게시글 상태

```typescript
const PostStatus = {
  DRAFT: 'DRAFT', // 임시저장
  PUBLISHED: 'PUBLISHED', // 발행됨
  PRIVATE: 'PRIVATE', // 비공개
} as const;
```

## 주요 패턴

### Admin 페이지 레이아웃

```typescript
export default function AdminPage() {
  return (
    <>
      <AdminPageHeader
        breadcrumb="Posts"
        title="게시글 목록"
        action={{ label: '새 글', href: '/admin/.../new', icon: Plus }}
      />
      <div className="p-8">{/* 콘텐츠 */}</div>
    </>
  );
}
```

### 로딩 상태

```typescript
if (isLoading) {
  return (
    <div className="animate-pulse space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### 에러 상태

```typescript
if (error || !data) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-700">데이터를 불러올 수 없습니다.</p>
    </div>
  );
}
```

## 환경 변수

```bash
NEXT_PUBLIC_API_BASE_URL=  # 백엔드 API URL
NEXT_PUBLIC_TENANT_DOMAIN= # 테넌트 도메인 (예: pagelet-dev.kr)
REVALIDATE_SECRET=         # ISR revalidation 시크릿
```

## 개발 명령어

```bash
npm run local   # 로컬 개발 (포트 3001, APP_ENV=local)
npm run build   # 프로덕션 빌드
npm run lint    # ESLint 검사
npm run test    # Vitest 테스트
```

## GitHub CLI 사용법

프로젝트에서 GitHub 이슈 관리는 GitHub CLI(`gh`)를 사용합니다.

### 설치 및 인증

```bash
# GitHub CLI 설치 확인
gh --version

# GitHub 인증 (처음 사용 시)
gh auth login

# 인증 상태 확인
gh auth status

# 인증이 만료된 경우 재인증
gh auth login -h github.com
```

### 토큰 방식 인증 (권장)

브라우저 인증이 실패하거나 CI/CD 환경에서 사용할 때는 Personal Access Token(PAT)을 사용합니다.

#### 1. GitHub에서 Personal Access Token 생성

1. GitHub 웹사이트 접속: https://github.com/settings/tokens
2. **Generate new token** → **Generate new token (classic)** 클릭
3. 토큰 설정:
   - **Note**: `Pagelet Project - CLI Access` (설명)
   - **Expiration**: 원하는 만료 기간 선택 (90일, 1년 등)
   - **Scopes**: 다음 권한 선택
     - ✅ `repo` (전체 저장소 접근)
     - ✅ `read:org` (조직 읽기, 조직 저장소인 경우)
4. **Generate token** 클릭
5. 생성된 토큰을 복사 (한 번만 표시되므로 안전하게 보관)

#### 2. 환경 변수로 토큰 설정

```bash
# .env.local 또는 .env 파일에 추가 (로컬 개발용)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 또는 직접 gh 명령어로 설정
gh auth login --with-token < token.txt

# 또는 한 줄로 설정
echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | gh auth login --with-token
```

#### 3. 토큰으로 인증

```bash
# 방법 1: 환경 변수 사용 (가장 안전)
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
gh auth status  # 인증 확인

# 방법 2: 직접 토큰 전달
echo "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" | gh auth login --with-token

# 방법 3: 파일에서 읽기
gh auth login --with-token < ~/.github/token.txt
```

#### 4. 토큰 인증 확인

```bash
# 인증 상태 확인
gh auth status

# 이슈 목록 조회로 테스트
gh issue list
```

#### 5. 토큰 보안 관리

```bash
# .env.local 파일에 추가 (Git에 커밋하지 않음)
echo "GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" >> .env.local

# 또는 macOS Keychain에 저장 (macOS만)
gh auth login --with-token < token.txt
# 이후 자동으로 Keychain에 저장됨

# 환경 변수로 사용 (스크립트에서)
export GITHUB_TOKEN=$(cat ~/.github/token.txt)
gh issue list
```

#### 6. 토큰 만료 시 갱신

```bash
# 새 토큰 생성 후 다시 설정
export GITHUB_TOKEN=ghp_new_token_here
gh auth refresh -h github.com -s repo
```

### 토큰 방식 인증 예시

```bash
# 1. 토큰을 환경 변수로 설정
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. 인증 확인
gh auth status

# 3. 이슈 생성
gh issue create \
  --title "게시글 목록 페이지네이션 구현" \
  --body-file github-issue-pagination.md \
  --label "enhancement,frontend"
```

### 인증 방식 비교

| 방식                            | 장점                               | 단점                          | 사용 시기              |
| ------------------------------- | ---------------------------------- | ----------------------------- | ---------------------- |
| 브라우저 인증 (`gh auth login`) | 간편함, 자동 갱신                  | 브라우저 필요, CI/CD에서 불편 | 로컬 개발              |
| 토큰 인증 (`--with-token`)      | CI/CD 친화적, 스크립트 자동화 가능 | 토큰 관리 필요                | CI/CD, 자동화 스크립트 |

### 이슈 관리

```bash
# 이슈 생성
gh issue create --title "이슈 제목" --body "이슈 내용"

# 파일에서 이슈 생성
gh issue create --title "이슈 제목" --body-file issue-template.md

# 이슈 목록 조회
gh issue list

# 이슈 상세 조회
gh issue view <이슈번호>

# 이슈에 레이블 추가
gh issue edit <이슈번호> --add-label "enhancement,frontend"
```

### 이슈 생성 예시

```bash
# 기본 이슈 생성
gh issue create \
  --title "게시글 목록 페이지네이션 구현" \
  --body "## 개요
관리자 게시글 목록 페이지에 페이지네이션 기능을 추가합니다.

## 작업 내용
- [ ] 백엔드 API 수정
- [ ] 프론트엔드 타입 정의
..." \
  --label "enhancement,frontend"

# 마크다운 파일에서 이슈 생성
gh issue create \
  --title "게시글 목록 페이지네이션 구현" \
  --body-file github-issue-pagination.md \
  --label "enhancement,frontend"
```

## 주의사항

1. **타입 안정성**: `any` 사용 최소화, API 타입은 `src/lib/api/types.ts`에 정의
2. **인증**: 401 에러 시 자동으로 `/signin`으로 리다이렉트
3. **이미지 업로드**: Pre-signed URL 방식 사용 (`use-upload.ts`, `use-branding-upload.ts`)
4. **HTML Sanitization**: 사용자 입력 HTML은 `src/lib/sanitize.ts`의 `sanitizeHtml` 사용
5. **날짜 처리**: `dayjs` 라이브러리 사용, 포맷팅은 `src/lib/date-utils.ts`

## 서브에이전트

프로젝트 작업은 두 개의 서브에이전트로 분리하여 진행합니다.

### Architect (`.claude/agents/architect.md`)

요구사항을 분석하고 작업을 계획하는 에이전트입니다.

- 요구사항 분석 및 작업 분해
- GitHub 이슈 생성 (프로젝트: `pagelet`)
- 태스크 파일 생성: `.tasks/backlog/[이슈번호]-[업무-이름].md`

**사용 시점**: 새로운 기능 요청, 버그 리포트, 작업 계획이 필요할 때

### Developer (`.claude/agents/developer.md`)

정의된 태스크를 구현하는 에이전트입니다.

- 브랜치 생성: `feature/[이슈번호]-[간단한-설명]`
- 코드 구현 및 테스트
- 빌드/린트 검증 후 PR 생성

**사용 시점**: 태스크 파일이 준비된 후 실제 구현이 필요할 때

### 태스크 관리 구조

```
.tasks/
├── backlog/        # 대기 중 (Architect가 생성)
├── in-progress/    # 진행 중 (Developer가 작업 중)
├── review/         # PR 리뷰 대기
└── done/           # 완료
```
