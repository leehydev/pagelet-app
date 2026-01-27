# [FE] 게시글 배너 UI 리팩토링

## GitHub 이슈

- **이슈 번호**: #38
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/38
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-api#33 (백엔드)

## 의존성

- [ ] leehydev/pagelet-api#33

## 개요

기존 이미지 기반 배너 UI를 게시글 기반 배너 UI로 리팩토링합니다.

### 변경 사항

- **기존**: 이미지 업로드 + 링크 입력 + desktop/mobile 탭
- **변경**: 게시글 검색/선택 + 가로형 카드 레이아웃 + 캐러셀

## 작업 범위

### 포함

- API 타입 정의 수정
- 게시글 검색 오토컴플리트 컴포넌트
- 가로형 게시글 배너 카드 컴포넌트
- 캐러셀 슬라이더 수정
- 어드민 배너 관리 페이지 수정
- 배너 폼 수정

### 제외

- 백엔드 API 구현 (별도 이슈)

## UI/UX 명세

### 1. 가로형 게시글 배너 카드 (PostBannerCard)

**레이아웃 (데스크톱):**

- 텍스트 영역 60-65% (왼쪽)
- 이미지 영역 35-40% (오른쪽)
- 카테고리 태그 (Badge)
- 제목: bold, 1-2줄 말줄임
- 소제목: gray, 1-2줄 말줄임
- 작성일 표시
- hover: shadow 또는 배경색 변화
- 전체 카드 클릭 시 블로그 글로 이동

**레이아웃 (모바일):**

- 세로 배치 (이미지 위, 텍스트 아래)
- breakpoint: md (768px)

**이미지:**

- 16:9 비율
- border-radius: 8px
- object-fit: cover

### 2. 게시글 검색 오토컴플리트 (PostSearchAutocomplete)

- 입력 시 디바운스 (300ms)
- 드롭다운에 게시글 목록 표시 (썸네일 + 제목 + 소제목 + 카테고리/날짜)
- PUBLISHED 상태 게시글만 표시
- 이미 등록된 배너 게시글 제외 옵션

### 3. 캐러셀 슬라이더 (PostBannerSlider)

- PostBannerCard 컴포넌트 사용
- 좌우 네비게이션 화살표
- 인디케이터 도트
- 자동 슬라이드 (5초 간격)

### 4. 어드민 배너 목록 수정

- desktop/mobile 탭 제거
- 단일 목록으로 변경
- 드래그앤드롭 순서 변경 유지
- 최대 5개 제한

### 5. 배너 폼 수정

- 이미지 업로더 제거
- 게시글 검색 오토컴플리트 추가
- 선택된 게시글 미리보기 표시
- linkUrl, openInNewTab, altText 필드 제거

## 구현 체크리스트

### API/타입

- [x] API 타입 정의 수정 (Banner, PublicBanner, CreateBannerRequest 등)
- [x] 게시글 검색 API 훅 추가
- [x] 배너 관련 API 훅 수정 (deviceType 제거)
- [x] DeviceType 관련 코드 제거

### 컴포넌트 신규

- [x] PostSearchAutocomplete 컴포넌트
- [x] PostBannerCard 컴포넌트 (가로형 레이아웃)
- [x] PostBannerSlider 컴포넌트

### 컴포넌트 수정

- [x] BannerList 수정 (탭 제거)
- [x] BannerFormSheet 수정 (게시글 선택)
- [x] BannerCard 수정 또는 제거
- [x] BannerUploader 제거

### 페이지

- [x] 어드민 배너 관리 페이지 수정
- [x] 공개 블로그 페이지 배너 섹션 수정

## 영향받는 파일

### 수정

- `src/lib/api/types.ts`
- `src/lib/api/client.ts`
- `src/lib/api/server.ts`
- `src/hooks/use-banners.ts`
- `src/hooks/use-posts.ts`
- `src/components/app/banners/BannerList.tsx`
- `src/components/app/banners/BannerFormSheet.tsx`
- `src/components/app/banners/BannerCard.tsx`
- `src/components/app/banners/index.ts`
- `app/(app)/admin/[siteId]/banners/page.tsx`
- `app/(public)/t/[slug]/page.tsx`

### 신규

- `src/components/app/banners/PostSearchAutocomplete.tsx`
- `src/components/public/PostBannerCard.tsx`
- `src/components/public/PostBannerSlider.tsx`

### 삭제

- `src/components/app/banners/BannerUploader.tsx`
- `src/components/public/BannerSlider.tsx`
- `src/hooks/use-banner-upload.ts`
