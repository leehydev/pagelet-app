'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /admin 인덱스 페이지
 * /admin/dashboard로 리다이렉트
 */
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return null;
}
