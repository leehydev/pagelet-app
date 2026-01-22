# Lib 디렉토리

유틸리티 및 API 클라이언트

## 구조

```
lib/
├── api/
│   ├── types.ts        # 공유 API 타입
│   ├── client.ts       # CSR API (Axios)
│   ├── server.ts       # SSR/ISR API (Native Fetch)
│   └── index.ts        # 재내보내기
│
├── error-handler.ts    # 중앙집중 에러 처리
├── error-messages.ts   # 에러 코드 → 메시지 매핑
├── date-utils.ts       # dayjs 유틸리티
├── sanitize.ts         # HTML XSS 방지 (dompurify)
├── scroll-to-error.ts  # 폼 에러 스크롤
├── react-query.tsx     # React Query 프로바이더
└── utils.ts            # cn() 클래스 병합
```

## API 모듈

### types.ts
```typescript
// 주요 엔티티
User, Post, SiteSettings, Category, AdminSite

// 게시글 상태
PostStatus = 'DRAFT' | 'PUBLISHED' | 'PRIVATE'

// API 응답 래퍼
ApiResponse<T> = { success: boolean; data: T }
```

### client.ts (CSR)
Axios 기반, 클라이언트 컴포넌트용:
- 401 토큰 갱신 인터셉터
- 자동 재시도 로직

주요 함수:
- `fetchUser()`, `fetchPosts()`, `createPost()`, `updatePost()`, `deletePost()`
- `updatePostStatus()` - 발행/비공개 전환
- `presignUpload()`, `completeUpload()`

### server.ts (SSR/ISR)
Native Fetch 기반, 서버 컴포넌트용:
- ISR 재검증 태그 지원
- X-Site-Slug 헤더 사용

주요 함수:
- `fetchPublicPosts()`, `fetchPublicPostBySlug()`
- `fetchSiteSettings()`, `fetchPublicCategories()`

## 유틸리티

| 파일 | 용도 |
|------|------|
| `error-handler.ts` | API 에러 → 토스트 표시 |
| `error-messages.ts` | 에러 코드 → 한글 메시지 |
| `sanitize.ts` | HTML XSS 방지 |
| `utils.ts` | `cn()` Tailwind 클래스 병합 |

## 이중 API 패턴

- **클라이언트**: React Query + Axios (토큰 자동 갱신)
- **서버**: Native Fetch + ISR 태그 (캐시 관리)
