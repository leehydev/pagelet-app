# [FE] 통계 대시보드

## GitHub 이슈

- **이슈 번호**: #48
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/48
- **생성일**: 2026-01-23
- **우선순위**: 중간
- **관련 태스크**: pagelet-api#43 (의존)

## 개요

관리자 대시보드 페이지에 통계 정보를 표시하는 기능 구현.
기존 "대시보드 준비 중" placeholder를 실제 통계 UI로 교체한다.

## 의존성

- pagelet-api#43 (통계 조회 API) 완료 후 진행

## 작업 범위

### 포함

- 기존 대시보드 placeholder를 실제 통계 UI로 교체
- 개요 카드: 총 조회수, 방문자, 오늘/어제 비교, CTA 클릭
- 게시글별 조회수 테이블
- 일별 추이 차트 (선택사항)

### 제외

- 통계 조회 API (pagelet-api#43)
- 통계 추적 (pagelet-app#47)

## 기술 명세

### 영향받는 파일

- `app/(app)/admin/[siteId]/page.tsx` (기존 교체)
- `src/components/app/dashboard/StatCard.tsx` (신규)
- `src/components/app/dashboard/PostStatsTable.tsx` (신규)
- `src/components/app/dashboard/DailyChart.tsx` (신규, 선택)
- `src/hooks/use-admin-analytics.ts` (신규)

### UI 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                                               │
├─────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│ │ 총 조회수 │ │ 총 방문자 │ │오늘 방문자│ │CTA 클릭수 ││
│ │   1,234   │ │    567    │ │  45 ↑12%  │ │    89     ││
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 게시글별 통계                                       ││
│ ├──────────────────────┬────────┬────────┬───────────┤│
│ │ 제목                 │ 조회수 │ 방문자 │ CTA 클릭  ││
│ ├──────────────────────┼────────┼────────┼───────────┤│
│ │ 블로그 첫 글입니다   │   234  │   123  │    12     ││
│ │ 두 번째 글           │   156  │    89  │     8     ││
│ │ ...                  │   ...  │   ...  │   ...     ││
│ └──────────────────────┴────────┴────────┴───────────┘│
└─────────────────────────────────────────────────────────┘
```

### StatCard 컴포넌트

```tsx
interface StatCardProps {
  title: string;
  value: number | string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {change && (
        <div className={change.isPositive ? 'text-green-500' : 'text-red-500'}>
          {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
        </div>
      )}
    </div>
  );
}
```

### useAdminAnalytics 훅

```typescript
function useAdminAnalytics(siteId: string) {
  const { data: overview, isLoading: overviewLoading } = useSWR(
    `/admin/sites/${siteId}/analytics/overview`,
  );

  const { data: posts, isLoading: postsLoading } = useSWR(`/admin/sites/${siteId}/analytics/posts`);

  const { data: daily, isLoading: dailyLoading } = useSWR(
    `/admin/sites/${siteId}/analytics/daily?days=7`,
  );

  return {
    overview,
    posts,
    daily,
    isLoading: overviewLoading || postsLoading || dailyLoading,
  };
}
```

## 구현 체크리스트

- [ ] useAdminAnalytics 훅 구현
- [ ] StatCard 컴포넌트 구현
- [ ] PostStatsTable 컴포넌트 구현
- [ ] 대시보드 페이지 교체
- [ ] 개요 카드 4개 배치
- [ ] 게시글 통계 테이블 배치
- [ ] 로딩 상태 처리
- [ ] 에러 상태 처리
- [ ] (선택) DailyChart 구현

## 테스트 계획

- [ ] 통계 데이터 로딩 확인
- [ ] 개요 카드 표시 확인
- [ ] 게시글 테이블 표시 확인
- [ ] 오늘/어제 비교 계산 확인
- [ ] 빈 데이터 처리 확인
