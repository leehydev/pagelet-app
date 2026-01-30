'use client';

/**
 * Category API, Public Categories
 */

import { api } from './core';
import type {
  ApiResponse,
  Category,
  PublicCategory,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types';

// ===== Admin Category API =====

export async function getAdminCategories(): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>('/admin/categories');
  return response.data.data;
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await api.post<ApiResponse<Category>>('/admin/categories', data);
  return response.data.data;
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const response = await api.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
  return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/admin/categories/${id}`);
}

// ===== Public Category API (클라이언트) =====

export async function getPublicCategories(siteSlug: string): Promise<PublicCategory[]> {
  const response = await api.get<ApiResponse<PublicCategory[]>>('/public/categories', {
    params: { siteSlug: siteSlug },
  });
  return response.data.data;
}
