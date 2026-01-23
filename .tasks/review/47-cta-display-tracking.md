# [FE] CTA 버튼 표시 및 추적

## GitHub 이슈
- **이슈 번호**: #47
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/47
- **생성일**: 2026-01-23
- **우선순위**: 높음
- **관련 태스크**: pagelet-api#41 (의존), pagelet-api#42 (의존)

## 개요

블로그 페이지에 CTA 버튼을 표시하고, 페이지 조회와 CTA 클릭을 추적하는 기능 구현.
푸터 위에 고정 표시되며, 클릭 시 추적 API 호출 후 링크로 이동한다.

## 의존성

- pagelet-api#41 (CTA 설정 API)
- pagelet-api#42 (통계 추적 API)

## 작업 범위

### 포함
- PublicLayout에 CtaBanner 컴포넌트 추가
- 푸터 위 고정 위치 (sticky bottom)
- 페이지 로드 시 pageview 추적
- CTA 클릭 시 click 추적 후 링크 이동
- visitorId 관리 (localStorage)

### 제외
- CTA 설정 UI (pagelet-app#46)
- 백엔드 API (pagelet-api#41, #42)

## 기술 명세

### 영향받는 파일
- `app/(public)/layout.tsx`
- `src/components/public/CtaBanner.tsx` (신규)
- `src/hooks/use-analytics.ts` (신규)
- `src/lib/visitor.ts` (신규 - visitorId 관리)

### 레이아웃 구조

```tsx
// app/(public)/layout.tsx
export default function PublicLayout({ children }) {
  return (
    <>
      {children}
      <CtaBanner />
      <Footer />
    </>
  );
}
```

### CtaBanner 컴포넌트

```tsx
interface CtaBannerProps {
  siteSettings: SiteSettings;
}

function CtaBanner({ siteSettings }: CtaBannerProps) {
  const { trackCtaClick } = useAnalytics();

  if (!siteSettings.ctaEnabled) return null;

  const handleClick = async () => {
    await trackCtaClick();
    window.open(siteSettings.ctaLink, '_blank');
  };

  return (
    <div className="sticky bottom-0 w-full bg-primary p-4">
      {siteSettings.ctaType === 'text' ? (
        <button onClick={handleClick}>
          {siteSettings.ctaText}
        </button>
      ) : (
        <button onClick={handleClick}>
          <img src={siteSettings.ctaImageUrl} alt="CTA" />
        </button>
      )}
    </div>
  );
}
```

### useAnalytics 훅

```typescript
function useAnalytics(siteId: string, postId?: string) {
  const visitorId = getOrCreateVisitorId();

  const trackPageview = useCallback(async () => {
    await fetch('/api/analytics/pageview', {
      method: 'POST',
      body: JSON.stringify({ siteId, postId, visitorId }),
    });
  }, [siteId, postId, visitorId]);

  const trackCtaClick = useCallback(async () => {
    await fetch('/api/analytics/cta-click', {
      method: 'POST',
      body: JSON.stringify({ siteId, postId, visitorId }),
    });
  }, [siteId, postId, visitorId]);

  // 페이지 로드 시 자동 추적
  useEffect(() => {
    trackPageview();
  }, [trackPageview]);

  return { trackPageview, trackCtaClick };
}
```

### visitorId 관리

```typescript
// src/lib/visitor.ts
const VISITOR_ID_KEY = 'pagelet_visitor_id';

export function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}
```

## 구현 체크리스트
- [ ] visitor.ts - visitorId 관리 유틸
- [ ] useAnalytics 훅 구현
- [ ] CtaBanner 컴포넌트 구현
- [ ] 텍스트 버튼 스타일
- [ ] 이미지 버튼 스타일
- [ ] PublicLayout에 CtaBanner 추가
- [ ] 페이지뷰 자동 추적
- [ ] CTA 클릭 추적

## 테스트 계획
- [ ] CTA 버튼 표시 확인
- [ ] 비활성화 시 숨김 확인
- [ ] 페이지 로드 시 pageview API 호출 확인
- [ ] CTA 클릭 시 click API 호출 확인
- [ ] 클릭 후 링크 이동 확인
- [ ] visitorId 유지 확인
