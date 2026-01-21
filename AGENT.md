# 프론트엔드 개발 가이드

이 문서는 Pagelet 프론트엔드 프로젝트에서 코드를 작성할 때 따라야 할 규칙과 가이드라인을 설명합니다.

## 📋 목차

1. [백엔드 응답 규격](#백엔드-응답-규격)
2. [API 클라이언트 사용법](#api-클라이언트-사용법)
3. [에러 처리](#에러-처리)
4. [React Query 사용법](#react-query-사용법)
5. [shadcn/ui 컴포넌트 사용](#shadcnui-컴포넌트-사용)
6. [프로젝트 구조](#프로젝트-구조)
7. [코딩 가이드라인](#코딩-가이드라인)

---

## 백엔드 응답 규격

백엔드는 모든 API 응답을 일관된 형식으로 반환합니다.

### 성공 응답

```typescript
{
  success: true,
  data: T,  // 실제 데이터
  timestamp: string  // ISO 8601 형식
}
```

**예시:**

```typescript
{
  success: true,
  data: {
    id: "123",
    name: "카테고리명"
  },
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

### 에러 응답

```typescript
{
  success: false,
  error: {
    code: string,        // 에러 코드 (예: "CATEGORY_001")
    message: string,     // 에러 메시지
    details?: any,       // 추가 상세 정보 (선택)
    timestamp: string    // ISO 8601 형식
  }
}
```

**예시:**

```typescript
{
  success: false,
  error: {
    code: "CATEGORY_002",
    message: "이미 사용 중인 slug입니다.",
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

### API 함수 작성 시 주의사항

- 모든 API 함수는 `ApiResponse<T>` 타입을 사용하여 응답을 처리합니다.
- `response.data.data`를 통해 실제 데이터에 접근합니다.

```typescript
// ✅ 올바른 예시
export async function getAdminCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>('/admin/categories');
  return response.data.data; // response.data.data로 접근
}

// ❌ 잘못된 예시
export async function getAdminCategories(): Promise<Category[]> {
  const response = await api.get('/admin/categories');
  return response.data; // 이렇게 하면 안 됨
}
```

---

## API 클라이언트 사용법

### 기본 설정

API 클라이언트는 `src/lib/api.ts`에 정의되어 있습니다.

```typescript
import { api } from '@/lib/api';
```

### 주요 특징

- **자동 쿠키 전송**: `withCredentials: true`로 설정되어 인증 쿠키가 자동으로 전송됩니다.
- **자동 리다이렉트**: 401 에러 시 자동으로 `/signin` 페이지로 리다이렉트됩니다.
- **타입 안정성**: TypeScript 타입이 정의되어 있습니다.

### API 함수 추가하기

새로운 API 엔드포인트를 추가할 때는 `src/lib/api.ts`에 함수를 추가합니다.

```typescript
// ✅ 올바른 예시
export interface CreateCategoryRequest {
  slug: string;
  name: string;
  description?: string;
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>('/admin/categories', data);
  return response.data.data;
}
```

### 서버 사이드에서 사용하기

서버 컴포넌트나 ISR을 위해 `fetch`를 직접 사용할 때는 `ApiResponse<T>` 형식을 고려해야 합니다.

```typescript
// ✅ 올바른 예시 (ISR용)
export async function fetchPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const res = await fetch(
    `${API_BASE_URL}/public/categories?site_slug=${encodeURIComponent(siteSlug)}`,
    {
      next: { revalidate: 60 }, // ISR: 60초
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }

  const data: ApiResponse<PublicCategory[]> = await res.json();
  return data.data; // data.data로 접근
}
```

---

## 에러 처리

### 에러 메시지 표시

백엔드의 에러 코드를 한국어 메시지로 변환하여 사용자에게 표시합니다.

```typescript
import { getErrorDisplayMessage } from '@/lib/error-handler';

try {
  await createCategory(data);
} catch (err) {
  const message = getErrorDisplayMessage(err, '카테고리 생성에 실패했습니다.');
  toast.error(message);
  // 또는
  alert(message);
}
```

### 에러 코드 매핑

에러 코드는 `src/lib/error-messages.ts`에 정의되어 있습니다. 새로운 에러 코드가 추가되면 여기에 매핑을 추가해야 합니다.

```typescript
export const ErrorMessages: Record<string, string> = {
  CATEGORY_001: '카테고리를 찾을 수 없습니다.',
  CATEGORY_002: '이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.',
  // ...
};
```

### React Query와 함께 사용

React Query의 `onError` 콜백에서 에러를 처리할 수 있습니다.

```typescript
const mutation = useMutation({
  mutationFn: createCategory,
  onError: (error) => {
    const message = getErrorDisplayMessage(error, '카테고리 생성에 실패했습니다.');
    toast.error(message);
  },
  onSuccess: () => {
    toast.success('카테고리가 생성되었습니다.');
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  },
});
```

---

## React Query 사용법

### 기본 설정

React Query는 `src/lib/react-query.tsx`에서 설정되어 있으며, 전역 에러 처리가 포함되어 있습니다.

### Custom Hooks 패턴

API 호출은 custom hooks로 래핑하여 사용합니다. hooks는 `src/hooks/` 디렉토리에 위치합니다.

```typescript
// src/hooks/use-categories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminCategories, createCategory, Category } from '@/lib/api';

export function useAdminCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getAdminCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
```

### 컴포넌트에서 사용

```typescript
'use client';

import { useAdminCategories, useCreateCategory } from '@/hooks/use-categories';

export default function CategoriesPage() {
  const { data: categories, isLoading, error } = useAdminCategories();
  const createCategory = useCreateCategory();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div>에러 발생</div>;
  }

  return (
    <div>
      {categories?.map((category) => (
        <div key={category.id}>{category.name}</div>
      ))}
    </div>
  );
}
```

### Query Key 규칙

- Query key는 배열 형태로 사용합니다.
- 관련된 데이터는 동일한 prefix를 사용합니다.

```typescript
// ✅ 올바른 예시
['categories'][('categories', categoryId)][('posts', { categoryId })]['site-settings'];

// ❌ 잘못된 예시
('categories'); // 문자열이 아닌 배열 사용
```

---

## shadcn/ui 컴포넌트 사용

### 설치된 컴포넌트

프로젝트에는 다음 shadcn/ui 컴포넌트들이 설치되어 있습니다:

- `button`
- `input`
- `textarea`
- `label`
- `field`
- `alert-dialog`
- `navigation-menu`
- `separator`
- `sheet`
- `sidebar`
- `skeleton`
- `tooltip`

### 컴포넌트 사용 예시

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/ui/field';

export default function MyForm() {
  return (
    <form>
      <Field>
        <Label htmlFor="name">이름</Label>
        <Input id="name" />
      </Field>
      <Button type="submit">제출</Button>
    </form>
  );
}
```

### 새로운 컴포넌트 추가

새로운 shadcn/ui 컴포넌트가 필요하면 다음 명령어를 사용합니다:

```bash
npx shadcn@latest add [component-name]
```

예시:

```bash
npx shadcn@latest add card
npx shadcn@latest add select
```

### 스타일 가이드

- shadcn/ui는 Tailwind CSS를 사용합니다.
- `components.json`에서 스타일 설정을 확인할 수 있습니다.
- 현재 스타일: `new-york`
- 아이콘 라이브러리: `lucide-react`

```typescript
import { Plus, Edit, Trash } from 'lucide-react';

<Button>
  <Plus className="mr-2 h-4 w-4" />
  추가
</Button>;
```

---

## 프로젝트 구조

```
pagelet-app/
├── app/                    # Next.js App Router
│   ├── (app)/             # 인증 필요 페이지
│   │   └── admin/         # 관리자 페이지
│   ├── (auth)/            # 인증 관련 페이지
│   └── (public)/          # 공개 페이지
├── src/
│   ├── components/        # React 컴포넌트
│   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   ├── layout/       # 레이아웃 컴포넌트
│   │   └── ...
│   ├── hooks/            # Custom React Hooks
│   ├── lib/              # 유틸리티 및 설정
│   │   ├── api.ts        # API 클라이언트
│   │   ├── error-handler.ts
│   │   └── react-query.tsx
│   └── stores/           # 상태 관리 (Zustand)
└── public/               # 정적 파일
```

### 디렉토리 규칙

- **`app/`**: Next.js App Router 페이지
- **`src/components/`**: 재사용 가능한 컴포넌트
- **`src/hooks/`**: Custom hooks (주로 React Query 관련)
- **`src/lib/`**: 유틸리티 함수 및 설정
- **`src/stores/`**: 전역 상태 관리 (Zustand)

---

## 코딩 가이드라인

### 1. 파일 네이밍

- 컴포넌트: PascalCase (예: `CategoryList.tsx`)
- Hooks: camelCase with `use` prefix (예: `use-categories.ts`)
- 유틸리티: kebab-case (예: `error-handler.ts`)

### 2. TypeScript 사용

- 모든 파일은 TypeScript를 사용합니다.
- `any` 타입 사용을 최소화합니다.
- 인터페이스는 `src/lib/api.ts`에 정의된 것을 우선 사용합니다.

### 3. 클라이언트 컴포넌트

- React Query, 상태 관리, 이벤트 핸들러를 사용하는 컴포넌트는 `'use client'` 지시어를 추가합니다.

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';

export default function MyComponent() {
  // ...
}
```

### 4. 폼 처리

- `react-hook-form`과 `zod`를 사용하여 폼을 처리합니다.
- Validation은 `@hookform/resolvers`의 `zodResolver`를 사용합니다.

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  slug: z.string().min(1, 'slug를 입력해주세요'),
});

export default function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });

  // ...
}
```

### 5. 로딩 상태 처리

- 로딩 중일 때는 skeleton이나 spinner를 표시합니다.
- shadcn/ui의 `Skeleton` 컴포넌트를 사용할 수 있습니다.

```typescript
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

### 6. 에러 상태 처리

- 에러 발생 시 사용자에게 명확한 메시지를 표시합니다.
- `getErrorDisplayMessage`를 사용하여 한국어 메시지를 표시합니다.

### 7. 토스트 메시지

- 성공/에러 메시지는 `sonner`의 `toast`를 사용합니다.

```typescript
import { toast } from 'sonner';

toast.success('카테고리가 생성되었습니다.');
toast.error('오류가 발생했습니다.');
```

### 8. 라우팅

- Next.js App Router를 사용합니다.
- 동적 라우트는 `[param]` 형식을 사용합니다.
- 레이아웃은 `layout.tsx` 파일로 정의합니다.

### 9. 환경 변수

- 환경 변수는 `NEXT_PUBLIC_` prefix를 사용합니다.
- `.env.local` 파일에 정의합니다.

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
```

### 10. 인증 처리

- 401 에러는 자동으로 `/signin`으로 리다이렉트됩니다.
- 인증이 필요한 페이지는 적절한 가드를 구현합니다.

---

## 주요 패턴 요약

### API 호출 패턴

```typescript
// 1. api.ts에 함수 정의
export async function getData(): Promise<Data> {
  const response = await api.get<ApiResponse<Data>>('/endpoint');
  return response.data.data;
}

// 2. hooks에 래핑
export function useData() {
  return useQuery({
    queryKey: ['data'],
    queryFn: getData,
  });
}

// 3. 컴포넌트에서 사용
const { data, isLoading } = useData();
```

### 에러 처리 패턴

```typescript
try {
  await mutation.mutateAsync(data);
  toast.success('성공했습니다.');
} catch (err) {
  const message = getErrorDisplayMessage(err, '기본 에러 메시지');
  toast.error(message);
}
```

### 폼 처리 패턴

```typescript
const form = useForm({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormData) => {
  try {
    await mutation.mutateAsync(data);
    router.push('/success');
  } catch (err) {
    // 에러 처리
  }
};
```

---

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [React Query 문서](https://tanstack.com/query/latest)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [React Hook Form 문서](https://react-hook-form.com/)
- [Zod 문서](https://zod.dev/)

---

## 주의사항

1. **백엔드 응답 규격 준수**: 모든 API 응답은 `ApiResponse<T>` 형식을 따릅니다.
2. **에러 코드 매핑**: 새로운 에러 코드가 추가되면 `error-messages.ts`에 매핑을 추가해야 합니다.
3. **타입 안정성**: TypeScript 타입을 적절히 사용하여 타입 안정성을 유지합니다.
4. **클라이언트 컴포넌트**: React Query나 상태 관리를 사용하는 컴포넌트는 `'use client'`를 추가해야 합니다.
5. **shadcn/ui 사용**: 새로운 UI 컴포넌트가 필요하면 shadcn/ui를 우선 사용합니다.
