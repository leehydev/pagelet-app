import { AxiosError } from 'axios';
import { getErrorMessage } from './error-messages';

/**
 * 백엔드 API 에러 응답 구조
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

/**
 * Axios 에러에서 사용자에게 표시할 메시지를 추출합니다.
 * 백엔드의 ApiErrorDto 구조에 맞춰 에러 코드를 기반으로 한국어 메시지를 반환합니다.
 *
 * @param error AxiosError 또는 일반 Error
 * @param fallbackMessage 에러 코드가 없거나 매핑되지 않은 경우 사용할 기본 메시지
 * @returns 사용자에게 표시할 한국어 에러 메시지
 */
export function getErrorDisplayMessage(error: unknown, fallbackMessage?: string): string {
  // AxiosError인 경우
  if (error instanceof AxiosError) {
    const response = error.response;

    if (response?.data) {
      const data = response.data as ApiErrorResponse;

      // 백엔드 응답 구조: { success: false, error: { code, message, ... } }
      if (data.error?.code) {
        return getErrorMessage(data.error.code, fallbackMessage);
      }

      // 하위 호환성: 기존 message 필드가 있는 경우
      if ('message' in data && typeof (data as { message: string }).message === 'string') {
        return (data as { message: string }).message;
      }
    }

    // HTTP 상태 코드 기반 기본 메시지
    if (response?.status) {
      switch (response.status) {
        case 400:
          return fallbackMessage || '잘못된 요청입니다.';
        case 401:
          return '인증이 필요합니다. 로그인 후 다시 시도해주세요.';
        case 403:
          return '접근 권한이 없습니다.';
        case 404:
          return fallbackMessage || '요청한 리소스를 찾을 수 없습니다.';
        case 409:
          return fallbackMessage || '이미 사용 중인 값입니다.';
        case 500:
          return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        default:
          return fallbackMessage || '오류가 발생했습니다.';
      }
    }
  }

  // 일반 Error인 경우
  if (error instanceof Error) {
    return error.message || fallbackMessage || '오류가 발생했습니다.';
  }

  // 알 수 없는 에러
  return fallbackMessage || '오류가 발생했습니다.';
}

/**
 * AxiosError에서 에러 코드를 추출합니다.
 * @param error AxiosError
 * @returns 에러 코드 또는 undefined
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const response = error.response;
    if (response?.data) {
      const data = response.data as ApiErrorResponse;
      return data.error?.code;
    }
  }
  return undefined;
}
