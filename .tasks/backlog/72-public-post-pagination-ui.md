# [FE] 공개 게시글 목록 페이징 및 카테고리별 인접 게시글 UI

## GitHub 이슈
- **이슈 번호**: #72
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/72
- **생성일**: 2026-01-25
- **우선순위**: 높음
- **의존성**: leehydev/pagelet-api#72 (백엔드 API 변경)

## 개요

백엔드 API 변경(pagelet-api#72)에 대응하는 프론트엔드 작업입니다.

1. **게시글 목록 페이징 UI**: 공개 게시글 목록에 페이지네이션 적용
2. **카테고리별 인접 게시글**: 카테고리 페이지에서 접근한 게시글의 이전/다음이 같은 카테고리 내에서 조회되도록 처리

## 작업 범위

### 포함

#### 1. API 함수 및 타입 업데이트
- `fetchPublicPosts()` 반환 타입: `PublicPost[]` → `PaginatedResponse<PublicPost>`
- `fetchPublicPosts()`에 `page`, `limit` 파라미터 추가
- `fetchPublicPostBySlug()`에 `categorySlug` 파라미터 추가

#### 2. 게시글 목록 페이징 UI
- 전체 게시글 목록 페이지 (`/t/[slug]/posts`) 페이징 적용
- 카테고리별 목록 페이지 (`/t/[slug]/category/[categorySlug]`) 페이징 적용
- 페이지네이션 컴포넌트 구현 또는 재사용

#### 3. 카테고리별 인접 게시글
- 카테고리 페이지에서 게시글 클릭 시 categorySlug 전달
- 게시글 상세 페이지에서 categorySlug 쿼리 파라미터 처리

### 제외
- 백엔드 API 변경 (별도 이슈 pagelet-api#72)
- 어드민 페이지 (이미 페이징 구현됨)

## 기술 명세

### 영향받는 파일
- `src/lib/api/server.ts` - API 함수 시그니처 변경
- `app/(public)/t/[slug]/posts/page.tsx` - 전체 게시글 페이징
- `app/(public)/t/[slug]/category/[categorySlug]/page.tsx` - 카테고리 페이징
- `app/(public)/t/[slug]/posts/[postSlug]/page.tsx` - categorySlug 파라미터 처리
- `components/public/Pagination.tsx` (신규) - 페이지네이션 컴포넌트

### API 함수 변경

#### 1. fetchPublicPosts() 변경

**기존:**
```typescript
export async function fetchPublicPosts(
  siteSlug: string,
  categorySlug?: string,
): Promise<PublicPost[]>
```

**변경 후:**
```typescript
export async function fetchPublicPosts(
  siteSlug: string,
  options?: {
    categorySlug?: string;
    page?: number;
    limit?: number;
  },
): Promise<PaginatedResponse<PublicPost>>
```

#### 2. fetchPublicPostBySlug() 변경

**기존:**
```typescript
export async function fetchPublicPostBySlug(
  siteSlug: string,
  postSlug: string,
): Promise<PublicPost>
```

**변경 후:**
```typescript
export async function fetchPublicPostBySlug(
  siteSlug: string,
  postSlug: string,
  categorySlug?: string,
): Promise<PublicPost>
```

### UI 설계

#### 페이지네이션 컴포넌트
- 이전/다음 버튼
- 페이지 번호 표시 (최대 5개)
- 첫 페이지/마지막 페이지 버튼
- 총 게시글 수 표시

#### 카테고리별 인접 게시글 흐름
1. 사용자가 카테고리 페이지에서 게시글 클릭
2. URL에 `?from=category` 쿼리 파라미터 추가
3. 게시글 상세 페이지에서 해당 파라미터 감지
4. `fetchPublicPostBySlug()` 호출 시 `categorySlug` 전달
5. 인접 게시글이 같은 카테고리 내에서 표시됨

## 구현 체크리스트

### API 함수 업데이트
- [ ] `fetchPublicPosts()` 시그니처 변경 (page, limit 파라미터 추가)
- [ ] `fetchPublicPosts()` 반환 타입 변경 (`PaginatedResponse<PublicPost>`)
- [ ] `fetchPublicPostBySlug()`에 `categorySlug` 파라미터 추가

### 페이지네이션 컴포넌트
- [ ] `components/public/Pagination.tsx` 컴포넌트 생성
- [ ] 이전/다음 페이지 네비게이션
- [ ] 페이지 번호 표시
- [ ] 총 페이지/게시글 수 표시

### 전체 게시글 목록 페이지
- [ ] `app/(public)/t/[slug]/posts/page.tsx` 수정
- [ ] 페이지 파라미터 처리 (`searchParams.page`)
- [ ] API 호출 시 페이징 파라미터 전달
- [ ] 페이지네이션 컴포넌트 렌더링
- [ ] 빈 페이지 처리 (범위 초과 시)

### 카테고리별 목록 페이지
- [ ] `app/(public)/t/[slug]/category/[categorySlug]/page.tsx` 수정
- [ ] 페이지 파라미터 처리
- [ ] API 호출 시 페이징 파라미터 전달
- [ ] 페이지네이션 컴포넌트 렌더링
- [ ] PostCard 링크에 `?from=category` 추가

### 게시글 상세 페이지
- [ ] `app/(public)/t/[slug]/posts/[postSlug]/page.tsx` 수정
- [ ] `searchParams`에서 `from=category` 또는 `categorySlug` 감지
- [ ] `fetchPublicPostBySlug()` 호출 시 `categorySlug` 전달
- [ ] 하단 네비게이션 "카테고리로 돌아가기" 링크 조건부 표시

### 공통
- [ ] 빌드 검증 (`npm run build`)
- [ ] 린트 검증 (`npm run lint`)
- [ ] 기존 기능 회귀 테스트

## 테스트 계획

### 수동 테스트

#### 페이지네이션 테스트
- [ ] 전체 게시글 목록 첫 페이지 조회
- [ ] 다음 페이지 이동
- [ ] 이전 페이지 이동
- [ ] 마지막 페이지 조회
- [ ] 범위 초과 페이지 접근 시 처리 확인
- [ ] URL에 page 파라미터 반영 확인

#### 카테고리 페이지네이션 테스트
- [ ] 카테고리 목록 첫 페이지 조회
- [ ] 카테고리 내 페이지 이동
- [ ] 게시글이 적은 카테고리 (1페이지만 있는 경우)

#### 카테고리별 인접 게시글 테스트
- [ ] 전체 목록에서 게시글 접근 → 전체 기준 인접 게시글 표시
- [ ] 카테고리 목록에서 게시글 접근 → 카테고리 기준 인접 게시글 표시
- [ ] 직접 URL 접근 → 전체 기준 인접 게시글 표시
- [ ] 카테고리 내 게시글이 1개인 경우 인접 게시글 없음 확인

### 반응형 테스트
- [ ] 모바일 화면에서 페이지네이션 UI
- [ ] 태블릿 화면에서 페이지네이션 UI
- [ ] 데스크톱 화면에서 페이지네이션 UI

## 참고 자료

### 기존 코드
- API 타입: `src/lib/api/types.ts` (PaginatedResponse, PaginationMeta 이미 정의됨)
- 서버 API: `src/lib/api/server.ts`
- 전체 게시글: `app/(public)/t/[slug]/posts/page.tsx`
- 카테고리: `app/(public)/t/[slug]/category/[categorySlug]/page.tsx`
- 게시글 상세: `app/(public)/t/[slug]/posts/[postSlug]/page.tsx`

### 참고 태스크
- 백엔드 API: `pagelet-api/.tasks/backlog/72-public-post-pagination-and-category-adjacent.md`
