'use client';

import { useEffect, useState } from 'react';

/**
 * 클라이언트 마운트 상태를 반환하는 훅
 * 서버/클라이언트 hydration 불일치를 방지하기 위해 사용
 *
 * @returns 클라이언트에서 마운트되었으면 true, 아니면 false
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
