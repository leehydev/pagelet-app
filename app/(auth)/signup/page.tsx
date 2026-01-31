'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';

import SocialLoginButton from '@/components/auth/signin/SocialLoginButton';
import { getOAuthAuthorizeUrl, OAuthProvider } from '@/lib/oauth';
import { useUser } from '@/hooks/use-user';
import { useMounted } from '@/hooks/use-mounted';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AccountStatus } from '@/lib/api/types';

const CURRENT_YEAR = new Date().getFullYear();

export default function SignUpPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const mounted = useMounted();

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.accountStatus === AccountStatus.PENDING) {
      router.replace('/waiting');
    } else if (user.accountStatus === AccountStatus.ONBOARDING) {
      router.replace('/onboarding/site');
    } else {
      router.replace('/admin');
    }
  }, [user, isLoading, router]);

  function signup(provider: OAuthProvider) {
    window.location.href = getOAuthAuthorizeUrl(provider);
  }

  // 서버/클라이언트 hydration 일치를 위해 마운트 전까지 로딩 표시
  if (!mounted || isLoading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  // 이미 로그인된 경우 리다이렉트 대기
  if (user) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      {/* 회원가입 카드 */}
      <div className="flex flex-col items-center justify-center w-full max-w-85 bg-white rounded-2xl shadow-lg p-4 sm:p-8">
        {/* 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-7 h-7 text-slate-600" />
          </div>
        </div>

        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">회원가입</h1>
        <p className="text-center text-gray-500 mb-8">간편하게 가입하고 서비스를 시작하세요</p>

        <div className="w-full flex flex-col gap-2">
          {/* 카카오 로그인 버튼 */}
          <SocialLoginButton
            label="카카오로 계속하기"
            iconSrc="/images/icons/icon-kakao.png"
            iconWidth={22}
            iconHeight={22}
            bgColor="bg-[#FEE500] hover:bg-[#FEE500]"
            textColor="text-[#191919]"
            onClick={() => signup('kakao')}
            className="w-full"
          />

          {/* 네이버 로그인 버튼 */}
          <SocialLoginButton
            label="네이버로 계속하기"
            iconSrc="/images/icons/icon-naver.png"
            iconWidth={22}
            iconHeight={22}
            bgColor="bg-[#03C75A] hover:bg-[#03C75A]"
            textColor="text-white"
            onClick={() => signup('naver')}
            className="w-full"
          />
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-xs text-gray-400 mt-4 px-4">
          비밀번호 없이 쉽고 빠르게 가입하세요
        </p>
      </div>

      {/* 푸터 */}
      <p className="mt-8 text-sm text-gray-400">© {CURRENT_YEAR} Pagelet. All rights reserved.</p>
    </div>
  );
}
