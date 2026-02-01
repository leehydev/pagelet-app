# Hooks 디렉토리

커스텀 React 훅

## 훅 목록

### 데이터 페칭 (React Query)

| 훅                     | 용도                                           |
| ---------------------- | ---------------------------------------------- |
| `use-posts.ts`         | 게시글 CRUD (목록, 생성, 수정, 삭제, 상태변경) |
| `use-categories.ts`    | 카테고리 CRUD                                  |
| `use-admin-sites.ts`   | 관리자 사이트 목록                             |
| `use-site-settings.ts` | 사이트 설정 조회/수정                          |
| `use-user.ts`          | 현재 사용자 정보                               |

### 업로드

| 훅                       | 용도                                  |
| ------------------------ | ------------------------------------- |
| `use-upload.ts`          | 게시글 이미지 업로드 (Pre-signed URL) |
| `use-branding-upload.ts` | 브랜딩 자산 업로드 (로고, 파비콘, OG) |

### UI

| 훅                 | 용도                     |
| ------------------ | ------------------------ |
| `use-mobile.ts`    | 반응형 모바일 감지       |
| `use-app-back.ts`  | 네비게이션 히스토리 관리 |

## 패턴

### React Query 래핑

```typescript
export function usePosts(siteId: string) {
  return useQuery({
    queryKey: ['posts', siteId],
    queryFn: () => fetchPosts(siteId),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

### 업로드 플로우

```typescript
// 1. Pre-signed URL 요청
const { uploadUrl, publicUrl, s3Key } = await presignUpload(params);
// 2. S3 직접 업로드
await fetch(uploadUrl, { method: 'PUT', body: file });
// 3. 완료 커밋
await completeUpload({ s3Key });
```

## 네이밍 규칙

`use-` 접두사 + kebab-case: `use-posts.ts`

## 쿼리 키

| 키                          | 용도              |
| --------------------------- | ----------------- |
| `['posts', siteId]`         | 사이트별 게시글   |
| `['categories', siteId]`    | 사이트별 카테고리 |
| `['site-settings', siteId]` | 사이트 설정       |
| `['user']`                  | 현재 사용자       |
