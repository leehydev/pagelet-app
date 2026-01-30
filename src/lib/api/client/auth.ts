'use client';

/**
 * Auth & Onboarding API
 */

import { api } from './core';
import type { ApiResponse, User, CreateSiteRequest, CreatePostRequest } from '../types';

// ===== Auth API =====

export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

// ===== Onboarding API =====

export async function createSite(data: CreateSiteRequest): Promise<void> {
  await api.post('/onboarding/site', data);
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/onboarding/check-slug?slug=${encodeURIComponent(slug)}`,
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

export async function createPost(data: CreatePostRequest): Promise<void> {
  await api.post('/posts', data);
}
