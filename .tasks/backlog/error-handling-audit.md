# 커스텀 훅 에러 처리 누락 지점 정리

## 개요

`src/hooks` 디렉토리의 커스텀 훅들이 사용되는 곳 중에서 에러를 잡아서 에러 UI로 리턴시키는 로직이 없는 곳들을 정리했습니다.

## 에러 처리 누락 지점

### 1. useAdminSites

#### ❌ `src/components/app/layout/SiteSwitcher.tsx`

- **현재 상태**: `isLoading`만 체크하고 `isError` 체크 없음
- **문제**: 사이트 목록 조회 실패 시 에러 UI 없이 로딩 스켈레톤만 표시됨
- **권장 수정**:

  ```typescript
  const { data: sites, isLoading, isError, error } = useAdminSites();

  if (isError) {
    return <div className="text-sm text-red-500">사이트 목록을 불러올 수 없습니다</div>;
  }
  ```

---

### 2. useAdminCategories

#### ❌ `app/(app)/admin/[siteId]/posts/page.tsx`

- **현재 상태**: `categoriesLoading`만 체크, `error` 체크 없음
- **문제**: 카테고리 목록 조회 실패 시 카테고리 필터가 비활성화되지만 에러 메시지 없음
- **권장 수정**: 카테고리 조회 실패 시 에러 메시지 표시 또는 조용히 실패 처리

#### ❌ `app/(app)/admin/[siteId]/categories/[id]/edit/page.tsx`

- **현재 상태**: `categoriesLoading`만 체크, `error` 체크 없음
- **문제**: 카테고리 목록 조회 실패 시 카테고리를 찾을 수 없다는 메시지가 표시되지만, 실제로는 조회 실패일 수 있음
- **권장 수정**: `error` 상태도 체크하여 조회 실패와 카테고리 없음을 구분

#### ❌ `app/(app)/admin/[siteId]/posts/new/page.tsx`

- **현재 상태**: `categoriesLoading`만 체크, `error` 체크 없음
- **문제**: 카테고리 목록 조회 실패 시 카테고리 선택 드롭다운이 비활성화되지만 에러 메시지 없음
- **권장 수정**: 카테고리 조회 실패 시 에러 메시지 표시

#### ❌ `app/(app)/admin/[siteId]/posts/[postId]/edit/page.tsx`

- **현재 상태**: `categoriesLoading`만 체크, `error` 체크 없음
- **문제**: 카테고리 목록 조회 실패 시 카테고리 선택 드롭다운이 비활성화되지만 에러 메시지 없음
- **권장 수정**: 카테고리 조회 실패 시 에러 메시지 표시

---

### 3. useAdminSiteSettings

#### ❌ `src/components/app/layout/AdminSidebar.tsx`

- **현재 상태**: `data`만 사용, `error` 체크 없음
- **문제**: 사이트 설정 조회 실패 시 블로그 URL이 표시되지 않지만 에러 메시지 없음
- **권장 수정**: 에러 발생 시 조용히 처리하거나 fallback UI 표시

#### ❌ `app/(app)/admin/[siteId]/posts/[postId]/page.tsx`

- **현재 상태**: `data`만 사용, `error` 체크 없음
- **문제**: 사이트 설정 조회 실패 시 블로그 URL이 표시되지 않지만 에러 메시지 없음
- **권장 수정**: 에러 발생 시 조용히 처리 (블로그 URL은 선택적 기능이므로)

#### ❌ `app/(app)/admin/[siteId]/posts/new/page.tsx`

- **현재 상태**: `data`만 사용, `error` 체크 없음
- **문제**: 사이트 설정 조회 실패 시 ISR revalidation이 실패할 수 있지만 에러 메시지 없음
- **권장 수정**: 에러 발생 시 조용히 처리 (revalidation은 선택적 기능)

#### ❌ `app/(app)/admin/[siteId]/posts/[postId]/edit/page.tsx`

- **현재 상태**: `data`만 사용, `error` 체크 없음
- **문제**: 사이트 설정 조회 실패 시 ISR revalidation이 실패할 수 있지만 에러 메시지 없음
- **권장 수정**: 에러 발생 시 조용히 처리 (revalidation은 선택적 기능)

---

### 4. useUser

#### ❌ `app/(auth)/onboarding/profile/page.tsx`

- **현재 상태**: `data: user`만 사용, `error` 체크 없음
- **문제**: 사용자 정보 조회 실패 시 폼이 비어있거나 기본값으로 표시됨
- **권장 수정**: `error` 상태 체크하여 에러 UI 표시 또는 리다이렉트

---

## 에러 처리가 이미 있는 곳 (참고)

### ✅ useAdminSites

- `app/(app)/admin/page.tsx` - 에러 처리 있음
- `app/(app)/admin/[siteId]/layout.tsx` - 에러 처리 있음

### ✅ useAdminCategories

- `app/(app)/admin/[siteId]/categories/page.tsx` - 에러 처리 있음

### ✅ useAdminPosts

- `app/(app)/admin/[siteId]/posts/page.tsx` - 에러 처리 있음

### ✅ useAdminSiteSettings

- `app/(app)/admin/[siteId]/settings/page.tsx` - 에러 처리 있음

### ✅ useUser

- `app/(app)/admin/layout.tsx` - 에러 처리 있음 (로딩만 체크하지만 온보딩 리다이렉트로 처리)
- `app/(auth)/onboarding/layout.tsx` - 에러 처리 있음
- `app/(auth)/auth/success/page.tsx` - 에러 처리 있음

---

## 내부적으로 에러 처리가 있는 훅

다음 훅들은 내부적으로 에러 상태를 관리하므로 별도 에러 UI 처리가 필요 없습니다:

- `useUpload` - `uploadProgress.error`로 에러 상태 관리
- `useBrandingUpload` - `state.error`로 에러 상태 관리
- `useAutoSave` - `onSaveError` 콜백으로 에러 처리

---

## 우선순위

### 높음 (사용자 경험에 직접 영향)

1. `src/components/app/layout/SiteSwitcher.tsx` - 사이트 전환 UI에서 에러 처리 필요
2. `app/(auth)/onboarding/profile/page.tsx` - 사용자 정보 조회 실패 시 처리 필요

### 중간 (기능은 동작하지만 에러 피드백 없음)

3. `app/(app)/admin/[siteId]/posts/page.tsx` - 카테고리 필터 에러 처리
4. `app/(app)/admin/[siteId]/posts/new/page.tsx` - 카테고리 선택 에러 처리
5. `app/(app)/admin/[siteId]/posts/[postId]/edit/page.tsx` - 카테고리 선택 에러 처리
6. `app/(app)/admin/[siteId]/categories/[id]/edit/page.tsx` - 카테고리 조회 에러 처리

### 낮음 (선택적 기능, 조용히 실패해도 됨)

7. `src/components/app/layout/AdminSidebar.tsx` - 블로그 URL은 선택적
8. `app/(app)/admin/[siteId]/posts/[postId]/page.tsx` - 블로그 URL은 선택적
9. `app/(app)/admin/[siteId]/posts/new/page.tsx` - ISR revalidation은 선택적
10. `app/(app)/admin/[siteId]/posts/[postId]/edit/page.tsx` - ISR revalidation은 선택적
