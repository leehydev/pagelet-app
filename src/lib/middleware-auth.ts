/**
 * 프록시(인증)용 설정·헬퍼
 * proxy.ts에서 import하여 사용.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** 백엔드 API 베이스 URL */
export const AUTH_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** 리프레시 토큰 쿠키 이름 (httpOnly, 서버에서만 접근) */
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

/**
 * 전체 공개 경로 (비로그인 허용).
 * - 로그인/회원가입/대기/콜백: 인증 없이 접근
 * - 랜딩, 테넌트 블로그(/t): 공개
 */
export const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/waiting',
  '/auth',
  '/landing',
  '/t',
  '/api',
  '/404',
  '/500',
];

/** 에러 시 리다이렉트 대상 페이지 */
export const ERROR_PAGES = {
  signin: '/signin',
  notFound: '/404',
  serverError: '/500',
} as const;

/**
 * 현재 경로가 공개 경로인지 여부
 */
export function isPublicPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/';
  return PUBLIC_PATHS.some(
    (path) => normalized === path || normalized.startsWith(`${path}/`)
  );
}

/** 로그인 페이지로 리다이렉트 (from 쿼리에 현재 경로 포함) */
export function redirectToSignin(request: NextRequest) {
  const signinUrl = new URL(ERROR_PAGES.signin, request.url);
  signinUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(signinUrl);
}

/** 404/500 등 에러 페이지로 리다이렉트 */
export function redirectToError(
  request: NextRequest,
  path: (typeof ERROR_PAGES)[keyof typeof ERROR_PAGES],
  status?: number
) {
  const url = new URL(path, request.url);
  if (status != null) url.searchParams.set('status', String(status));
  return NextResponse.redirect(url);
}
