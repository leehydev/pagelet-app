# Frontend: Admin Site Context (URL 기반)

## 목표

- 어드민 URL에 **siteId를 포함**하여 사이트 컨텍스트를 명시적으로 관리
- 모든 어드민 API 요청에 `X-Site-Id` 헤더를 자동으로 포함
- 북마크/공유 가능, SSR 친화적, 하이드레이션 이슈 없음

---

## 기술 스택

- Next.js (App Router)
- TanStack Query
- Axios
- Tailwind CSS + shadcn/ui

---

## 전체 흐름

```
[어드민 진입: /admin]
        ↓
GET /admin/sites (사이트 목록 조회)
        ↓
┌─────────────────────────────────────┐
│ 사이트 0개 → /onboarding/site 리다이렉트  │
│ 사이트 1개 → /admin/{siteId} 리다이렉트   │
│ 사이트 N개 → 사이트 선택 UI 표시          │
└─────────────────────────────────────┘
        ↓
[/admin/{siteId}/posts 등 진입]
        ↓
URL에서 siteId 추출 → X-Site-Id 헤더 자동 주입
```

---

## 1️⃣ URL 구조 변경

### Before (현재)

```
/admin                      → 대시보드
/admin/posts                → 게시글 목록
/admin/posts/new            → 게시글 작성
/admin/posts/[postId]       → 게시글 상세
/admin/posts/[postId]/edit  → 게시글 수정
/admin/categories           → 카테고리 목록
/admin/categories/new       → 카테고리 생성
/admin/categories/[id]/edit → 카테고리 수정
/admin/settings             → 사이트 설정
```

### After (변경)

```
/admin                              → 사이트 선택 또는 리다이렉트
/admin/[siteId]                     → 대시보드
/admin/[siteId]/posts               → 게시글 목록
/admin/[siteId]/posts/new           → 게시글 작성
/admin/[siteId]/posts/[postId]      → 게시글 상세
/admin/[siteId]/posts/[postId]/edit → 게시글 수정
/admin/[siteId]/categories          → 카테고리 목록
/admin/[siteId]/categories/new      → 카테고리 생성
/admin/[siteId]/categories/[id]/edit→ 카테고리 수정
/admin/[siteId]/settings            → 사이트 설정
```

### 폴더 구조 변경

```
app/(app)/admin/
├── layout.tsx              # 인증 체크만
├── page.tsx                # 사이트 선택 / 리다이렉트
└── [siteId]/
    ├── layout.tsx          # Site Switcher, 사이트 컨텍스트 제공
    ├── page.tsx            # 대시보드
    ├── posts/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [postId]/
    │       ├── page.tsx
    │       └── edit/page.tsx
    ├── categories/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/edit/page.tsx
    └── settings/
        └── page.tsx
```

---

## 2️⃣ API 연동

### A. 내 사이트 목록 조회

- `GET /admin/sites`
- 백엔드에 해당 엔드포인트 필요 (아직 없으면 추가)

```ts
export interface AdminSite {
  id: string;
  name: string;
  slug: string;
}

export async function getAdminSites(): Promise<AdminSite[]> {
  const response = await api.get<ApiResponse<AdminSite[]>>('/admin/sites');
  return response.data.data;
}
```

### B. React Query Hook

```ts
export function useAdminSites() {
  return useQuery({
    queryKey: ['admin', 'sites'],
    queryFn: getAdminSites,
  });
}
```

---

## 3️⃣ Request Layer: X-Site-Id 자동 주입

### Axios Interceptor

URL pathname에서 siteId를 추출하여 헤더에 주입:

```ts
// src/lib/api.ts
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // /admin/{siteId}/... 패턴에서 siteId 추출
    const match = window.location.pathname.match(/^\/admin\/([^/]+)/);
    if (match && match[1] !== 'undefined') {
      config.headers['X-Site-Id'] = match[1];
    }
  }
  return config;
});
```

