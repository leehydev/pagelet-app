/**
 * 방문자 ID 관리 유틸리티
 * localStorage를 사용하여 방문자를 식별합니다.
 */

const VISITOR_ID_KEY = 'pagelet_visitor_id';

/**
 * 방문자 ID를 가져오거나 새로 생성합니다.
 * 브라우저 환경에서만 동작하며, SSR 환경에서는 null을 반환합니다.
 */
export function getOrCreateVisitorId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch {
    // localStorage 접근 불가 시 (프라이버시 모드 등) 세션용 임시 ID 생성
    return crypto.randomUUID();
  }
}
