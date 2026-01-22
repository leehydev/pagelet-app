/**
 * API 모듈 진입점
 *
 * 사용법:
 * - 클라이언트 컴포넌트: import { api, getMe } from '@/lib/api'
 * - 서버 컴포넌트/ISR: import { fetchPublicPosts } from '@/lib/api/server'
 * - 타입만 필요: import type { User, Post } from '@/lib/api'
 */

// 타입 export
export * from './types';

// 클라이언트 API export (기본)
export * from './client';

// 서버 API는 별도 import 필요: '@/lib/api/server'
