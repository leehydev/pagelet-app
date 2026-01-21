'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';

export default function AuthSuccessPage() {
  const router = useRouter();
  const { data: user, isSuccess, error } = useUser();

  useEffect(() => {
    if (isSuccess && user) {
      router.replace('/admin');
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-2">로그인 확인 중...</h1>
        <p className="text-gray-500">잠시만 기다려주세요</p>
      </div>
    </div>
  );
}
