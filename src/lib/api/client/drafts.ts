'use client';

/**
 * Draft API, Independent Draft API
 */

import axios from 'axios';
import { api } from './core';
import type {
  ApiResponse,
  Post,
  PostDraft,
  SaveDraftRequest,
  Draft,
  DraftListItem,
  CreateDraftRequest,
  UpdateDraftRequest,
} from '../types';

// ===== Admin Draft API =====

export async function getDraft(postId: string): Promise<PostDraft | null> {
  try {
    const response = await api.get<ApiResponse<PostDraft>>(`/admin/posts/${postId}/draft`);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function saveDraft(postId: string, data: SaveDraftRequest): Promise<PostDraft> {
  const response = await api.put<ApiResponse<PostDraft>>(`/admin/posts/${postId}/draft`, data);
  return response.data.data;
}

export async function deleteDraft(postId: string): Promise<void> {
  await api.delete(`/admin/posts/${postId}/draft`);
}

export async function publishPost(postId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(`/admin/posts/${postId}/publish`);
  return response.data.data;
}

export async function republishPost(postId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(`/admin/posts/${postId}/republish`);
  return response.data.data;
}

export async function unpublishPost(postId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(`/admin/posts/${postId}/unpublish`);
  return response.data.data;
}

// ===== Independent Draft API =====

export async function getDrafts(): Promise<DraftListItem[]> {
  const response = await api.get<ApiResponse<DraftListItem[]>>('/admin/drafts');
  return response.data.data;
}

export async function createDraft(data: CreateDraftRequest): Promise<Draft> {
  const response = await api.post<ApiResponse<Draft>>('/admin/drafts', data);
  return response.data.data;
}

export async function getDraftById(draftId: string): Promise<Draft> {
  const response = await api.get<ApiResponse<Draft>>(`/admin/drafts/${draftId}`);
  return response.data.data;
}

export async function updateDraft(draftId: string, data: UpdateDraftRequest): Promise<Draft> {
  const response = await api.put<ApiResponse<Draft>>(`/admin/drafts/${draftId}`, data);
  return response.data.data;
}

export async function deleteDraftById(draftId: string): Promise<void> {
  await api.delete(`/admin/drafts/${draftId}`);
}

export async function publishDraft(draftId: string): Promise<Post> {
  const response = await api.post<ApiResponse<Post>>(`/admin/drafts/${draftId}/publish`);
  return response.data.data;
}
