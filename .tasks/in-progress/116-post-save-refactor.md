# [FE] 게시글 저장 로직 리팩토링 - UI 단순화 및 PUT 전환

## GitHub 이슈

- **이슈 번호**: #116
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/116
- **우선순위**: 높음
- **백엔드 의존성**: leehydev/pagelet-api#108

## 개요

게시글 저장 UI와 로직을 단순화하여 직관적이고 예측 가능한 구조로 변경한다.

### 현재 문제점

1. **복잡한 버튼 구조**
   - PRIVATE: 저장, 발행
   - PUBLISHED: 임시저장, 업데이트, 비공개 전환
   - 상태별로 다른 버튼과 동작

2. **데이터 손실 버그**
   - undefined → null 변환으로 의도치 않은 값 삭제
   - slug, 썸네일, SEO 정보 누락

3. **숨겨진 동작**
   - 비공개 전환 시 draft가 post로 자동 머지
   - 사용자가 예측하기 어려움

### 변경 방향

- **버튼 2개**: 저장, 임시저장
- **공개 여부**: 라디오 버튼으로 분리
- **불러오기**: draft 있을 때만 표시
- **저장 = PUT**: 전체 덮어쓰기

## 작업 범위

### 포함

- [ ] UI 변경: 버튼 구조 단순화, 공개 여부 라디오 버튼
- [ ] 저장 로직: PUT API 사용, draft 자동 삭제
- [ ] 임시저장 로직: draft만 저장
- [ ] 불러오기 기능: draft → 폼 로드
- [ ] 자동저장: 항상 draft로 저장
- [ ] 타입 정의 업데이트

### 제외

- 드래프트 목록/관리 UI (별도 이슈)

## 기술 명세

### UI 변경

#### 현재 (복잡)
```
┌─────────────────────────────────────────┐
│ PRIVATE 상태                             │
│ [발행] [저장] [취소]                      │
├─────────────────────────────────────────┤
│ PUBLISHED 상태                           │
│ [업데이트] [임시저장] [임시저장본 삭제]    │
│ [비공개 전환]                            │
└─────────────────────────────────────────┘
```

#### 변경 후 (단순)
```
┌─────────────────────────────────────────┐
│ 공개 여부                                │
│ ○ 비공개  ● 공개                         │
│                                          │
│ [저장] [임시저장]                         │
│                                          │
│ ⚠️ 임시저장된 내용이 있습니다 [불러오기]   │
│ (draft 있을 때만 표시)                    │
└─────────────────────────────────────────┘
```

### 영향받는 파일

```
app/(app)/admin/posts/
├── new/page.tsx                    # 새 글 작성
└── [postId]/
    ├── page.tsx                    # 글 상세 (필요시)
    └── edit/page.tsx               # 글 수정

src/
├── hooks/
│   └── use-auto-save.ts            # 자동 저장 (draft로 통일)
├── lib/api/
│   ├── client.ts                   # API 함수 추가
│   └── types.ts                    # 타입 수정
└── components/app/post/
    └── PostStatusRadio.tsx         # 신규: 공개 여부 라디오
```

### 타입 정의 변경

```typescript
// src/lib/api/types.ts

// 신규: PUT용 전체 교체 타입
export interface ReplacePostRequest {
  title: string;
  subtitle: string;
  slug: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string | null;
  contentText: string | null;
  status: PostStatus;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
}

// 수정: SaveDraftRequest에 slug 추가
export interface SaveDraftRequest {
  title?: string;
  subtitle?: string;
  slug?: string | null;  // 추가
  contentJson?: Record<string, unknown>;
  contentHtml?: string | null;
  contentText?: string | null;
  categoryId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
}
```

### API 함수 추가

```typescript
// src/lib/api/client.ts

// 신규: PUT으로 전체 교체
export async function replaceAdminPost(
  siteId: string,
  postId: string,
  data: ReplacePostRequest,
): Promise<Post> {
  const response = await api.put<ApiResponse<Post>>(
    `/admin/sites/${siteId}/posts/${postId}`,
    data,
  );
  return response.data.data;
}
```

### 컴포넌트 로직

#### 저장 버튼 핸들러

```typescript
const handleSave = async () => {
  const data = collectFormData();

  if (!postId) {
    // 새 글: POST로 생성
    const post = await createAdminPost(siteId, {
      ...data,
      status: selectedStatus,  // 라디오 버튼 값
    });
    router.push(`/admin/posts/${post.id}`);
  } else {
    // 기존 글: PUT으로 교체 (draft 자동 삭제됨)
    await replaceAdminPost(siteId, postId, {
      ...data,
      status: selectedStatus,
    });
    toast.success('저장되었습니다');
  }
};
```

#### 임시저장 버튼 핸들러

```typescript
const handleDraftSave = async () => {
  let id = postId;

  // 새 글이면 먼저 비공개로 post 생성
  if (!id) {
    const post = await createAdminPost(siteId, {
      title: formData.title || '제목 없음',
      subtitle: formData.subtitle || ' ',
      contentJson: formData.contentJson || { type: 'doc', content: [] },
      status: PostStatus.PRIVATE,
    });
    id = post.id;
    setPostId(id);  // 상태 업데이트
  }

  // draft 저장
  await saveDraft(siteId, id, collectFormData());
  toast.success('임시저장되었습니다');
};
```

#### 불러오기 버튼 핸들러

```typescript
const handleLoadDraft = async () => {
  if (!postId || !hasDraft) return;

  const draft = await getDraft(siteId, postId);
  if (draft) {
    // 폼에 draft 내용 로드
    methods.reset({
      title: draft.title,
      subtitle: draft.subtitle,
      slug: draft.slug,
      categoryId: draft.categoryId,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      ogImageUrl: draft.ogImageUrl,
    });

    // 에디터에 content 로드
    editorRef.current?.setContent(draft.contentJson);

    toast.success('임시저장 내용을 불러왔습니다');
  }
};
```

