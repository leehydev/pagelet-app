import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
  SiteSettings,
  UpdateSiteSettingsRequest,
} from '@/lib/api';

export const siteSettingsKeys = {
  all: ['siteSettings'] as const,
  admin: (siteId: string) => [...siteSettingsKeys.all, 'admin', siteId] as const,
  bySlug: (slug: string) => [...siteSettingsKeys.all, 'slug', slug] as const,
};

export function useAdminSiteSettings(siteId: string) {
  return useQuery({
    queryKey: siteSettingsKeys.admin(siteId),
    queryFn: () => getAdminSiteSettings(siteId),
    enabled: !!siteId,
  });
}

export function useUpdateAdminSiteSettings(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSiteSettingsRequest) => updateAdminSiteSettings(siteId, data),
    onSuccess: (data: SiteSettings) => {
      // 캐시 업데이트
      queryClient.setQueryData(siteSettingsKeys.admin(siteId), data);
      // slug별 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.bySlug(data.slug) });
    },
  });
}
