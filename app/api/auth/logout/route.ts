import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * 로그아웃 처리
 * refreshToken 쿠키 삭제
 * 클라이언트에서 localStorage의 accessToken도 삭제해야 함
 */
export async function POST() {
  const cookieStore = await cookies();

  // refreshToken 쿠키 삭제
  cookieStore.delete('refreshToken');

  return NextResponse.json({ success: true });
}
