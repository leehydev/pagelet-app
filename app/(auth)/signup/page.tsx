'use client';

import dayjs from 'dayjs';
import { UserPlus } from 'lucide-react';

import SocialLoginButton from '@/components/auth/signin/SocialLoginButton';

export default function SignUpPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  function signup(provider: string) {
    window.location.href = `${API_BASE_URL}/auth/${provider}`;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      {/* 회원가입 카드 */}
      <div className="flex flex-col items-center justify-center w-full max-w-[340px] bg-white rounded-2xl shadow-lg p-4 sm:p-8">
        {/* 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-slate-600" />
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">회원가입</h1>
        <p className="text-center text-gray-500 mb-8">간편하게 가입하고 서비스를 시작하세요</p>

        {/* 카카오 회원가입 버튼 */}
        <SocialLoginButton
          label="카카오로 시작하기"
          iconSrc="/images/icons/icon-kakao.png"
          iconWidth={22}
          iconHeight={22}
          bgColor="bg-[#FEE500] hover:bg-[#FEE500]"
          textColor="text-[#191919]"
          onClick={() => signup('kakao')}
          className="w-full"
        />

        {/* 안내 문구 */}
        <p className="text-center text-sm text-gray-400 mt-4 px-4">
          카카오 계정으로 빠르게 가입할 수 있어요
        </p>
      </div>

      {/* 푸터 */}
      <p className="mt-8 text-sm text-gray-400">
        © {dayjs().year()} Pagelet. All rights reserved.
      </p>
    </div>
  );
}
