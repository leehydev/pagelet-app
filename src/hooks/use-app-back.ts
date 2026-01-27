'use client';

import { useRouter } from 'next/navigation';

import { useNavStack } from '@/stores/nav-stack';

/**
 * 앱 내부 네비게이션 스택을 사용한 뒤로가기 훅
 *
 * 현재 네비게이션 스택이 비활성화되어 있어 브라우저 기본 뒤로가기를 사용합니다.
 * 활성화하려면 NavigationTracker를 app/layout.tsx에서 활성화하세요.
 *
 * @param fallbackUrl 스택이 비어있을 때 이동할 기본 URL
 */
export function useAppBack(fallbackUrl: string = '/') {
  const router = useRouter();
  // 네비게이션 스택이 비활성화되어 있어 주석 처리
  // 활성화하려면 아래 주석을 해제하고 router.back() 로직을 제거하세요
  // const pop = useNavStack(s => s.pop);

  return () => {
    // 네비게이션 스택이 비활성화되어 있으면 브라우저 기본 뒤로가기 사용
    // 활성화하려면 아래 주석을 해제하고 router.back()을 제거하세요
    // const prev = pop();
    // if (prev?.url) {
    //   router.push(prev.url);
    // } else {
    //   router.replace(fallbackUrl);
    // }

    // 현재는 브라우저 기본 뒤로가기 사용
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.replace(fallbackUrl);
    }
  };
}
