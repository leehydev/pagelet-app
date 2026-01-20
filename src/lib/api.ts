import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러 시 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export const AccountStatus = {
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
} as const;

export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  accountStatus: AccountStatus;
  onboardingStep: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// API functions
export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<void> {
  await api.post('/onboarding/profile', data);
}

export interface CreateSiteRequest {
  name: string;
  slug: string;
}

export async function createSite(data: CreateSiteRequest): Promise<void> {
  await api.post('/onboarding/site', data);
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  try {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/sites/check-slug?slug=${encodeURIComponent(slug)}`
    );
    return response.data.data.available;
  } catch {
    return false;
  }
}

export interface CreatePostRequest {
  title: string;
  content: string;
}

export async function createPost(data: CreatePostRequest): Promise<void> {
  await api.post('/posts', data);
}

export async function skipFirstPost(): Promise<void> {
  await api.post('/onboarding/skip-first-post');
}

export async function completeOnboarding(): Promise<void> {
  await api.post('/onboarding/complete');
}
