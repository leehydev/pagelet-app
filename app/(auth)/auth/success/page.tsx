'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';
import { AccountStatus } from '@/lib/api/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { setAccessToken } from '@/lib/api/client';

/**
 * 쿠키에서 값 가져오기
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * 쿠키 삭제
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * 초기화 시 임시 쿠키에서 accessToken을 localStorage로 이동
 * 컴포넌트 마운트 전 동기적으로 실행
 */
function initializeToken(): boolean {
  const tempToken = getCookie('accessToken_temp');
  if (tempToken) {
    setAccessToken(tempToken);
    deleteCookie('accessToken_temp');
    return true;
  }
  return false;
}

export default function AuthSuccessPage() {
  const router = useRouter();
  // 토큰 초기화는 한 번만 실행 (ref로 추적)
  const tokenInitialized = useRef(false);
  const { data: user, isSuccess, error, refetch } = useUser();

  // 임시 쿠키에서 accessToken을 localStorage로 이동
  useEffect(() => {
    if (!tokenInitialized.current) {
      const hadToken = initializeToken();
      tokenInitialized.current = true;

      // 토큰이 있었다면 사용자 정보 다시 조회
      if (hadToken) {
        refetch();
      }
    }
  }, [refetch]);

  useEffect(() => {
    if (isSuccess && user) {
      if (user.accountStatus === AccountStatus.PENDING) {
        router.replace('/waiting');
      } else if (user.accountStatus === AccountStatus.ONBOARDING) {
        router.replace('/onboarding/site');
      } else {
        router.replace('/admin');
      }
    }
  }, [isSuccess, user, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-500">❌ 인증 실패</h1>
          <p className="text-gray-500">다시 로그인해주세요</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <LoadingSpinner fullScreen size="lg" message="로그인 확인 중..." />
  );
}