#### 자동저장 (use-auto-save.ts)

```typescript
// 변경: 항상 draft로 저장 (상태 무관)
const executeSave = useCallback(async (): Promise<boolean> => {
  const data = pendingDataRef.current;
  if (!data) return false;

  let id = postIdRef.current;

  // 새 글이면 먼저 post 생성
  if (!id) {
    if (isContentEmpty(data.contentJson)) return false;

    const post = await createAdminPost(siteId, {
      title: data.title || '제목 없음',
      subtitle: data.subtitle || ' ',
      contentJson: data.contentJson,
      status: PostStatus.PRIVATE,
    });
    id = post.id;
    postIdRef.current = id;
    onPostCreated?.(id);
  }

  // 항상 draft로 저장
  await saveDraft(siteId, id, data);
  return true;
}, [siteId, onPostCreated]);
```

### 공개 여부 라디오 컴포넌트

```typescript
// src/components/app/post/PostStatusRadio.tsx
'use client';

import { PostStatus } from '@/lib/api';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PostStatusRadioProps {
  value: PostStatus;
  onChange: (status: PostStatus) => void;
  disabled?: boolean;
}

export function PostStatusRadio({ value, onChange, disabled }: PostStatusRadioProps) {
  return (
    <div className="space-y-2">
      <Label>공개 여부</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as PostStatus)}
        disabled={disabled}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={PostStatus.PRIVATE} id="private" />
          <Label htmlFor="private" className="font-normal cursor-pointer">
            비공개
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={PostStatus.PUBLISHED} id="published" />
          <Label htmlFor="published" className="font-normal cursor-pointer">
            공개
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

### 삭제할 코드

```typescript
// 삭제: 상태 전환 API 함수
- publishPost()
- republishPost()
- unpublishPost()

// 삭제: 상태별 분기 로직 (use-auto-save.ts)
- if (postStatus === PostStatus.PRIVATE) { ... }
- if (postStatus === PostStatus.PUBLISHED) { ... }

// 삭제: 복잡한 모달들
- publishModalOpen
- republishModalOpen
- unpublishModalOpen
- discardModalOpen
```

## 구현 체크리스트

### Phase 1: 타입 및 API
- [ ] ReplacePostRequest 타입 추가
- [ ] SaveDraftRequest에 slug 추가
- [ ] replaceAdminPost() 함수 추가
- [ ] 기존 상태 전환 API 함수 deprecated 처리

### Phase 2: 컴포넌트
- [ ] PostStatusRadio 컴포넌트 생성
- [ ] 불러오기 버튼 UI 추가

### Phase 3: 새 글 페이지 (new/page.tsx)
- [ ] 버튼 구조 변경: [저장] [임시저장]
- [ ] 공개 여부 라디오 추가
- [ ] handleSave 로직 (createAdminPost)
- [ ] handleDraftSave 로직 (post 생성 → draft 저장)
- [ ] 모달 제거

### Phase 4: 수정 페이지 (edit/page.tsx)
- [ ] 버튼 구조 변경: [저장] [임시저장] [불러오기]
- [ ] 공개 여부 라디오 추가 (현재 상태로 초기화)
- [ ] handleSave 로직 (replaceAdminPost)
- [ ] handleDraftSave 로직 (saveDraft)
- [ ] handleLoadDraft 로직 (getDraft → 폼 로드)
- [ ] 드래프트 선택 모달 제거 (불러오기 버튼으로 대체)
- [ ] 상태 전환 모달들 제거

### Phase 5: 자동저장 (use-auto-save.ts)
- [ ] 상태별 분기 제거
- [ ] 항상 draft로 저장하도록 단순화
- [ ] postStatus 파라미터 제거

### Phase 6: 테스트
- [ ] 새 글 저장 테스트
- [ ] 새 글 임시저장 테스트
- [ ] 기존 글 저장 테스트
- [ ] 기존 글 임시저장 → 불러오기 테스트
- [ ] 자동저장 테스트
- [ ] 공개/비공개 전환 테스트

## 테스트 시나리오

### 시나리오 1: 새 글 작성 후 공개 저장
```
1. 새 글 페이지 진입
2. 제목, 내용 입력
3. 공개 여부: "공개" 선택
4. [저장] 클릭
5. 확인: status=PUBLISHED로 저장됨
```

### 시나리오 2: 새 글 임시저장 → 나중에 저장
```
1. 새 글 페이지 진입
2. 제목, 내용 입력
3. [임시저장] 클릭
4. 확인: 비공개 post 생성 + draft 저장
5. 페이지 이탈 후 재진입
6. [불러오기] 클릭
7. 확인: draft 내용 폼에 로드됨
8. [저장] 클릭
9. 확인: post 업데이트 + draft 삭제됨
```

### 시나리오 3: 공개 글 → 비공개 전환
```
1. 공개 글 편집 페이지 진입
2. 공개 여부: "비공개" 선택
3. [저장] 클릭
4. 확인: status=PRIVATE로 변경됨
```

### 시나리오 4: 자동저장
```
1. 글 작성/편집 중
2. 5분 대기
3. 확인: draft로 자동저장됨 (post는 변경 안 됨)
4. [저장] 클릭
5. 확인: post 업데이트 + draft 삭제됨
```

## 참고 자료

- 백엔드 작업: pagelet-api/.tasks/backlog/post-api-simplification.md
- 현재 edit/page.tsx: /app/(app)/admin/posts/[postId]/edit/page.tsx
- 현재 use-auto-save.ts: /src/hooks/use-auto-save.ts
