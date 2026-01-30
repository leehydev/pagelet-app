'use client';

/**
 * Upload API, Branding Asset API
 */

import { api } from './core';
import type {
  ApiResponse,
  PresignUploadRequest,
  PresignUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  AbortUploadRequest,
  BrandingPresignRequest,
  BrandingPresignResponse,
  BrandingCommitRequest,
  BrandingCommitResponse,
  BrandingDeleteResponse,
  BrandingType,
} from '../types';

// ===== Upload API =====

export async function presignUpload(data: PresignUploadRequest): Promise<PresignUploadResponse> {
  const response = await api.post<ApiResponse<PresignUploadResponse>>(
    '/admin/uploads/presign',
    data,
  );
  return response.data.data;
}

export async function completeUpload(data: CompleteUploadRequest): Promise<CompleteUploadResponse> {
  const response = await api.post<ApiResponse<CompleteUploadResponse>>(
    '/admin/uploads/complete',
    data,
  );
  return response.data.data;
}

export async function abortUpload(data: AbortUploadRequest): Promise<void> {
  await api.post('/admin/uploads/abort', data);
}

// ===== Branding Asset API =====

export async function presignBrandingUpload(
  data: BrandingPresignRequest,
): Promise<BrandingPresignResponse> {
  const response = await api.post<ApiResponse<BrandingPresignResponse>>(
    '/admin/assets/branding/presign',
    data,
  );
  return response.data.data;
}

export async function commitBrandingUpload(
  data: BrandingCommitRequest,
): Promise<BrandingCommitResponse> {
  const response = await api.post<ApiResponse<BrandingCommitResponse>>(
    '/admin/assets/branding/commit',
    data,
  );
  return response.data.data;
}

export async function deleteBrandingAsset(type: BrandingType): Promise<BrandingDeleteResponse> {
  const response = await api.delete<ApiResponse<BrandingDeleteResponse>>(
    `/admin/assets/branding/${type}`,
  );
  return response.data.data;
}
