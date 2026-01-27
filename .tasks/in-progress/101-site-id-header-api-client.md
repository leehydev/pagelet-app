# [FE] X-Site-Id 헤더 기반 API 클라이언트 (PoC)

## GitHub 이슈

- **이슈 번호**: #101
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/101
- **우선순위**: 높음
- **관련 태스크**: leehydev/pagelet-api#100

## 의존성

- [x] leehydev/pagelet-api#100

## 개요

Admin API 호출 시 URL 파라미터 대신 `X-Site-Id` 헤더로 사이트 ID를 전달하도록 변경합니다.
백엔드에서 `/admin/v2/categories` PoC API가 준비되었으므로, 프론트엔드에서도 PoC를 진행합니다.

### 배경
- 현재: `/admin/sites/:siteId/categories` - URL에 siteId 노출
- 변경: `/admin/v2/categories` + 헤더 `X-Site-Id: {uuid}`

## 작업 범위

### 포함
- Axios Interceptor에 X-Site-Id 헤더 자동 주입
- v2 API 함수 추가 (카테고리 목록 조회)
- v2 Hook 추가
- 카테고리 페이지에서 PoC 검증

### 제외
- 다른 Admin API 변경 (PoC 검증 후 별도 작업)
- URL 구조 변경 (`/admin/[siteId]/...`는 유지)

## 기술 명세

### 영향받는 파일

**수정:**
- `src/lib/api/client.ts` - Interceptor 및 v2 API 함수
- `src/hooks/use-categories.ts` - v2 Hook 추가

**선택적 수정 (테스트용):**
- `app/(app)/admin/[siteId]/categories/page.tsx` - v2 Hook 적용

### API 변경사항

#### 헤더 스펙
| 헤더 이름 | 값 형식 | 필수 여부 |
|-----------|---------|----------|
| `X-Site-Id` | UUID v4 | Admin v2 API 필수 |

#### v2 엔드포인트 (PoC)
| 기존 | 변경 |
|------|------|
| `GET /admin/sites/:siteId/categories` | `GET /admin/v2/categories` |
| `POST /admin/sites/:siteId/categories` | `POST /admin/v2/categories` |
| `PUT /admin/sites/:siteId/categories/:id` | `PUT /admin/v2/categories/:id` |
| `DELETE /admin/sites/:siteId/categories/:id` | `DELETE /admin/v2/categories/:id` |

### 타입 정의

```typescript
// 기존 (변경 없음)
export interface Category {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  postCount: number;
}
```

## 구현 체크리스트

### Phase 1: Interceptor 추가
- [x] `src/lib/api/client.ts`에 X-Site-Id 헤더 자동 주입 로직 추가
  - [x] URL에서 `/admin/[siteId]/` 패턴 추출
  - [x] siteId가 있으면 `X-Site-Id` 헤더 추가
  - [x] 기존 v1 API도 헤더 전송 (백엔드에서 무시됨)

```typescript
// 구현 예시
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // X-Site-Id 헤더 추가
  const siteId = extractSiteIdFromUrl();
  if (siteId) {
    config.headers['X-Site-Id'] = siteId;
  }

  return config;
});
```

### Phase 2: v2 API 함수 추가
- [x] `getAdminCategoriesV2()` 함수 추가
- [x] `createCategoryV2()` 함수 추가
- [x] `updateCategoryV2()` 함수 추가
- [x] `deleteCategoryV2()` 함수 추가

```typescript
// 구현 예시 - siteId 파라미터 없음 (interceptor가 자동 처리)
export async function getAdminCategoriesV2(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>('/admin/v2/categories');
  return response.data.data;
}
```

### Phase 3: v2 Hook 추가
- [x] `useAdminCategoriesV2()` Hook 추가
- [x] `useCreateCategoryV2()` Hook 추가
- [x] `useUpdateCategoryV2()` Hook 추가
- [x] `useDeleteCategoryV2()` Hook 추가

### Phase 4: 테스트
- [ ] 개발자 도구 Network 탭에서 X-Site-Id 헤더 확인
- [ ] 카테고리 목록 조회 동작 확인
- [ ] 카테고리 CRUD 동작 확인
- [ ] 에러 케이스 확인 (헤더 누락, 권한 없음)

## 테스트 계획

### 수동 테스트
- [ ] 카테고리 페이지에서 목록 조회 확인
- [ ] 카테고리 생성/수정/삭제 동작 확인
- [ ] Network 탭에서 `X-Site-Id` 헤더 전송 확인
- [ ] 다른 사이트 ID 헤더 전송 시 403 에러 확인

### 검증 포인트
| 시나리오 | 예상 결과 |
|---------|----------|
| 정상 요청 | 카테고리 목록 반환 |
| 헤더 누락 | 400 SITE_003 에러 |
| 잘못된 UUID | 400 COMMON_006 에러 |
| 권한 없음 | 403 COMMON_004 에러 |

## 참고 자료

### 백엔드 PoC
- Guard: `pagelet-api/src/auth/guards/admin-site-header.guard.ts`
- Controller: `pagelet-api/src/category/admin-category-v2.controller.ts`
- PR: https://github.com/leehydev/pagelet-api/pull/101

### 기존 설계 문서
- `SITE_CONTEXT_PLAN.md` - X-Site-Id 헤더 주입 설계 (참고용)

## 후속 작업

PoC 검증 완료 후:
1. 모든 Admin API를 v2로 마이그레이션
2. v1 API 함수 deprecation
3. URL에서 siteId 제거 여부 검토
