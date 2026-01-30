'use client';

/**
 * Analytics API, Admin Sites
 */

import { api } from './core';
import type {
  ApiResponse,
  AdminSite,
  AnalyticsOverview,
  PostAnalytics,
  DailyAnalytics,
} from '../types';

// ===== Admin Analytics API =====

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await api.get<ApiResponse<AnalyticsOverview>>('/admin/analytics/overview');
  return response.data.data;
}

export async function getPostsAnalytics(): Promise<PostAnalytics[]> {
  const response = await api.get<ApiResponse<PostAnalytics[]>>('/admin/analytics/posts');
  return response.data.data;
}

export async function getDailyAnalytics(days: number = 7): Promise<DailyAnalytics[]> {
  const response = await api.get<ApiResponse<DailyAnalytics[]>>('/admin/analytics/daily', {
    params: { days },
  });
  return response.data.data;
}

// ===== Admin Site API =====

export async function getAdminSites(): Promise<AdminSite[]> {
  const response = await api.get<ApiResponse<AdminSite[]>>('/admin/sites');
  return response.data.data;
}
