'use client';

import Link from 'next/link';
import { useNavigationGuardStore } from '@/stores/navigation-guard-store';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

/**
 * 네비게이션 가드가 적용된 Link 컴포넌트
 * 저장되지 않은 변경사항이 있으면 이동을 차단하고 콜백 호출
 */
export function GuardedLink({ href, onClick, children, ...props }: LinkProps) {
  const { hasUnsavedChanges, onNavigationAttempt } = useNavigationGuardStore();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasUnsavedChanges && onNavigationAttempt) {
      e.preventDefault();
      const path = typeof href === 'string' ? href : (href.pathname ?? '');
      onNavigationAttempt(path);
      return;
    }

    onClick?.(e);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
