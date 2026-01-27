# [FE] 어드민 게시글 목록 페이징 UI 구현

## GitHub 이슈

- **이슈 번호**: #32
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/32
- **생성일**: 2026-01-22
- **우선순위**: 높음
- **관련 태스크**: leehydev/pagelet-api#27 (백엔드)

## 개요

어드민 게시글 목록 페이지에 페이징 기능을 추가합니다.

## 의존성

- 백엔드 API 페이징 구현 완료 필요: leehydev/pagelet-api#27

## 작업 범위

### 포함

- 페이징 응답 타입 추가
- API 클라이언트 함수 수정
- React Query 훅 페이징 지원
- 게시글 목록 페이지 페이지네이션 UI

### 제외

- 백엔드 API 작업 (별도 이슈)

## 기술 명세

### 영향받는 파일

- `src/lib/api/types.ts` (수정)
- `src/lib/api/client.ts` (수정)
- `src/hooks/use-posts.ts` (수정)
- 게시글 목록 페이지 컴포넌트 (수정)

### 타입 정의

```typescript
// PaginationMeta
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// PaginatedResponse
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// PaginationParams
export interface PaginationParams {
  page?: number;
  limit?: number;
}
```

### API 클라이언트 변경

```typescript
// 기존
export async function getAdminPosts(siteId: string, categoryId?: string): Promise<PostListItem[]>;

// 변경 후
export async function getAdminPosts(
  siteId: string,
  params?: { categoryId?: string; page?: number; limit?: number },
): Promise<PaginatedResponse<PostListItem>>;
```

### React Query 훅 변경

```typescript
// 기존
export function useAdminPosts(siteId: string, categoryId?: string);

// 변경 후
export function useAdminPosts(
  siteId: string,
  params?: { categoryId?: string; page?: number; limit?: number },
);
```

## 구현 체크리스트

- [ ] `PaginatedResponse<T>` 타입 추가
- [ ] `PaginationMeta` 타입 추가
- [ ] `getAdminPosts` 함수 페이징 파라미터 추가
- [ ] `useAdminPosts` 훅 페이징 지원
- [ ] 페이지네이션 UI 적용
- [ ] 페이지 상태 URL 쿼리 파라미터 연동 (선택)

## 테스트 계획

- [ ] 컴포넌트 테스트: 페이지네이션 UI 동작
- [ ] 훅 테스트: useAdminPosts 페이징 파라미터 처리

## 참고 자료

- 현재 API 클라이언트: `src/lib/api/client.ts`
- 현재 훅: `src/hooks/use-posts.ts`
- 현재 타입: `src/lib/api/types.ts`
