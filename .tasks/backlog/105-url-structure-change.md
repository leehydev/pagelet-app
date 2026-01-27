# [FE] Admin URL 구조 변경 (siteId 제거)

## GitHub 이슈

- **이슈 번호**: #105
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/105
- **우선순위**: 중간
- **선행 태스크**: #103 (Site 스토어), #104 (API v2)

## 의존성

- [ ] #103 Site 스토어 마이그레이션
- [ ] #104 Admin API v2 마이그레이션

## 개요

Admin URL에서 siteId를 제거하고 더 깔끔한 URL 구조로 변경합니다.

### 배경
- 현재: `/admin/[siteId]/posts`, `/admin/[siteId]/categories`
- 변경: `/admin/posts`, `/admin/categories`

## 작업 범위

### 포함
- 라우트 구조 변경 (`[siteId]` 제거)
- 모든 Admin 페이지 업데이트
- 내부 링크 업데이트
- 리다이렉트 설정 (기존 URL 지원)

### 제외
- Public 블로그 URL (변경 없음)

## 기술 명세

### 영향받는 파일

**이동 (디렉토리 구조 변경):**
```
app/(app)/admin/[siteId]/
├── page.tsx           → app/(app)/admin/dashboard/page.tsx
├── posts/             → app/(app)/admin/posts/
├── categories/        → app/(app)/admin/categories/
├── banners/           → app/(app)/admin/banners/
├── settings/          → app/(app)/admin/settings/
└── layout.tsx         → app/(app)/admin/layout.tsx (수정)
```

**수정:**
- 모든 Admin 페이지에서 `useParams` → `useSiteId()` 변경
- `AdminSidebar.tsx` 링크 업데이트
- `SiteSwitcher.tsx` 네비게이션 업데이트

### URL 변경 매핑

| 기존 | 변경 |
|------|------|
| `/admin/[siteId]` | `/admin/dashboard` |
| `/admin/[siteId]/posts` | `/admin/posts` |
| `/admin/[siteId]/posts/new` | `/admin/posts/new` |
| `/admin/[siteId]/posts/[postId]` | `/admin/posts/[postId]` |
| `/admin/[siteId]/posts/[postId]/edit` | `/admin/posts/[postId]/edit` |
| `/admin/[siteId]/categories` | `/admin/categories` |
| `/admin/[siteId]/categories/new` | `/admin/categories/new` |
| `/admin/[siteId]/categories/[id]/edit` | `/admin/categories/[id]/edit` |
| `/admin/[siteId]/banners` | `/admin/banners` |
| `/admin/[siteId]/settings` | `/admin/settings` |

## 구현 체크리스트

### Phase 1: 디렉토리 구조 변경
- [ ] `app/(app)/admin/[siteId]/` 내용을 `app/(app)/admin/`으로 이동
- [ ] layout.tsx 수정 (URL에서 siteId 추출 제거)
- [ ] `[siteId]` 디렉토리 삭제

### Phase 2: 페이지 업데이트
- [ ] 모든 페이지에서 `useParams` → `useSiteId()` 변경
- [ ] 대시보드 페이지 `/admin/dashboard`로 이동

### Phase 3: 링크 업데이트
- [ ] `AdminSidebar.tsx` 링크 수정
- [ ] `SiteSwitcher.tsx` 네비게이션 수정
- [ ] 페이지 내 내부 링크 수정

### Phase 4: 리다이렉트 설정
- [ ] `next.config.js`에 기존 URL 리다이렉트 추가
- [ ] `/admin/[siteId]/*` → `/admin/*` 리다이렉트

### Phase 5: 테스트
- [ ] 모든 Admin 페이지 접근 확인
- [ ] 사이트 전환 동작 확인
- [ ] 기존 URL 리다이렉트 확인

## 테스트 계획

### 수동 테스트
- [ ] `/admin` 접속 → 사이트 선택 또는 대시보드
- [ ] `/admin/posts` 게시글 목록 표시
- [ ] `/admin/categories` 카테고리 목록 표시
- [ ] 사이트 전환 → 데이터 변경 확인
- [ ] 기존 URL `/admin/[uuid]/posts` → 리다이렉트 확인

## 참고 자료

- 현재 라우트: `app/(app)/admin/[siteId]/`
- SiteContext: `src/contexts/site-context.tsx`
- Site 스토어: `src/stores/site-store.ts` (태스크 #102에서 생성)
