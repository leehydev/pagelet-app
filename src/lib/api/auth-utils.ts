'use client';

/**
 * 인증 관련 공통 유틸리티
 *
 * ## 사용처
 * - use-user.ts: 앱 초기화 시 토큰 없으면 리프레시 시도
 * - client.ts: API 요청 중 401 에러 시 자동 리프레시
 *
 * ## 토큰 저장 위치
 * - accessToken: localStorage (JavaScript에서 접근 가능)
 * - refreshToken: httpOnly 쿠키 (JavaScript에서 접근 불가, 보안상 안전)
 *
 * ## 리프레시 플로우
 * 1. /api/auth/refresh (Next.js API 라우트) 호출
 * 2. 서버에서 httpOnly 쿠키의 refreshToken 읽음
 * 3. 백엔드 /auth/refresh에 refreshToken 전달
 * 4. 새 accessToken 발급 → 클라이언트에 반환
 * 5. localStorage에 새 accessToken 저장
 */

import { getAccessToken, setAccessToken, removeAccessToken } from './client';

/**
 * 리프레시 토큰으로 새 액세스 토큰 발급 시도
 *
 * Next.js API 라우트(/api/auth/refresh)를 통해 리프레시 수행.
 * refreshToken은 httpOnly 쿠키에 저장되어 있어 서버에서만 접근 가능.
 *
 * @returns 성공 시 true, 실패 시 false
 *
 * @example
 * const success = await refreshToken();
 * if (success) {
 *   // 새 토큰으로 계속 진행
 * } else {
 *   // 로그아웃 처리
 *   logout();
 * }
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    const data = await res.json();

    if (res.ok && data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 로그아웃 처리
 *
 * 1. localStorage에서 accessToken 삭제
 * 2. 로그인 페이지로 리다이렉트 (이미 로그인 페이지면 생략)
 *
 * 참고: refreshToken(httpOnly 쿠키)은 /api/auth/logout 호출 시 삭제됨.
 * 이 함수는 클라이언트 측 정리만 담당.
 */
export function logout(): void {
  removeAccessToken();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/signin')) {
    window.location.href = '/signin';
  }
}

/**
 * 액세스 토큰 존재 여부 확인
 *
 * 토큰의 유효성(만료 여부)은 검사하지 않음.
 * 실제 유효성은 API 요청 시 백엔드에서 검증.
 *
 * @returns localStorage에 accessToken이 있으면 true
 */
export function hasAccessToken(): boolean {
  return !!getAccessToken();
}
