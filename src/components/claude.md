# Components 디렉토리

React 컴포넌트 모음

## 디렉토리 구조

```
components/
├── ui/                 # shadcn/ui 기본 컴포넌트
├── layout/             # 레이아웃 컴포넌트
├── editor/             # Tiptap 리치 텍스트 에디터
├── post/               # 게시글 표시 컴포넌트
├── public/             # 공개 블로그 페이지용
├── settings/           # 사이트 설정 폼
├── form/               # 폼 입력 컴포넌트
├── signin/             # 로그인 페이지용
├── onboarding/         # 온보딩 플로우용
├── modal/              # 모달/다이얼로그
└── common/             # 공통 유틸리티
```

## 주요 컴포넌트

### UI (`ui/`)

shadcn/ui 기반 프리미티브:

- `button`, `input`, `textarea`, `select`, `label`
- `sidebar`, `sidebar-static` - 사이드바
- `alert-dialog` - 확인 다이얼로그
- `skeleton` - 로딩 스켈레톤
- `badge`, `tooltip`, `separator`

### Layout (`layout/`)

- `AdminPageHeader` - 관리자 페이지 헤더 + 브레드크럼
- `AdminSidebar` - 왼쪽 사이드바 네비게이션
- `SiteSwitcher` - 사이트 선택 드롭다운
- `AuthHeader` - 인증 페이지 헤더

### Editor (`editor/`)

Tiptap 리치 텍스트 에디터:

- `TiptapEditor` - 메인 에디터
- `MenuBar` - 에디터 툴바
- `extensions/` - 커스텀 확장 (ResizableImage 등)
- `menu/media/` - 이미지/비디오 삽입

### Post (`post/`)

- `PostContent` - HTML 콘텐츠 렌더링 (sanitize 적용)
- `Thumbnail` - 게시글 썸네일
- `ThumbnailInput` - 썸네일 업로드

### Public (`public/`)

- `PostCard` - 게시글 미리보기 카드
- `CategoryTabs` - 카테고리 네비게이션
- `SocialLinks`, `BusinessInfo`, `ContactInfo`

### Form (`form/`)

- `ValidationInput` - 에러 표시 포함 입력
- `ValidationTextarea` - 에러 표시 포함 텍스트영역

## 네이밍 규칙

- PascalCase 파일명: `PostContent.tsx`
- 기능별 하위 디렉토리 그룹화
