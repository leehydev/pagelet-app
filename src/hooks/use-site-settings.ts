import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
  revalidateSiteSettings,
  SiteSettings,
  UpdateSiteSettingsRequest,
} from '@/lib/api';

export const siteSettingsKeys = {
  all: ['siteSettings'] as const,
  admin: (siteId: string) => [...siteSettingsKeys.all, 'admin', siteId] as const,
  bySlug: (slug: string) => [...siteSettingsKeys.all, 'slug', slug] as const,
};

/**
 * Admin 사이트 설정 조회 훅
 * siteId는 interceptor가 X-Site-Id 헤더로 자동 주입
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAdminSiteSettings(siteId: string) {
  return useQuery({
    queryKey: siteSettingsKeys.admin(siteId),
    queryFn: () => getAdminSiteSettings(),
    enabled: !!siteId,
  });
}

/**
 * Admin 사이트 설정 수정 훅
 */
export function useUpdateAdminSiteSettings(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSiteSettingsRequest) => updateAdminSiteSettings(data),
    onSuccess: (data: SiteSettings) => {
      queryClient.setQueryData(siteSettingsKeys.admin(siteId), data);
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.bySlug(data.slug) });
      revalidateSiteSettings(data.slug);
    },
  });
}
