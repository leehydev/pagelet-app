'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

import { useNavStack } from '@/stores/nav-stack';

/**
 * 네비게이션 스택 추적 컴포넌트
 * 
 * 현재 비활성화 상태입니다.
 * 활성화하려면 app/layout.tsx에서 주석을 해제하세요.
 * 
 * 사용 사례:
 * - 복잡한 마법사 플로우에서 뒤로가기 지원
 * - 깊은 중첩 네비게이션 관리
 * - 모달/드로어 기반 네비게이션
 */
export default function NavigationTracker() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const currentUrl = useMemo(() => {
    const q = sp?.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, sp]);

  const prevRef = useRef<string | null>(null);
  const pushIfNeeded = useNavStack(s => s.pushIfNeeded);

  useEffect(() => {
    // 비활성화: 주석 처리
    // pushIfNeeded(currentUrl, prevRef.current);
    prevRef.current = currentUrl;
  }, [currentUrl, pushIfNeeded]);

  return null;
}
