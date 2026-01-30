# [FE] Admin API v2 전체 마이그레이션

## GitHub 이슈

- **이슈 번호**: #104
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/104
- **우선순위**: 높음
- **선행 태스크**: #103 (Site 스토어)
- **후속 태스크**: #105 (URL 구조 변경)

## 의존성

- [ ] #103 Site 스토어 마이그레이션
- [ ] leehydev/pagelet-api#102 Admin API v2 컨트롤러

## 개요

모든 Admin API를 v1에서 v2로 마이그레이션합니다.
v2 API는 URL 파라미터 대신 `X-Site-Id` 헤더를 사용합니다.

### 배경

- v1: `/admin/sites/:siteId/posts` - URL에 siteId 포함
- v2: `/admin/v2/posts` + 헤더 `X-Site-Id: {uuid}`

## 작업 범위

### 포함

- 모든 Admin API 함수 v2 버전 추가 (34개)
- 관련 Hook v2 버전 추가
- 기존 v1 함수 deprecation 표시

### 제외

- v1 API 삭제 (하위 호환성 유지)
- 백엔드 v2 API 추가 (별도 백엔드 작업)

## 기술 명세

### 영향받는 파일

**수정:**

- `src/lib/api/client.ts` - v2 API 함수 추가
- `src/hooks/use-posts.ts` - v2 Hook 추가
- `src/hooks/use-categories.ts` - v2 Hook 추가 (완료)
- `src/hooks/use-site-settings.ts` - v2 Hook 추가
- `src/hooks/use-upload.ts` - v2 Hook 추가
- `src/hooks/use-banners.ts` - v2 Hook 추가
- `src/hooks/use-analytics.ts` - v2 Hook 추가

### API 변경 목록

| 기존 (v1)                            | 변경 (v2)                 |
| ------------------------------------ | ------------------------- |
| `/admin/sites/:siteId/posts`         | `/admin/v2/posts`         |
| `/admin/sites/:siteId/posts/:postId` | `/admin/v2/posts/:postId` |
| `/admin/sites/:siteId/categories`    | `/admin/v2/categories`    |
| `/admin/sites/:siteId/settings`      | `/admin/v2/settings`      |
| `/admin/sites/:siteId/uploads/*`     | `/admin/v2/uploads/*`     |
| `/admin/sites/:siteId/banners`       | `/admin/v2/banners`       |
| `/admin/sites/:siteId/analytics/*`   | `/admin/v2/analytics/*`   |

## 구현 체크리스트

### Phase 1: 백엔드 v2 API 확인

- [x] Posts v2 API 준비 여부 확인
- [x] Settings v2 API 준비 여부 확인
- [x] Uploads v2 API 준비 여부 확인
- [x] Banners v2 API 준비 여부 확인
- [x] Analytics v2 API 준비 여부 확인

### Phase 2: API 함수 추가

- [x] Category v2 API (완료 - #101)
- [x] Posts v2 API 함수 추가
- [x] Settings v2 API 함수 추가
- [x] Uploads v2 API 함수 추가
- [x] Banners v2 API 함수 추가
- [x] Analytics v2 API 함수 추가
- [x] Branding v2 API 함수 추가

### Phase 3: Hook 추가

- [x] Category v2 Hook (완료 - #101)
- [x] Posts v2 Hook 추가
- [x] Settings v2 Hook 추가
- [x] Upload v2 Hook 추가
- [x] Banners v2 Hook 추가
- [x] Analytics v2 Hook 추가
- [x] Branding Upload v2 Hook 추가

### Phase 4: 테스트

- [x] 각 v2 API 동작 확인
- [x] X-Site-Id 헤더 전송 확인

## 테스트 계획

### 수동 테스트

- [x] 게시글 CRUD v2
- [x] 카테고리 CRUD v2
- [x] 설정 조회/수정 v2
- [x] 파일 업로드 v2
- [x] 배너 CRUD v2
- [x] 분석 조회 v2

## 참고 자료

- PoC PR: #102 (Category v2)
- 백엔드 v2 Guard: `pagelet-api/src/auth/guards/admin-site-header.guard.ts`
