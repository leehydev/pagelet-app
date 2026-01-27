import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
  getAdminSiteSettingsV2,
  updateAdminSiteSettingsV2,
  revalidateSiteSettings,
  SiteSettings,
  UpdateSiteSettingsRequest,
} from '@/lib/api';

export const siteSettingsKeys = {
  all: ['siteSettings'] as const,
  admin: (siteId: string) => [...siteSettingsKeys.all, 'admin', siteId] as const,
  adminV2: (siteId: string) => [...siteSettingsKeys.all, 'admin', 'v2', siteId] as const,
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
      // ISR 캐시 무효화 (공개 블로그에 즉시 반영)
      revalidateSiteSettings(data.slug);
    },
  });
}

// ===== Admin v2 Hooks (X-Site-Id 헤더 사용) =====

/**
 * Admin 사이트 설정 조회 훅 (v2)
 * @param siteId 캐시 키 용도로만 사용
 */
export function useAdminSiteSettingsV2(siteId: string) {
  return useQuery({
    queryKey: siteSettingsKeys.adminV2(siteId),
    queryFn: () => getAdminSiteSettingsV2(),
    enabled: !!siteId,
  });
}

/**
 * Admin 사이트 설정 수정 훅 (v2)
 */
export function useUpdateAdminSiteSettingsV2(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSiteSettingsRequest) => updateAdminSiteSettingsV2(data),
    onSuccess: (data: SiteSettings) => {
      queryClient.setQueryData(siteSettingsKeys.adminV2(siteId), data);
      queryClient.invalidateQueries({ queryKey: siteSettingsKeys.bySlug(data.slug) });
      revalidateSiteSettings(data.slug);
    },
  });
}
