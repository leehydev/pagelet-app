# [FE] 에디터 자동저장 로직 수정

- **이슈 번호**: #61
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/61
- **생성일**: 2026-01-24
- **담당**: Developer
- **브랜치**: `feature/61-editor-autosave-modification`

## 목적

에디터의 자동저장 로직을 수정하여 게시글 상태와 관계없이 항상 드래프트에 저장하도록 합니다.

## 변경된 버전 관리 전략

### Status 정의

- **PRIVATE**: 비공개 (새 글 또는 비공개 전환)
- **PUBLISHED**: 공개

### 자동저장 로직 (변경됨)

- **PRIVATE 상태**: post_drafts에 UPSERT
- **PUBLISHED 상태**: post_drafts에 UPSERT

> 기존: DRAFT 상태는 posts 직접 수정, PUBLISHED 상태는 drafts에 저장
> 변경: 모든 상태에서 drafts에 저장

## 요구사항

- [ ] 자동저장 로직 수정 (항상 drafts에 저장)
- [ ] 에디터 진입 시 드래프트 로드 로직
- [ ] 저장 중 상태 표시 개선
- [ ] 사용자 테스트 통과

## 작업 범위

### 변경/생성할 파일

- 에디터 페이지/컴포넌트 (자동저장 로직이 있는 곳)
- 게시글 상태 관리 훅/스토어
- 저장 상태 표시 컴포넌트

### 제외 범위

- 게시글 관리 UI (발행/재발행/변경취소 버튼) - 후속 이슈 #62에서 처리

## 기술적 상세

### 자동저장 로직 변경

**현재 동작:**

```
변경 감지 -> debounce -> PATCH /posts/:id
```

**새로운 동작:**

```
변경 감지 -> debounce -> PUT /posts/:id/draft (모든 상태)
```

### 에디터 진입 시 데이터 로드

**새로운 동작:**

```
GET /posts/:id ->
  if (hasDraft) -> GET /posts/:id/draft -> 에디터 초기화 (드래프트 내용)
  else -> 에디터 초기화 (게시글 내용)
```

### 상태 관리

```typescript
interface EditorState {
  post: Post; // 원본 게시글
  draft: PostDraft | null; // 편집 중인 드래프트
  isEditingDraft: boolean; // 드래프트 편집 모드 여부
  hasUnsavedChanges: boolean; // 저장되지 않은 변경 있음
  lastSavedAt: Date | null; // 마지막 저장 시간
}
```

### 저장 로직 수정

```typescript
async function autoSave(content: ContentData) {
  // 모든 상태에서 드래프트에 저장
  await saveDraft(siteId, post.id, content);
  setIsEditingDraft(true);
  setLastSavedAt(new Date());
  setHasUnsavedChanges(false);
}
```

### 에디터 초기화 로직

```typescript
async function loadPostForEditor(postId: string) {
  // 1. 게시글 조회
  const post = await getPost(siteId, postId);
  setPost(post);

  // 2. 드래프트가 있으면 드래프트 로드
  if (post.hasDraft) {
    const draft = await getDraft(siteId, postId);
    if (draft) {
      // 드래프트 내용으로 에디터 초기화
      initEditor({
        title: draft.title,
        subtitle: draft.subtitle,
        contentJson: draft.contentJson,
        // ... 기타 필드
      });
      setDraft(draft);
      setIsEditingDraft(true);
      return;
    }
  }

  // 3. 게시글 내용으로 에디터 초기화 (기본)
  initEditor({
    title: post.title,
    subtitle: post.subtitle,
    contentJson: post.contentJson,
    // ... 기타 필드
  });
  setIsEditingDraft(false);
}
```

### UI 표시 변경

| 상태                     | 표시                             |
| ------------------------ | -------------------------------- |
| PRIVATE, 드래프트 없음   | "비공개"                         |
| PRIVATE, 드래프트 있음   | "작성 중"                        |
| PRIVATE, 저장 중         | "저장 중..."                     |
| PUBLISHED, 드래프트 없음 | "발행됨"                         |
| PUBLISHED, 드래프트 있음 | "편집 중 (미발행 변경사항 있음)" |
| PUBLISHED, 저장 중       | "저장 중..."                     |

### 의존성

- 선행 태스크: #60 (Draft API 타입 및 함수 추가)
- 후속 태스크: #62 (게시글 관리 UI 수정)

## 구현 체크리스트

### 자동저장 로직 수정

- [ ] 모든 상태에서 saveDraft() 호출
- [ ] 저장 성공/실패 처리
- [ ] 에러 핸들링 및 재시도 로직

### 에디터 진입 시 드래프트 로드

- [ ] 게시글 조회 후 hasDraft 확인
- [ ] hasDraft === true면 드래프트 조회
- [ ] 드래프트 내용으로 에디터 초기화
- [ ] isEditingDraft 상태 설정

### 저장 상태 표시

- [ ] 상태별 표시 텍스트 수정
- [ ] "작성 중" / "편집 중" 표시
- [ ] 드래프트 마지막 수정 시간 표시 (선택)
- [ ] 저장 중/저장 완료 상태 표시

## 테스트 시나리오

### PRIVATE 게시글 편집 (새 글)

1. 새 글 작성 시작 (PRIVATE 상태로 생성)
2. 내용 입력
3. 자동저장 발동
4. 기대: 드래프트에 저장됨, "작성 중" 표시

### PRIVATE 게시글 편집 (드래프트 있음)

1. PRIVATE + 드래프트 있는 게시글 열기
2. 기대: 드래프트 내용으로 에디터 로드
3. 내용 수정
4. 자동저장 발동
5. 기대: 드래프트 업데이트됨

### PUBLISHED 게시글 편집 - 드래프트 없음

1. PUBLISHED 상태 게시글 열기
2. 내용 수정
3. 자동저장 발동
4. 기대: 드래프트 생성됨, "편집 중" 표시

### PUBLISHED 게시글 편집 - 드래프트 있음

1. PUBLISHED + 드래프트 있는 게시글 열기
2. 기대: 드래프트 내용으로 에디터 로드
3. 내용 수정
4. 자동저장 발동
5. 기대: 드래프트 업데이트됨

## 완료 기준 (Definition of Done)

- [ ] PRIVATE 상태 게시글 드래프트 저장 정상 동작
- [ ] PUBLISHED 상태 게시글 드래프트 저장 정상 동작
- [ ] 에디터 진입 시 드래프트 로드 정상 동작
- [ ] 저장 상태 표시 정확
- [ ] 빌드 성공 (`npm run build`)

## 참고 자료

- 기존 에디터 자동저장 로직 참조
- Draft API 명세 (#60)

---

## 진행 로그

### 2026-01-24

- 태스크 파일 생성
- 버전 관리 전략 변경 (DRAFT -> PRIVATE/PUBLISHED)
- 자동저장 로직 단순화 (항상 drafts에 저장)
