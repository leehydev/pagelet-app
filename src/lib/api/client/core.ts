'use client';

/**
 * 클라이언트 사이드 API - Core
 * axios 인스턴스 + 토큰 리프레시 interceptor
 * 브라우저에서만 사용됨
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getCurrentSiteId } from '@/stores/site-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== 토큰 관리 헬퍼 함수 =====

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// ===== Site ID 헬퍼 함수 =====

/**
 * 현재 siteId를 가져오는 함수
 * 우선순위: 1) Zustand 스토어 → 2) URL 폴백
 */
export function extractSiteIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. 스토어에서 먼저 확인
  const storeId = getCurrentSiteId();
  if (storeId) return storeId;

  // 2. URL 폴백
  const match = window.location.pathname.match(/^\/admin\/([a-f0-9-]{36})\//);
  return match ? match[1] : null;
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
}

// Request interceptor - Authorization 및 X-Site-Id 헤더 추가
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // X-Site-Id 헤더 추가 (Admin API용)
  const siteId = extractSiteIdFromUrl();
  if (siteId) {
    config.headers['X-Site-Id'] = siteId;
  }

  return config;
});

// ===== 토큰 리프레시 로직 (클라이언트 전용) =====
/**
 * 401 에러 발생 시 자동으로 토큰을 갱신하고 원래 요청을 재시도하는 interceptor
 *
 * ## 동작 방식
 * 1. API 요청 → 401 에러 발생
 * 2. /api/auth/refresh 호출 (Next.js API 라우트 → httpOnly 쿠키의 refreshToken 사용)
 * 3. 새 accessToken 발급 → localStorage에 저장
 * 4. 원래 요청 재시도
 *
 * ## 동시 요청 처리
 * 여러 API 요청이 동시에 401을 받을 경우:
 * - 첫 번째 요청만 리프레시 수행 (isRefreshing 플래그)
 * - 나머지 요청은 failedQueue에 대기
 * - 리프레시 완료 후 대기 중인 요청들 일괄 재시도
 *
 * ## 무한 루프 방지
 * - _retry 플래그: 같은 요청의 중복 리프레시 방지
 * - isSessionExpired 플래그: 리프레시 실패 후 추가 시도 차단
 *
 * ## 순환 의존성 방지
 * - auth-utils.ts를 동적 import로 가져옴
 * - client.ts → auth-utils.ts → client.ts 순환 방지
 */

/** 현재 토큰 리프레시 진행 중 여부 */
let isRefreshing = false;

/** 세션 만료 여부 (true면 모든 리프레시 시도 차단) */
let isSessionExpired = false;

/** 리프레시 대기 중인 요청들의 Promise resolve/reject 함수 */
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * 대기 중인 요청들을 일괄 처리
 * @param error null이면 성공 처리, Error면 실패 처리
 */
const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 에러가 아니거나, 이미 재시도한 요청이면 에러 반환
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // 이미 세션 만료 처리 중이면 바로 에러 반환 (무한 루프 방지)
    if (isSessionExpired) {
      return Promise.reject(error);
    }

    // 이미 리프레시 중이면 대기열에 추가하고 리프레시 완료까지 대기
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest)) // 리프레시 성공 시 원래 요청 재시도
        .catch((err) => Promise.reject(err));
    }

    // 이 요청이 리프레시를 담당
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // 토큰 리프레시 시도 (auth-utils.ts의 공통 함수 사용)
      const { refreshToken } = await import('../auth-utils');
      const success = await refreshToken();

      if (!success) {
        throw new Error('토큰 갱신 실패');
      }

      // 대기 중인 요청들에게 성공 알림 → 각자 재시도
      processQueue(null);

      // 원래 요청 재시도 (새 토큰으로)
      const newToken = getAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // 리프레시 실패 → 세션 만료 처리
      isSessionExpired = true;

      // 대기 중인 요청들에게 실패 알림
      processQueue(refreshError as Error);

      // 로그아웃 처리 (토큰 삭제 + 로그인 페이지 이동)
      const { logout } = await import('../auth-utils');
      logout();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