### 참고: 서버 컴포넌트에서의 API 호출

서버 컴포넌트에서 API 호출이 필요한 경우, `params.siteId`를 직접 전달:

```ts
// app/(app)/admin/[siteId]/posts/page.tsx
export default async function PostsPage({ params }: { params: { siteId: string } }) {
  // 서버에서 호출 시 헤더 직접 설정
  const posts = await fetchAdminPosts(params.siteId);
  return <PostList posts={posts} />;
}
```

---

## 4️⃣ Site Context Provider (선택)

URL에서 siteId를 추출해서 하위 컴포넌트에 제공하는 Context:

```tsx
// src/contexts/site-context.tsx
'use client';

import { createContext, useContext } from 'react';

interface SiteContextValue {
  siteId: string;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ siteId, children }: { siteId: string; children: React.ReactNode }) {
  return <SiteContext.Provider value={{ siteId }}>{children}</SiteContext.Provider>;
}

export function useSiteContext() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSiteContext must be used within SiteProvider');
  }
  return context;
}
```

### Layout에서 사용

```tsx
// app/(app)/admin/[siteId]/layout.tsx
import { SiteProvider } from '@/contexts/site-context';

export default function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { siteId: string };
}) {
  return (
    <SiteProvider siteId={params.siteId}>
      <AdminHeader />
      <AdminSidebar />
      <main>{children}</main>
    </SiteProvider>
  );
}
```

---

## 5️⃣ Site Switcher UI

### 위치

`[siteId]/layout.tsx`의 Header 또는 Sidebar 상단

### 구현

```tsx
// src/components/layout/SiteSwitcher.tsx
'use client';

import { useRouter, usePathname, useParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminSites } from '@/hooks/use-admin-sites';

export function SiteSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentSiteId = params.siteId as string;

  const { data: sites, isLoading } = useAdminSites();

  const handleSiteChange = (newSiteId: string) => {
    // /admin/{oldSiteId}/posts/123 → /admin/{newSiteId}/posts/123
    const newPathname = pathname.replace(`/admin/${currentSiteId}`, `/admin/${newSiteId}`);
    router.push(newPathname);
  };

  if (isLoading || !sites) {
    return <div className="h-9 w-40 animate-pulse bg-muted rounded" />;
  }

  // 사이트 1개면 Select 비활성화
  if (sites.length <= 1) {
    return <div className="text-sm font-medium">{sites[0]?.name ?? '사이트 없음'}</div>;
  }

  return (
    <Select value={currentSiteId} onValueChange={handleSiteChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sites.map((site) => (
          <SelectItem key={site.id} value={site.id}>
            {site.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### UX 규칙

- 사이트 1개 → 사이트 이름만 표시 (변경 불가)
- 사이트 2개 이상 → Select로 전환 가능
- 전환 시 현재 페이지 경로 유지 (siteId만 교체)

---

## 6️⃣ 초기 진입 처리

### `/admin` 페이지 (사이트 선택)

```tsx
// app/(app)/admin/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSites } from '@/hooks/use-admin-sites';

