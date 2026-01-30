'use client';

/**
 * Banner API
 */

import { api } from './core';
import type {
  ApiResponse,
  Banner,
  CreateBannerRequest,
  UpdateBannerRequest,
  BannerOrderRequest,
} from '../types';

// ===== Admin Banner API =====

export async function createBanner(data: CreateBannerRequest): Promise<Banner> {
  const response = await api.post<ApiResponse<Banner>>('/admin/banners', data);
  return response.data.data;
}

export async function getAdminBanners(): Promise<Banner[]> {
  const response = await api.get<ApiResponse<Banner[]>>('/admin/banners');
  return response.data.data;
}

export async function getAdminBanner(bannerId: string): Promise<Banner> {
  const response = await api.get<ApiResponse<Banner>>(`/admin/banners/${bannerId}`);
  return response.data.data;
}

export async function updateBanner(bannerId: string, data: UpdateBannerRequest): Promise<Banner> {
  const response = await api.put<ApiResponse<Banner>>(`/admin/banners/${bannerId}`, data);
  return response.data.data;
}

export async function deleteBanner(bannerId: string): Promise<void> {
  await api.delete(`/admin/banners/${bannerId}`);
}

export async function updateBannerOrder(data: BannerOrderRequest): Promise<Banner[]> {
  const response = await api.put<ApiResponse<Banner[]>>('/admin/banners/order', data);
  return response.data.data;
}
