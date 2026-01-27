# [FE] 게시글 관리 UI 수정

- **이슈 번호**: #62
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/62
- **생성일**: 2026-01-24
- **담당**: Developer
- **브랜치**: `feature/62-post-management-ui`

## 목적

게시글 관리 화면에 드래프트 관련 UI를 추가합니다.

- 게시글 목록에서 "편집 중" 상태 표시
- 에디터에서 "발행", "재발행", "변경 취소", "비공개 전환" 버튼 추가

## 변경된 버전 관리 전략

### Status 정의

- **PRIVATE**: 비공개 (새 글 또는 비공개 전환)
- **PUBLISHED**: 공개

### 액션별 동작

| 상태              | 액션        | 동작                                              |
| ----------------- | ----------- | ------------------------------------------------- |
| PRIVATE + draft   | 발행        | drafts -> posts, status -> PUBLISHED, drafts 삭제 |
| PUBLISHED         | 편집 시작   | posts -> drafts 복사                              |
| PUBLISHED + draft | 재발행      | drafts -> posts, drafts 삭제                      |
| PUBLISHED + draft | 변경 취소   | drafts 삭제                                       |
| PUBLISHED         | 비공개 전환 | drafts 있으면 머지, status -> PRIVATE             |

> 기존 "발행 취소"를 "비공개 전환"으로 용어 변경

## 요구사항

- [ ] 게시글 목록에 드래프트 상태 표시
- [ ] 에디터에 "발행" 버튼 추가 (PRIVATE + draft)
- [ ] 에디터에 "재발행" 버튼 추가 (PUBLISHED + draft)
- [ ] 에디터에 "변경 취소" 버튼 추가 (PUBLISHED + draft)
- [ ] 에디터에 "비공개 전환" 버튼 추가 (PUBLISHED)
- [ ] 사용자 테스트 통과

## 작업 범위

### 변경/생성할 파일

- 게시글 목록 페이지/컴포넌트
- 에디터 페이지 (버튼 영역)
- 게시글 상태 배지 컴포넌트
- 확인 모달 컴포넌트 (신규 또는 기존 활용)

### 제외 범위

