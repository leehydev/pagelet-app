# [FE] Site 상태 관리 Zustand 스토어 마이그레이션

## GitHub 이슈

- **이슈 번호**: #103
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/103
- **우선순위**: 높음
- **후속 태스크**: #104, #105

## 개요

URL 기반 siteId 관리에서 Zustand 스토어 기반으로 변경합니다.
이 작업은 URL에서 siteId를 제거하기 위한 선행 작업입니다.

### 배경
- 현재: URL `/admin/[siteId]/...`에서 siteId 추출
- 변경: Zustand 스토어에서 currentSiteId 관리

## 작업 범위

### 포함
- Zustand site-store 생성
- SiteContext를 스토어 기반으로 변경
- extractSiteIdFromUrl() → 스토어 연동
- 사이트 선택 시 스토어 업데이트

### 제외
- URL 구조 변경 (별도 태스크 #104)
- API v2 마이그레이션 (별도 태스크 #103)

## 기술 명세

### 영향받는 파일

**생성:**
- `src/stores/site-store.ts` - Zustand 스토어

**수정:**
- `src/contexts/site-context.tsx` - 스토어 연동
- `src/lib/api/client.ts` - extractSiteIdFromUrl() 수정
- `src/components/app/layout/SiteSwitcher.tsx` - 스토어 업데이트
- `app/(app)/admin/[siteId]/layout.tsx` - 스토어 초기화

### 타입 정의

```typescript
// src/stores/site-store.ts
interface SiteState {
  currentSiteId: string | null;
  setCurrentSiteId: (siteId: string | null) => void;
}
```

## 구현 체크리스트

### Phase 1: Zustand 스토어 생성
- [x] `src/stores/site-store.ts` 생성
- [x] localStorage persist 설정 (선택)

### Phase 2: 기존 코드 연동
- [x] `extractSiteIdFromUrl()` 수정 → 스토어 우선, URL 폴백
- [x] `SiteContext` 스토어 연동
- [x] `SiteSwitcher` 사이트 변경 시 스토어 업데이트
- [x] Admin layout에서 스토어 초기화 (SiteProvider에서 처리)

### Phase 3: 테스트
- [x] 사이트 전환 시 스토어 업데이트 확인
- [x] API 요청에 X-Site-Id 헤더 확인
- [x] 새로고침 후 상태 유지 확인

## 테스트 계획

### 수동 테스트
- [x] 사이트 전환 → 스토어 값 변경 확인
- [x] 페이지 새로고침 → 상태 유지 확인
- [x] API 호출 → X-Site-Id 헤더 확인

## 참고 자료

- 기존 스토어: `src/stores/modal-store.ts`
- SiteContext: `src/contexts/site-context.tsx`
