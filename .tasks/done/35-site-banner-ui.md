# [FE] 사이트 배너 관리 UI 구현

## GitHub 이슈
- **이슈 번호**: #35
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/35
- **생성일**: 2025-01-23
- **우선순위**: 높음
- **관련 태스크**: leehydev/pagelet-api#29 (백엔드)

## 개요

사이트 관리자가 배너를 등록/수정/삭제할 수 있는 관리 페이지 UI를 구현합니다.
데스크톱/모바일 배너를 탭으로 분리하여 관리합니다.

## 의존성

- [ ] leehydev/pagelet-api#29 (백엔드 API 완료 필요)

## 작업 범위

### 포함
- 배너 관리 페이지 UI (/admin/[siteId]/banners)
- 배너 목록 표시 (데스크톱/모바일 탭)
- 배너 등록/수정 폼 (모달 또는 별도 페이지)
- 배너 삭제 확인 다이얼로그
- 드래그 앤 드롭으로 순서 변경
- API 타입 정의 및 클라이언트 함수 추가
- 공개 사이트에서 배너 슬라이더 표시

### 제외
- 백엔드 API (pagelet-api#29에서 진행)

## 기술 명세

### 영향받는 파일

**신규 생성:**
- `app/(app)/admin/[siteId]/banners/page.tsx` - 배너 관리 페이지
- `src/components/app/banners/BannerList.tsx` - 배너 목록 컴포넌트
- `src/components/app/banners/BannerCard.tsx` - 배너 카드 컴포넌트
- `src/components/app/banners/BannerForm.tsx` - 배너 등록/수정 폼
- `src/components/app/banners/BannerUploader.tsx` - 이미지 업로드 컴포넌트
- `src/components/app/banners/index.ts`
- `src/components/public/BannerSlider.tsx` - 공개 사이트용 배너 슬라이더
- `src/hooks/useBanners.ts` - React Query 훅

**수정:**
- `src/lib/api/types.ts` - 타입 정의 추가
- `src/lib/api/client.ts` - API 함수 추가
- `src/lib/api/server.ts` - Public API 함수 추가
- `src/components/app/layout/AdminSidebar.tsx` - 배너 메뉴 추가

### 타입 정의

```typescript
// src/lib/api/types.ts에 추가

export type DeviceType = 'desktop' | 'mobile';

export interface Banner {
  id: string;
  siteId: string;
  imageUrl: string;
  linkUrl: string | null;
  openInNewTab: boolean;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
  displayOrder: number;
  altText: string | null;
  deviceType: DeviceType;
  createdAt: string;
  updatedAt: string;
}

export interface PublicBanner {
  imageUrl: string;
  linkUrl: string | null;
  openInNewTab: boolean;
  altText: string | null;
  displayOrder: number;
}

export interface BannerPresignRequest {
  filename: string;
  size: number;
  mimeType: string;
}

export interface BannerPresignResponse {
  uploadUrl: string;
  publicUrl: string;
  s3Key: string;
}

export interface CreateBannerRequest {
  imageUrl: string;
  linkUrl?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
  startAt?: string;
  endAt?: string;
  displayOrder?: number;
  altText?: string;
  deviceType: DeviceType;
}

export interface UpdateBannerRequest {
  imageUrl?: string;
  linkUrl?: string | null;
  openInNewTab?: boolean;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  displayOrder?: number;
  altText?: string;
}

export interface BannerOrderRequest {
  bannerIds: string[];
  deviceType: DeviceType;
}
```

### API 클라이언트 함수

```typescript
// src/lib/api/client.ts에 추가

// Presign URL 발급
export async function presignBannerUpload(
  siteId: string,
  request: BannerPresignRequest
): Promise<BannerPresignResponse>

// 배너 생성
export async function createBanner(
  siteId: string,
  request: CreateBannerRequest
): Promise<Banner>

// 배너 목록 조회
export async function fetchBanners(
  siteId: string,
  deviceType?: DeviceType
): Promise<Banner[]>

// 배너 상세 조회
export async function fetchBanner(
  siteId: string,
  bannerId: string
): Promise<Banner>

// 배너 수정
export async function updateBanner(
  siteId: string,
  bannerId: string,
  request: UpdateBannerRequest
): Promise<Banner>

// 배너 삭제
export async function deleteBanner(
  siteId: string,
  bannerId: string
): Promise<void>

// 순서 변경
export async function updateBannerOrder(
  siteId: string,
  request: BannerOrderRequest
): Promise<void>

// src/lib/api/server.ts에 추가

// 공개 배너 조회
export async function fetchPublicBanners(
  siteSlug: string,
  deviceType: DeviceType
): Promise<PublicBanner[]>
```

### React Query 훅

```typescript
// src/hooks/useBanners.ts

export function useBanners(siteId: string, deviceType?: DeviceType)
export function useBanner(siteId: string, bannerId: string)
export function useCreateBanner(siteId: string)
export function useUpdateBanner(siteId: string)
export function useDeleteBanner(siteId: string)
export function useUpdateBannerOrder(siteId: string)
```

### UI 명세

#### 배너 관리 페이지 (`/admin/[siteId]/banners`)

```
+--------------------------------------------------+
| 배너 관리                            [+ 배너 추가] |
+--------------------------------------------------+
| [데스크톱] [모바일]                                |
+--------------------------------------------------+
| +----------------+  +----------------+            |
| | 배너 이미지    |  | 배너 이미지    |            |
| | -------------- |  | -------------- |            |
| | 링크: https... |  | 링크: https... |            |
| | 활성: ON       |  | 활성: OFF      |            |
| | 기간: ~        |  | 기간: ~        |            |
| | [수정] [삭제]  |  | [수정] [삭제]  |            |
| +----------------+  +----------------+            |
|                                                  |
| * 드래그하여 순서 변경                            |
| * 최대 5개까지 등록 가능 (현재 2/5)               |
+--------------------------------------------------+
```

#### 배너 등록/수정 폼

```
+--------------------------------------------------+
| 배너 등록 / 배너 수정                              |
+--------------------------------------------------+
| 이미지 *                                          |
| +------------------------------------------+     |
| |    [이미지 업로드 영역]                   |     |
| |    권장 크기: 1280 x 300~500px           |     |
| |    최대 5MB (PNG, JPG, WebP)             |     |
| +------------------------------------------+     |
|                                                  |
| 링크 URL                                          |
| [https://example.com                        ]    |
|                                                  |
| [ ] 새 탭에서 열기                                |
|                                                  |
| 활성화 상태                                       |
| [ON / OFF 토글]                                   |
|                                                  |
| 노출 기간 (선택사항)                              |
| 시작: [2025-01-23 09:00] ~ 종료: [2025-01-30 18:00] |
|                                                  |
| 대체 텍스트 (접근성)                              |
| [배너 설명 입력                              ]    |
|                                                  |
|                        [취소] [저장]             |
+--------------------------------------------------+
```

#### 공개 사이트 배너 슬라이더

- 자동 슬라이드 (5초 간격)
- 수동 좌우 네비게이션
- 인디케이터 도트
- 반응형: 뷰포트에 따라 desktop/mobile 배너 자동 전환
- 클릭 시 링크 이동 (`rel="noopener noreferrer nofollow"` 필수)

### 제약사항

- 파일 크기: 5MB 제한
- 권장 크기: 1280px 너비, 세로 300~500px
- MIME: image/png, image/jpeg, image/webp
- 사이트당 배너 최대 5개 (device_type별 각각)
- link_url: http/https 프로토콜만 허용

## 구현 체크리스트

- [ ] Banner 관련 타입 정의 추가 (`types.ts`)
- [ ] API 클라이언트 함수 구현 (`client.ts`)
- [ ] Public API 함수 구현 (`server.ts`)
- [ ] React Query 훅 구현 (`useBanners.ts`)
- [ ] 배너 관리 페이지 레이아웃
- [ ] BannerList 컴포넌트 (탭 + 목록)
- [ ] BannerCard 컴포넌트 (미리보기 + 상태)
- [ ] BannerForm 컴포넌트 (모달/시트)
- [ ] BannerUploader 컴포넌트 (S3 직접 업로드)
- [ ] 드래그 앤 드롭 순서 변경 (dnd-kit 또는 유사 라이브러리)
- [ ] 삭제 확인 AlertDialog
- [ ] BannerSlider 공개 사이트용 컴포넌트
- [ ] 반응형 배너 전환 로직 (useMediaQuery 또는 유사)
- [ ] AdminSidebar에 배너 메뉴 추가
- [ ] npm run build 성공
- [ ] npm run lint 통과

## 테스트 계획

- [ ] 배너 등록 폼 유효성 검사
- [ ] 이미지 업로드 동작 확인 (5MB 제한)
- [ ] 드래그 앤 드롭 순서 변경
- [ ] 배너 활성화/비활성화 토글
- [ ] 기간 설정 동작 확인
- [ ] 공개 사이트 배너 표시 확인
- [ ] 반응형 디바이스별 배너 전환
- [ ] 링크 클릭 시 새 탭 열기 확인
- [ ] rel 속성 적용 확인

## 참고 자료

- 기존 설정 페이지 UI 패턴: `app/(app)/admin/[siteId]/settings/page.tsx`
- ThumbnailInput 이미지 업로드: `src/components/post/ThumbnailInput.tsx`
- CategoryList 목록 패턴: `app/(app)/admin/[siteId]/categories/page.tsx`
- React Query 훅 패턴: `src/hooks/usePosts.ts`
- shadcn/ui AlertDialog: `src/components/ui/alert-dialog.tsx`

## 라이브러리 참고 (드래그 앤 드롭)

- `@dnd-kit/core`, `@dnd-kit/sortable` - 권장
- 또는 `react-beautiful-dnd`
- 기존 프로젝트에서 사용 중인 라이브러리가 있다면 그것을 사용
