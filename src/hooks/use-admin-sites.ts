'use client';

import { useQuery } from '@tanstack/react-query';
import { getAdminSites, AdminSite } from '@/lib/api';

/**
 * 현재 사용자의 어드민 사이트 목록을 조회하는 hook
 */
export function useAdminSites() {
  return useQuery<AdminSite[]>({
    queryKey: ['admin', 'sites'],
    queryFn: getAdminSites,
    staleTime: 5 * 60 * 1000, // 5분 - 사이트 목록은 자주 바뀌지 않음
  });
}
