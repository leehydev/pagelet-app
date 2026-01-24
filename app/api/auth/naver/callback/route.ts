import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * 네이버 OAuth 콜백 처리
 * 1. 네이버에서 code를 받음
 * 2. 백엔드에 code + redirect_uri 전달
 * 3. 백엔드에서 JWT 발급받아 쿠키 설정
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.url;

  // 에러 처리
  if (error) {
    console.error('[네이버 OAuth] 인증 실패:', error);
    return NextResponse.redirect(new URL('/signin?error=oauth_failed', appUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/signin?error=missing_code', appUrl));
  }

  try {
    // 백엔드에 code 교환 요청
    const response = await fetch(`${API_BASE_URL}/auth/naver/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[네이버 OAuth] 토큰 교환 실패:', errorData);
      return NextResponse.redirect(new URL('/signin?error=token_exchange_failed', appUrl));
    }

    const result = await response.json();
    const { accessToken, refreshToken } = result.data;

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL('/signin?error=missing_token', appUrl));
    }

    // 쿠키 설정 후 리다이렉트 (auth/success에서 accountStatus 기반 라우팅)
    const redirectResponse = NextResponse.redirect(new URL('/auth/success', appUrl));

    // refreshToken: httpOnly 쿠키로 저장 (7일)
    redirectResponse.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    // accessToken: 임시 쿠키 (클라이언트에서 localStorage로 이동)
    redirectResponse.cookies.set('accessToken_temp', accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60,
    });

    return redirectResponse;
  } catch (err) {
    console.error('[네이버 OAuth] 처리 중 오류:', err);
    return NextResponse.redirect(new URL('/signin?error=server_error', appUrl));
  }
}
