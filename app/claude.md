# App 디렉토리

Next.js App Router 기반 페이지 및 라우팅

## 라우트 그룹 구조

```
app/
├── layout.tsx              # 루트 레이아웃 (프로바이더 포함)
├── globals.css             # 전역 스타일
├── providers/              # 전역 프로바이더
│   ├── root-providers.tsx  # React Query, Theme, Toaster, Modal
│   └── theme-provider.tsx  # next-themes 다크모드
│
├── (auth)/                 # 인증 라우트 그룹
│   ├── signin/             # 로그인 페이지
│   ├── signup/             # 회원가입 페이지
│   ├── onboarding/         # 멀티스텝 온보딩
│   └── auth/success/       # OAuth 리다이렉트 핸들러
│
├── (app)/                  # 보호된 라우트 (관리자 대시보드)
│   └── admin/
│       ├── page.tsx        # 사이트 선택 페이지
│       └── [siteId]/       # 사이트별 관리 페이지
│           ├── posts/      # 게시글 CRUD
│           ├── categories/ # 카테고리 관리
│           └── settings/   # 사이트 설정
│
└── (public)/               # 공개 블로그 (ISR 적용)
    └── t/[slug]/           # 테넌트별 블로그
        ├── posts/          # 게시글 목록/상세
        └── category/       # 카테고리별 게시글
```

## 라우트 그룹 설명

| 그룹       | URL 포함 | 용도                  |
| ---------- | -------- | --------------------- |
| `(auth)`   | X        | 인증 페이지 그룹화    |
| `(app)`    | X        | 보호된 관리자 페이지  |
| `(public)` | X        | 공개 블로그, ISR 캐싱 |

## ISR 전략

공개 페이지는 `revalidate: 60` + 온디맨드 태그 재검증:

- `posts-{siteSlug}` - 사이트 전체 게시글
- `posts-{siteSlug}-{categorySlug}` - 카테고리별

## 파일 컨벤션

- `page.tsx` - 라우트 페이지
- `layout.tsx` - 공유 레이아웃
- `[param]/` - 동적 라우트
- `(group)/` - URL에 미포함 그룹