- 자동저장 로직 (선행 이슈 #61에서 처리됨)

## 기술적 상세

### 게시글 목록 UI

**상태 표시:**

| posts.status | hasDraft | 표시             |
| ------------ | -------- | ---------------- |
| PRIVATE      | false    | 비공개           |
| PRIVATE      | true     | 작성 중          |
| PUBLISHED    | false    | 발행됨           |
| PUBLISHED    | true     | 발행됨 (편집 중) |

### 상태 배지 컴포넌트

```typescript
interface PostStatusBadgeProps {
  status: PostStatus;  // 'PRIVATE' | 'PUBLISHED'
  hasDraft: boolean;
}

function PostStatusBadge({ status, hasDraft }: PostStatusBadgeProps) {
  if (status === 'PRIVATE') {
    return (
      <Badge variant={hasDraft ? 'warning' : 'secondary'}>
        {hasDraft ? '작성 중' : '비공개'}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="success">발행됨</Badge>
      {hasDraft && <Badge variant="warning">편집 중</Badge>}
    </div>
  );
}
```

### 에디터 버튼 영역

**PRIVATE + 드래프트 있는 경우:**

```
[발행]
   └ drafts -> posts, status -> PUBLISHED, drafts 삭제
```

**PUBLISHED + 드래프트 있는 경우:**

```
[재발행] [변경 취소] [비공개 전환]
   |         |           |
   |         |           └ drafts 머지, status -> PRIVATE
   |         └ drafts 삭제, 발행본 유지
   └ drafts -> posts, drafts 삭제
```

**PUBLISHED + 드래프트 없는 경우:**

```
[비공개 전환]
   └ status -> PRIVATE
```

### 버튼 동작 상세

**발행 버튼 (PRIVATE + draft):**

```typescript
async function handlePublish() {
  const confirmed = await showConfirmModal({
    title: '발행',
    message: '게시글을 발행하시겠습니까?',
    confirmText: '발행',
  });

  if (confirmed) {
    await publishPost(siteId, postId);
    toast.success('발행 완료');
    router.refresh();
  }
}
```

**재발행 버튼 (PUBLISHED + draft):**

```typescript
async function handleRepublish() {
  const confirmed = await showConfirmModal({
    title: '재발행',
    message: '변경사항을 발행하시겠습니까?',
    confirmText: '재발행',
  });

  if (confirmed) {
    await republishPost(siteId, postId);
    toast.success('재발행 완료');
    router.refresh();
  }
}
```

**변경 취소 버튼 (PUBLISHED + draft):**

```typescript
async function handleDiscardChanges() {
  const confirmed = await showConfirmModal({
    title: '변경 취소',
    message: '변경사항을 취소하시겠습니까? 발행된 내용은 유지됩니다.',
    confirmText: '변경 취소',
    variant: 'warning',
  });

  if (confirmed) {
    await deleteDraft(siteId, postId);
    toast.success('변경 취소됨');
    await loadPostForEditor(postId);
  }
}
```

**비공개 전환 버튼 (PUBLISHED):**

```typescript
async function handleUnpublish() {
  const message = post.hasDraft
    ? '비공개로 전환하시겠습니까? 편집 중인 내용이 적용됩니다.'
    : '비공개로 전환하시겠습니까?';

  const confirmed = await showConfirmModal({
    title: '비공개 전환',
    message,
    confirmText: '비공개 전환',
    variant: 'destructive',
  });

  if (confirmed) {
    await unpublishPost(siteId, postId);
    toast.success('비공개로 전환됨');
    router.refresh();
  }
}
```

### 의존성

- 선행 태스크: #61 (에디터 자동저장 로직 수정)

## 구현 체크리스트

### 게시글 목록 드래프트 표시

- [ ] 목록 API 응답에서 hasDraft 확인
- [ ] 상태 배지 컴포넌트 수정 (PRIVATE/PUBLISHED)
- [ ] "작성 중" / "편집 중" 배지 표시

### 발행 버튼 (PRIVATE + draft)

- [ ] PRIVATE + hasDraft일 때만 표시
- [ ] 확인 모달 추가
- [ ] publishPost() API 호출
- [ ] 성공 시 상태 업데이트 및 토스트

### 재발행 버튼 (PUBLISHED + draft)

- [ ] PUBLISHED + hasDraft일 때만 표시
- [ ] 확인 모달 추가
- [ ] republishPost() API 호출
- [ ] 성공 시 상태 업데이트 및 토스트

### 변경 취소 버튼 (PUBLISHED + draft)

- [ ] PUBLISHED + hasDraft일 때만 표시
- [ ] 확인 모달 추가
- [ ] deleteDraft() API 호출
- [ ] 성공 시 에디터 리로드 (발행본 내용)

### 비공개 전환 버튼 (PUBLISHED)

- [ ] PUBLISHED일 때 표시
- [ ] hasDraft 여부에 따른 메시지 분기
- [ ] unpublishPost() API 호출
- [ ] 성공 시 상태 업데이트

## UI 목업

### 게시글 목록

```
+------------------------------------------+
| [제목] Next.js 시작하기                  |
| [부제목] 프레임워크 입문 가이드          |
| [상태] 발행됨  [편집 중]                 |
| [날짜] 2024-01-20                        |
+------------------------------------------+

+------------------------------------------+
| [제목] 새 글 작성                        |
| [부제목]                                 |
| [상태] 작성 중                           |
| [날짜] 2024-01-24                        |
+------------------------------------------+
```

### 에디터 헤더 (PUBLISHED + draft)

```
+------------------------------------------------------------+
|  Next.js 시작하기                                          |
|  ----------------------------------------------------------+
|  편집 중 - 미발행 변경사항이 있습니다                      |
|  마지막 저장: 2분 전                                       |
|                                                            |
|  [재발행] [변경 취소] [비공개 전환]                        |
+------------------------------------------------------------+
```

### 에디터 헤더 (PRIVATE + draft)

```
+------------------------------------------------------------+
|  새 글 제목                                                |
|  ----------------------------------------------------------+
|  작성 중                                                   |
|  마지막 저장: 방금 전                                      |
|                                                            |
|  [발행]                                                    |
+------------------------------------------------------------+
```

## 테스트 시나리오

### 발행 플로우 (PRIVATE + draft)

1. 새 글 작성 (PRIVATE + 드래프트 있는 상태)
2. "발행" 클릭
3. 확인 모달에서 확인
4. 기대: 게시글이 PUBLISHED 상태로 변경, 드래프트 삭제

### 재발행 플로우 (PUBLISHED + draft)

1. PUBLISHED + 드래프트 있는 게시글 열기
2. "재발행" 클릭
3. 확인 모달에서 확인
4. 기대: 발행본이 드래프트 내용으로 업데이트, 드래프트 삭제

### 변경 취소 플로우 (PUBLISHED + draft)

1. PUBLISHED + 드래프트 있는 게시글 열기
2. "변경 취소" 클릭
3. 확인 모달에서 확인
4. 기대: 에디터가 발행본 내용으로 리로드, 드래프트 삭제

### 비공개 전환 - 드래프트 있음

1. PUBLISHED + 드래프트 있는 게시글 열기
2. "비공개 전환" 클릭
3. 경고 모달 표시: "편집 중인 내용이 적용됩니다"
4. 확인
5. 기대: 게시글이 드래프트 내용으로 PRIVATE 상태로 변경

### 비공개 전환 - 드래프트 없음

1. PUBLISHED 상태 게시글 열기 (드래프트 없음)
2. "비공개 전환" 클릭
3. 확인 모달 표시
4. 확인
5. 기대: 게시글이 PRIVATE 상태로 변경 (내용 유지)

## 완료 기준 (Definition of Done)

- [ ] 게시글 목록에 상태별 표시 (비공개/작성 중/발행됨/편집 중)
- [ ] 발행 버튼 정상 동작
- [ ] 재발행 버튼 정상 동작
- [ ] 변경 취소 버튼 정상 동작
- [ ] 비공개 전환 버튼 정상 동작
- [ ] 빌드 성공 (`npm run build`)
- [ ] 사용자 테스트 통과

## 참고 자료

- 기존 게시글 관리 UI 참조
- Draft API 명세 (#60)

---

## 진행 로그

### 2026-01-24

- 태스크 파일 생성
- "발행 취소" -> "비공개 전환"으로 용어 변경
- DRAFT -> PRIVATE 상태 변경
- 발행 버튼 추가 (PRIVATE + draft)
