# [FE] 크로스 도메인 인증 방식 변경

## GitHub 이슈

- **이슈 번호**: #78
- **이슈 링크**: https://github.com/leehydev/pagelet-app/issues/78
- **생성일**: 2026-01-25
- **우선순위**: 높음
- **관련 태스크**: pagelet-api #79

## 개요

백엔드 도메인이 `pagelet-api.kr`로 변경되어 쿠키 공유가 불가능해졌습니다.

**변경 방향:**

- accessToken: localStorage + Authorization 헤더
- refreshToken: 프론트 서버 httpOnly 쿠키 (보안)

## 작업 범위

### 1. 토큰 관리 API Route 구현

#### GET /api/auth/callback

```typescript
// app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  const response = NextResponse.redirect(new URL('/auth/success', request.url));

  // refreshToken: httpOnly 쿠키
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  // accessToken: 임시 쿠키 (1분, JS 접근 가능)
  response.cookies.set('accessToken_temp', accessToken, {
    httpOnly: false,
    maxAge: 60,
  });

  return response;
}
```

#### POST /api/auth/refresh

```typescript
// app/api/auth/refresh/route.ts
export async function POST(request: NextRequest) {
  const refreshToken = cookies().get('refreshToken')?.value;

  const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  const { accessToken } = await res.json();
  return NextResponse.json({ accessToken });
}
```

#### POST /api/auth/logout

```typescript
// app/api/auth/logout/route.ts
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('refreshToken');
  return response;
}
```

### 2. Axios 클라이언트 수정

```typescript
// src/lib/api/client.ts
export const api = axios.create({
  baseURL: API_BASE_URL,
  // withCredentials 제거
});

// Request: localStorage → Authorization 헤더
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: 401 → /api/auth/refresh 호출
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      const { accessToken } = await res.json();
      localStorage.setItem('accessToken', accessToken);
      // 원래 요청 재시도
    }
  },
);
```

### 3. OAuth 콜백 페이지 수정

```typescript
// app/(auth)/auth/success/page.tsx
useEffect(() => {
  const tempToken = getCookie('accessToken_temp');
  if (tempToken) {
    localStorage.setItem('accessToken', tempToken);
    deleteCookie('accessToken_temp');
  }
}, []);
```

## 영향받는 파일

- `app/api/auth/callback/route.ts` (신규)
- `app/api/auth/refresh/route.ts` (신규)
- `app/api/auth/logout/route.ts` (신규)
- `src/lib/api/client.ts`
- `src/lib/react-query.tsx`
- `app/(auth)/auth/success/page.tsx`

## 구현 체크리스트

- [ ] `app/api/auth/callback/route.ts` 생성
- [ ] `app/api/auth/refresh/route.ts` 생성
- [ ] `app/api/auth/logout/route.ts` 생성
- [ ] Axios `withCredentials` 제거
- [ ] Request interceptor 추가 (Authorization 헤더)
- [ ] Response interceptor 수정 (프론트 서버 경유 갱신)
- [ ] OAuth 콜백 페이지에서 localStorage 저장
- [ ] logout 함수 수정
- [ ] 환경 변수 설정 (`BACKEND_URL`)

## 테스트 계획

- [ ] OAuth 로그인 → localStorage에 accessToken 저장 확인
- [ ] API 요청 → Authorization 헤더 포함 확인
- [ ] 토큰 만료 → 자동 갱신 확인
- [ ] 로그아웃 → localStorage + 쿠키 삭제 확인

## 의존성

- pagelet-api #79 완료 후 진행
