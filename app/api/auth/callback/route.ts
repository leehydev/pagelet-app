import { NextRequest, NextResponse } from 'next/server';

/**
 * OAuth 콜백 처리
 * 백엔드에서 리다이렉트되어 accessToken, refreshToken을 받음
 * - refreshToken: httpOnly 쿠키로 저장 (보안)
 * - accessToken: 임시 쿠키로 저장 (클라이언트에서 localStorage로 이동)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  // 토큰이 없으면 에러 페이지로 리다이렉트
  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL('/signin?error=missing_token', request.url));
  }

  const response = NextResponse.redirect(new URL('/auth/success', request.url));

  // refreshToken: httpOnly 쿠키로 저장 (7일)
  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7일
  });

  // accessToken: 임시 쿠키 (1분, JS 접근 가능)
  // 클라이언트에서 localStorage로 이동 후 삭제됨
  response.cookies.set('accessToken_temp', accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60, // 1분
  });

  return response;
}