export default function AdminIndexPage() {
  const router = useRouter();
  const { data: sites, isLoading, isError } = useAdminSites();

  useEffect(() => {
    if (isLoading || !sites) return;

    if (sites.length === 0) {
      // 사이트 없음 → 온보딩
      router.replace('/onboarding/site');
      return;
    }

    if (sites.length === 1) {
      // 사이트 1개 → 자동 진입
      router.replace(`/admin/${sites[0].id}`);
      return;
    }

    // 사이트 N개 → localStorage에서 마지막 선택 복구
    const lastSiteId = localStorage.getItem('pagelet.admin.lastSiteId');
    const validSite = sites.find((s) => s.id === lastSiteId);

    if (validSite) {
      router.replace(`/admin/${validSite.id}`);
    }
    // else: 사이트 선택 UI 표시 (아래 렌더링)
  }, [sites, isLoading, router]);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (isError) {
    return <div>사이트 목록을 불러오는데 실패했습니다.</div>;
  }

  // 사이트 N개 & 마지막 선택 없음 → 선택 UI
  if (sites && sites.length > 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">사이트 선택</h1>
        <div className="grid gap-2">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                localStorage.setItem('pagelet.admin.lastSiteId', site.id);
                router.push(`/admin/${site.id}`);
              }}
              className="px-6 py-3 border rounded-lg hover:bg-muted"
            >
              {site.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
```

### 마지막 선택 사이트 저장

사이트 전환 시 localStorage에 저장:

```ts
const handleSiteChange = (newSiteId: string) => {
  localStorage.setItem('pagelet.admin.lastSiteId', newSiteId);
  // ... 라우트 이동
};
```

---

## 7️⃣ 에러 처리

### 403: 사이트 접근 권한 없음

```ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // 사이트 목록 다시 조회 후 첫 번째 사이트로 이동
      // 또는 /admin으로 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  },
);
```

### 잘못된 siteId로 접근

`[siteId]/layout.tsx`에서 유효성 검증:

```tsx
// app/(app)/admin/[siteId]/layout.tsx
export default function SiteLayout({ params, children }) {
  const { data: sites } = useAdminSites();
  const router = useRouter();

  useEffect(() => {
    if (sites && !sites.find((s) => s.id === params.siteId)) {
      // 유효하지 않은 siteId → /admin으로 리다이렉트
      router.replace('/admin');
    }
  }, [sites, params.siteId, router]);

  // ...
}
```

---

## 8️⃣ Query 관리

### Query Key 구조

siteId를 queryKey에 포함하지 않음 (URL이 이미 siteId를 포함하므로):

```ts
['admin', 'posts'][('admin', 'categories')][('admin', 'settings')][('admin', 'sites')]; // X-Site-Id 헤더로 구분 // 사이트 목록 (siteId 무관)
```

### 사이트 전환 시 Invalidate

URL이 바뀌면 자동으로 컴포넌트가 리마운트되므로, 대부분의 경우 별도 invalidate 불필요.

필요한 경우:

```ts
const handleSiteChange = (newSiteId: string) => {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] === 'admin' && query.queryKey[1] !== 'sites',
  });
  router.push(`/admin/${newSiteId}`);
};
```

---

## 9️⃣ 마이그레이션 체크리스트

### 폴더 구조 변경

- [ ] `app/(app)/admin/[siteId]/` 폴더 생성
- [ ] 기존 페이지들을 `[siteId]/` 하위로 이동
- [ ] 각 페이지에서 `params.siteId` 접근 가능 확인

### 컴포넌트 수정

- [ ] `AdminSidebar` 링크 수정 (`/admin/posts` → `/admin/${siteId}/posts`)
- [ ] `AdminHeader`에 `SiteSwitcher` 추가
- [ ] 기존 하드코딩된 `/admin/...` 경로 모두 수정

### API 연동

- [ ] `api.ts`에 X-Site-Id interceptor 추가
- [ ] `useAdminSites` hook 추가
- [ ] 백엔드 `GET /admin/sites` 엔드포인트 확인/추가

### 테스트

- [ ] 사이트 전환 시 데이터 갱신 확인
- [ ] 새로고침 시 URL 유지 확인
- [ ] 북마크 후 재진입 확인
- [ ] 권한 없는 사이트 접근 시 에러 처리 확인

---

## Definition of Done

- [ ] `/admin` 진입 시 사이트 선택 또는 자동 리다이렉트
- [ ] 모든 어드민 URL에 siteId 포함
- [ ] Site Switcher로 사이트 전환 가능
- [ ] 전환 시 URL 변경 + 데이터 갱신
- [ ] 새로고침/북마크 후에도 올바른 사이트 컨텍스트 유지
- [ ] 모든 어드민 API 요청에 X-Site-Id 헤더 포함
