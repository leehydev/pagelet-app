import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

/**
 * 토큰 갱신 처리
 * httpOnly 쿠키에 저장된 refreshToken을 사용하여 새 accessToken 발급
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_REFRESH_TOKEN', message: '로그인이 필요합니다.' } },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      // refreshToken이 만료되었거나 유효하지 않음
      const response = NextResponse.json(
        { success: false, error: { code: 'REFRESH_FAILED', message: '세션이 만료되었습니다.' } },
        { status: 401 },
      );
      // refreshToken 쿠키 삭제
      response.cookies.delete('refreshToken');
      return response;
    }

    const data: RefreshResponse = await res.json();
    return NextResponse.json({ success: true, accessToken: data.data.accessToken });
  } catch (error) {
    console.error('Token refresh failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'REFRESH_ERROR', message: '토큰 갱신에 실패했습니다.' } },
      { status: 500 },
    );
  }
}
