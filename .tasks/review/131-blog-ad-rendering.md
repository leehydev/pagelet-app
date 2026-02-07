# [FE] 블로그 광고 렌더링

## GitHub 이슈

- **이슈 번호**: #131
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/131
- **우선순위**: 중간
- **백엔드 의존성**: draft-blog-ad-settings-api (BE 광고 설정 API)

## 개요

블로그 설정의 광고 필드(adProvider, adMobileHeader, adPcSidebar)를 기반으로 Google AdSense 또는 Kakao AdFit 광고를 렌더링하는 기능 구현.

## 작업 범위

### 포함

- SiteSettings 타입에 광고 필드 추가
- 광고 컴포넌트 생성 (AdSense/AdFit 분기)
- 모바일 헤더 아래 광고 영역 (md 이하)
- PC 사이드바 광고 영역 (md 이상, sticky)
- 광고 스크립트 로드 처리

### 제외

- 광고 노출/클릭 추적
- 어드민에서 광고 설정 UI (별도 이슈)

## 기술 명세

### 영향받는 파일

- `src/lib/api/types.ts` - SiteSettings 타입
- `src/components/public/ad/` - 광고 컴포넌트 (신규)
- `src/components/public/layout/Header.tsx` - 모바일 광고 영역
- `app/(public)/t/[slug]/layout.tsx` - PC 사이드바 광고 영역

### 사용할 API

| Method | Endpoint                   | 설명                       |
| ------ | -------------------------- | -------------------------- |
| GET    | /public/site-settings      | 퍼블릭 사이트 설정 (광고 포함) |

### 타입 정의

```typescript
// src/lib/api/types.ts에 추가
export type AdProvider = 'adsense' | 'adfit';

export interface SiteSettings {
  // ... 기존 필드

  // 광고 설정
  adProvider: AdProvider | null;
  adMobileHeader: string | null;  // 광고 단위 ID
  adPcSidebar: string | null;     // 광고 단위 ID
}
```

### 컴포넌트 설계

#### 1. AdScript 컴포넌트

광고 스크립트를 head에 한 번만 로드.

```typescript
// src/components/public/ad/AdScript.tsx
interface AdScriptProps {
  provider: AdProvider;
  publisherId?: string;  // AdSense의 경우 ca-pub-xxx
}
```

- AdSense: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`
- AdFit: `https://t1.daumcdn.net/kas/static/ba.min.js`

#### 2. AdUnit 컴포넌트

개별 광고 단위 렌더링.

```typescript
// src/components/public/ad/AdUnit.tsx
interface AdUnitProps {
  provider: AdProvider;
  slotId: string;
  format: 'mobile-banner' | 'sidebar';
  className?: string;
}
```

**AdSense 마크업:**
```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-xxx"
     data-ad-slot="1234567890"
     data-ad-format="auto">
</ins>
```

**AdFit 마크업:**
```html
<ins class="kakao_ad_area"
     style="display:none"
     data-ad-unit="DAN-xxx"
     data-ad-width="320"
     data-ad-height="100">
</ins>
```

#### 3. MobileHeaderAd 컴포넌트

모바일 헤더 아래 광고 영역.

```typescript
// src/components/public/ad/MobileHeaderAd.tsx
interface MobileHeaderAdProps {
  provider: AdProvider;
  slotId: string;
}

// 조건: md 이하에서만 노출 (class="md:hidden")
// 위치: 헤더 바로 아래
```

#### 4. SidebarAd 컴포넌트

PC 사이드바 광고 영역.

```typescript
// src/components/public/ad/SidebarAd.tsx
interface SidebarAdProps {
  provider: AdProvider;
  slotId: string;
}

// 조건: md 이상에서만 노출 (class="hidden md:block")
// 크기: 160x600
// 스타일: position: sticky, top: 24px
```

### 레이아웃 수정

#### 현재 레이아웃 (layout.tsx)
```
Header
└── children (메인 콘텐츠)
Footer
```

#### 수정 후 레이아웃
```
Header
├── MobileHeaderAd (md 이하)
└── flex container
    ├── main (메인 콘텐츠)
    └── aside (md 이상)
        └── SidebarAd (sticky)
Footer
```

### 반응형 처리

| 영역 | 모바일 (< md) | PC (>= md) |
| ---- | ------------- | ---------- |
| MobileHeaderAd | 노출 | 숨김 |
| SidebarAd | 숨김 | 노출 (sticky) |

## UI/UX 요구사항

- 광고가 없으면 해당 영역 미노출 (레이아웃 영향 없음)
- 광고 로딩 중 레이아웃 시프트 방지 (min-height 지정)
- 사이드바 광고는 스크롤 시 화면에 고정 (sticky)
- 사이드바 폭: 160px 고정

## 구현 체크리스트

- [x] SiteSettings 타입에 광고 필드 추가 (adProvider, adMobileHeader, adPcSidebar)
- [x] AdScript 컴포넌트 구현 (스크립트 로드)
- [x] AdUnit 컴포넌트 구현 (AdSense/AdFit 분기)
- [x] MobileHeaderAd 컴포넌트 구현
- [x] SidebarAd 컴포넌트 구현
- [x] layout.tsx에 MobileHeaderAd 통합 (헤더 아래)
- [x] layout.tsx에 SidebarAd 통합 (flex 레이아웃 수정)
- [x] 광고 없을 때 레이아웃 정상 동작 확인 (빌드 통과)

## 테스트 계획

- [ ] adProvider=null 일 때 광고 미노출 확인
- [ ] adProvider=adsense 일 때 AdSense 스크립트 로드 확인
- [ ] adProvider=adfit 일 때 AdFit 스크립트 로드 확인
- [ ] 모바일에서 MobileHeaderAd만 노출 확인
- [ ] PC에서 SidebarAd만 노출 확인
- [ ] SidebarAd sticky 동작 확인
- [ ] 광고 단위 ID가 null일 때 해당 영역 미노출 확인

## 참고 자료

- 백엔드 태스크: `pagelet-api/.tasks/backlog/draft-blog-ad-settings-api.md`
- [Google AdSense 광고 코드](https://support.google.com/adsense/answer/9274516)
- [Kakao AdFit 광고 코드](https://adfit.kakao.com/)
- 퍼블릭 레이아웃: `app/(public)/t/[slug]/layout.tsx`
- 헤더 컴포넌트: `src/components/public/layout/Header.tsx`
