/**
 * 백엔드 에러 코드별 한국어 메시지 매핑
 * 백엔드의 ErrorCode와 일치하도록 관리
 */

export const ErrorMessages: Record<string, string> = {
  // 공통 에러
  COMMON_001: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  COMMON_002: '입력값이 올바르지 않습니다. 다시 확인해주세요.',
  COMMON_003: '인증이 필요합니다. 로그인 후 다시 시도해주세요.',
  COMMON_004: '접근 권한이 없습니다.',
  COMMON_005: '요청한 리소스를 찾을 수 없습니다.',
  COMMON_006: '잘못된 요청입니다.',

  // 사용자 관련 에러
  USER_001: '사용자를 찾을 수 없습니다.',
  USER_002: '이미 존재하는 사용자입니다.',
  USER_003: '이메일 또는 비밀번호가 올바르지 않습니다.',

  // OAuth 관련 에러
  OAUTH_001: '인증 코드가 올바르지 않습니다.',
  OAUTH_002: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
  OAUTH_003: '사용자 정보를 가져오는데 실패했습니다.',
  OAUTH_004: 'OAuth 제공자 오류가 발생했습니다.',
  OAUTH_005: 'OAuth 권한이 부족합니다.',

  // 온보딩 관련 에러
  ONBOARDING_001: '온보딩을 진행할 수 없습니다.',
  ONBOARDING_002: '잘못된 온보딩 단계입니다.',

  // 사이트 관련 에러
  SITE_001: '이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.',
  SITE_002: '사이트를 찾을 수 없습니다.',

  // 게시글 관련 에러
  POST_001: '게시글을 찾을 수 없습니다.',
  POST_002: '이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.',
  POST_003: '이 게시글에 접근할 수 있는 권한이 없습니다.',

  // Storage 관련 에러
  STORAGE_001: '저장 공간이 부족합니다. 파일을 삭제하거나 용량을 확인해주세요.',
  STORAGE_002: '저장 공간 예약에 실패했습니다.',
  STORAGE_003: '업로드 요청이 올바르지 않습니다.',
  STORAGE_004: '업로드 파일을 찾을 수 없습니다.',

  // 카테고리 관련 에러
  CATEGORY_001: '카테고리를 찾을 수 없습니다.',
  CATEGORY_002: '이미 사용 중인 slug입니다. 다른 slug를 입력해주세요.',
  CATEGORY_003: '예약된 slug입니다. 다른 slug를 사용해주세요.',
  CATEGORY_004: '게시글이 있는 카테고리는 삭제할 수 없습니다.',

  // 계정 관련 에러
  ACCOUNT_003: '계정이 승인 대기 중입니다. 관리자 승인 후 서비스를 이용할 수 있습니다.',

  // 브랜딩 에셋 관련 에러
  BRANDING_001: '브랜딩 이미지를 찾을 수 없습니다.',
  BRANDING_002: '브랜딩 이미지 삭제에 실패했습니다.',
  BRANDING_003: '지원하지 않는 브랜딩 유형입니다.',
};

/**
 * 에러 코드로부터 한국어 메시지를 가져옵니다.
 * @param errorCode 에러 코드 (예: 'COMMON_001', 'CATEGORY_002')
 * @param fallbackMessage 에러 코드가 매핑되지 않은 경우 사용할 기본 메시지
 * @returns 한국어 에러 메시지
 */
export function getErrorMessage(errorCode: string | undefined, fallbackMessage?: string): string {
  if (!errorCode) {
    return fallbackMessage || '오류가 발생했습니다.';
  }

  return ErrorMessages[errorCode] || fallbackMessage || '오류가 발생했습니다.';
}
