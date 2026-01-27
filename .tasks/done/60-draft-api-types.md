# [FE] Draft API 타입 및 함수 추가

- **이슈 번호**: #60
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/60
- **생성일**: 2026-01-24
- **담당**: Developer
- **브랜치**: `feature/60-draft-api-types`

## 목적

백엔드 Draft API에 대응하는 TypeScript 타입과 API 호출 함수를 추가합니다.

## 변경된 버전 관리 전략

### Status 정의
- **PRIVATE**: 비공개 (새 글 또는 비공개 전환)
- **PUBLISHED**: 공개

### 상태 판단 로직

| posts.status | post_drafts | 상태 |
|--------------|-------------|------|
| PRIVATE | 있음 | 새 글 작성 중 |
| PRIVATE | 없음 | 비공개 글 |
| PUBLISHED | 없음 | 발행됨 |
| PUBLISHED | 있음 | 발행됨 + 편집 중 |

## 요구사항

- [ ] Draft 관련 타입 정의
- [ ] Draft API 함수 추가
- [ ] Post 응답 타입에 `hasDraft` 필드 추가
- [ ] PostStatus 타입 수정 (DRAFT -> PRIVATE)
- [ ] TypeScript 타입 체크 통과

## 작업 범위

### 변경/생성할 파일

- `src/types/post.ts` - 타입 정의 수정
- `src/types/draft.ts` - 신규 (또는 post.ts에 통합)
- `src/api/post.ts` 또는 `src/api/draft.ts` - API 함수 추가

### 제외 범위

- UI 컴포넌트 수정 (후속 이슈에서 처리)

## 기술적 상세

### 타입 정의

```typescript
// types/post.ts

// Status 변경: DRAFT -> PRIVATE
type PostStatus = 'PRIVATE' | 'PUBLISHED';

interface PostDraft {
  id: string;
  postId: string;
  title: string;
  subtitle: string;
  contentJson: Record<string, any> | null;
  contentHtml: string | null;
  contentText: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SaveDraftRequest {
  title?: string;
  subtitle?: string;
  contentJson?: Record<string, any>;
  contentHtml?: string;
  contentText?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  categoryId?: string;
}

// Post 응답 타입 수정
interface Post {
  // ... 기존 필드
  status: PostStatus;  // PRIVATE | PUBLISHED
  hasDraft: boolean;   // 신규 필드
}
```

### API 함수

```typescript
// api/draft.ts 또는 api/post.ts에 추가

// 드래프트 조회
export async function getDraft(siteId: string, postId: string): Promise<PostDraft | null> {
  try {
    const response = await apiClient.get(`/admin/sites/${siteId}/posts/${postId}/draft`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// 드래프트 저장 (upsert)
export async function saveDraft(
  siteId: string,
  postId: string,
  data: SaveDraftRequest
): Promise<PostDraft> {
  const response = await apiClient.put(`/admin/sites/${siteId}/posts/${postId}/draft`, data);
  return response.data;
}

// 드래프트 삭제 (변경 취소)
export async function deleteDraft(siteId: string, postId: string): Promise<void> {
  await apiClient.delete(`/admin/sites/${siteId}/posts/${postId}/draft`);
}

// 발행 (PRIVATE -> PUBLISHED)
export async function publishPost(siteId: string, postId: string): Promise<Post> {
  const response = await apiClient.post(`/admin/sites/${siteId}/posts/${postId}/publish`);
  return response.data;
}

// 재발행 (PUBLISHED + draft -> PUBLISHED)
export async function republishPost(siteId: string, postId: string): Promise<Post> {
  const response = await apiClient.post(`/admin/sites/${siteId}/posts/${postId}/republish`);
  return response.data;
}

// 비공개 전환 (PUBLISHED -> PRIVATE)
export async function unpublishPost(siteId: string, postId: string): Promise<Post> {
  const response = await apiClient.post(`/admin/sites/${siteId}/posts/${postId}/unpublish`);
  return response.data;
}
```

### API 엔드포인트 매핑

| 함수 | Method | Path |
|------|--------|------|
| getDraft | GET | /admin/sites/:siteId/posts/:postId/draft |
| saveDraft | PUT | /admin/sites/:siteId/posts/:postId/draft |
| deleteDraft | DELETE | /admin/sites/:siteId/posts/:postId/draft |
| publishPost | POST | /admin/sites/:siteId/posts/:postId/publish |
| republishPost | POST | /admin/sites/:siteId/posts/:postId/republish |
| unpublishPost | POST | /admin/sites/:siteId/posts/:postId/unpublish |

### 의존성

- 선행 태스크: pagelet-api#60, #61, #62 (백엔드 API 완료)
- 후속 태스크: #61 (에디터 자동저장 로직 수정)

## 구현 체크리스트

### 타입 정의
- [ ] `PostStatus` 수정 (DRAFT -> PRIVATE)
- [ ] `PostDraft` 인터페이스
- [ ] `SaveDraftRequest` 인터페이스
- [ ] `Post` 인터페이스에 `hasDraft` 추가

### API 함수
- [ ] `getDraft()` - 드래프트 조회
- [ ] `saveDraft()` - 드래프트 저장
- [ ] `deleteDraft()` - 변경 취소
- [ ] `publishPost()` - 발행
- [ ] `republishPost()` - 재발행
- [ ] `unpublishPost()` - 비공개 전환

### 기타
- [ ] 에러 핸들링 (404 시 null 반환 등)
- [ ] TypeScript 타입 체크 통과

## 완료 기준 (Definition of Done)

- [ ] 모든 타입이 정의됨
- [ ] 모든 API 함수가 구현됨
- [ ] 빌드 성공 (`npm run build`)
- [ ] 타입 체크 통과

## 참고 자료

- 기존 Post API 함수 참조
- 백엔드 API 명세 (pagelet-api#61, #62)

---

## 진행 로그

### 2026-01-24
- 태스크 파일 생성
- 버전 관리 전략 변경 (DRAFT -> PRIVATE/PUBLISHED)
- 발행/비공개 전환 API 추가
