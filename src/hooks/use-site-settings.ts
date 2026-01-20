import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMySiteSettings,
  updateMySiteSettings,
  SiteSettings,
  UpdateSiteSettingsRequest,
} from '@/lib/api';

export const siteSettingsKeys = {
  all: ['siteSettings'] as const,
  my: () => [...siteSettingsKeys.all, 'my'] as const,
  bySlug: (slug: string) => [...siteSettingsKeys.all, 'slug', slug] as const,
};

export function useMySiteSettings() {
  return useQuery({
    queryKey: siteSettingsKeys.my(),
    queryFn: getMySiteSettings,
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSiteSettingsRequest) => updateMySiteSettings(data),
    onSuccess: (data: SiteSettings) => {
      // 캐시 업데이트
      queryClient.setQueryData(siteSettingsKeys.my(), data);
      // slug별 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.bySlug(data.slug) });
    },
  });
}
