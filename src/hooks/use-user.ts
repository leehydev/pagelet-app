'use client';

import { useQuery } from '@tanstack/react-query';
import { getMe, type User } from '@/lib/api';

export function useUser() {
  return useQuery<User>({
    queryKey: ['user', 'me'],
    queryFn: getMe,
    retry: false,
    staleTime: 30 * 1000, // 30초
  });
}
