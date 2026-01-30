'use client';

/**
 * Site Settings API
 */

import { api } from './core';
import type { ApiResponse, SiteSettings, UpdateSiteSettingsRequest } from '../types';

// ===== Site Settings API (Admin) =====

export async function getAdminSiteSettings(): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>('/admin/settings');
  return response.data.data;
}

export async function updateAdminSiteSettings(
  data: UpdateSiteSettingsRequest,
): Promise<SiteSettings> {
  const response = await api.put<ApiResponse<SiteSettings>>('/admin/settings', data);
  return response.data.data;
}

export async function getSiteSettingsBySlug(slug: string): Promise<SiteSettings> {
  const response = await api.get<ApiResponse<SiteSettings>>(
    `/sites/${encodeURIComponent(slug)}/settings`,
  );
  return response.data.data;
}
