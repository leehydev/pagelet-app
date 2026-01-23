# [FE] 게시글 상세 페이지 인접 게시글 네비게이션 구현

## GitHub 이슈
- **이슈 번호**: #45
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/45
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: BE pagelet-api#40 (인접 게시글 API 구현)

## 의존성
- [ ] leehydev/pagelet-api#40 (백엔드 API 완료 후 진행)

## 개요

블로그 게시글 상세 조회 페이지 하단에 현재 게시글 전후로 2개씩(총 5개)의 게시글 목록을 보여주는 네비게이션 UI를 구현합니다.

예시:
- 게시글이 10개 있고 5번째 게시글을 보는 경우: 3, 4, **5(현재)**, 6, 7번 게시글
- 처음/끝 부분에서는 가능한 만큼만 표시 (예: 1번 게시글이면 1, 2, 3, 4, 5)

## 작업 범위

### 포함
- API 응답 타입에 인접 게시글 필드 추가
- 서버 API 함수에 인접 게시글 타입 반영
- 인접 게시글 네비게이션 컴포넌트 구현
- 게시글 상세 페이지에 컴포넌트 통합

### 제외
- 백엔드 API 구현 (별도 태스크)
- 인접 게시글 애니메이션/전환 효과 (추후 고려)

## 기술 명세

### 영향받는 파일
- `src/lib/api/types.ts` - 타입 정의 추가
- `src/lib/api/server.ts` - 서버 API 함수 타입 업데이트
- `src/components/public/AdjacentPostsNav.tsx` - 새 컴포넌트 (신규)
- `app/(public)/t/[slug]/posts/[postSlug]/page.tsx` - 컴포넌트 통합

### 타입 정의

```typescript
// src/lib/api/types.ts

export interface AdjacentPost {
  id: string;
  title: string;
  slug: string;
  ogImageUrl: string | null;
  publishedAt: string;
  isCurrent: boolean;
}

export interface PublicPost {
  // ... 기존 필드들
  adjacentPosts: AdjacentPost[];
}
```

### 컴포넌트 설계

```tsx
// src/components/public/AdjacentPostsNav.tsx

interface AdjacentPostsNavProps {
  posts: AdjacentPost[];
  siteSlug: string;
}

export function AdjacentPostsNav({ posts, siteSlug }: AdjacentPostsNavProps) {
  // 현재 게시글 강조 표시
  // 게시글 카드 형태로 가로 나열
  // 클릭 시 해당 게시글로 이동
}
```

### UI 디자인

**레이아웃:**
- 게시글 본문 아래, 기존 하단 네비게이션 위에 배치
- 가로 스크롤 가능한 카드 리스트 (모바일 대응)
- 데스크톱: 5개 카드 가로 나열
- 모바일: 3개 정도 표시, 나머지 스크롤

**카드 디자인:**
- 썸네일 이미지 (ogImageUrl, 없으면 플레이스홀더)
- 게시글 제목 (1-2줄 말줄임)
- 발행일
- 현재 게시글: 테두리 강조 또는 배경색 구분

**반응형:**
```
Desktop (1024px+): 5개 카드 (균등 분배)
Tablet (768px-1023px): 4개 카드 + 스크롤
Mobile (-767px): 2-3개 카드 + 스크롤
```

## 구현 체크리스트

- [ ] `AdjacentPost` 타입 정의 추가 (`src/lib/api/types.ts`)
- [ ] `PublicPost` 타입에 `adjacentPosts` 필드 추가
- [ ] `AdjacentPostsNav` 컴포넌트 구현
  - [ ] 기본 레이아웃 및 스타일링
  - [ ] 현재 게시글 강조 표시
  - [ ] 반응형 디자인
  - [ ] 썸네일 이미지 처리 (없는 경우 플레이스홀더)
- [ ] 게시글 상세 페이지에 컴포넌트 통합
- [ ] 접근성 고려 (키보드 네비게이션, ARIA)

## 테스트 계획

- [ ] 컴포넌트 렌더링 테스트
  - 5개 게시글 정상 표시
  - 5개 미만 게시글 처리
  - 현재 게시글 강조 표시
  - 썸네일 없는 경우 플레이스홀더
- [ ] 반응형 동작 확인 (브라우저 테스트)
- [ ] 접근성 테스트 (키보드 네비게이션)

## 참고 자료

- 기존 게시글 상세 페이지: `app/(public)/t/[slug]/posts/[postSlug]/page.tsx`
- 기존 게시글 카드 컴포넌트: `src/components/public/PostCard.tsx`
- API 타입 정의: `src/lib/api/types.ts`
- 서버 API: `src/lib/api/server.ts`
