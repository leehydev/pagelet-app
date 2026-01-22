'use client';

import dayjs from 'dayjs';
import { KeyRound } from 'lucide-react';

import SocialLoginButton from '@/components/auth/signin/SocialLoginButton';

export default function SignInPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  function signin(provider: string) {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      {/* 로그인 카드 */}
      <div className="flex flex-col items-center justify-center w-full max-w-[340px] bg-white rounded-2xl shadow-lg p-4 sm:p-8">
        {/* 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-slate-600" />
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">환영합니다</h1>
        <p className="text-center text-gray-500 mb-8">간편하게 로그인하고 서비스를 이용하세요</p>

        {/* 카카오 로그인 버튼 */}
        <SocialLoginButton
          label="카카오로 계속하기"
          iconSrc="/images/icons/icon-kakao.png"
          iconWidth={22}
          iconHeight={22}
          bgColor="bg-[#FEE500] hover:bg-[#FEE500]"
          textColor="text-[#191919]"
          onClick={() => signin('kakao')}
          className="w-full"
        />

        {/* 안내 문구 */}
        <p className="text-center text-xs text-gray-400 mt-4 px-4">
          비밀번호 없이 카카오로 쉽고 빠르게 로그인하세요
        </p>
      </div>

      {/* 푸터 */}
      <p className="mt-8 text-sm text-gray-400">
        © {dayjs().year()} Pagelet. All rights reserved.
      </p>
    </div>
  );
}
