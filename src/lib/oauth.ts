/**
 * OAuth 인증 URL 생성 유틸리티
 * 프론트엔드에서 직접 OAuth provider로 리다이렉트
 */

export type OAuthProvider = 'kakao' | 'naver';

interface OAuthConfig {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scope?: string;
}

function getOAuthConfig(provider: OAuthProvider): OAuthConfig {
  // 환경변수 우선, 없으면 현재 origin 사용
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const configs: Record<OAuthProvider, OAuthConfig> = {
    kakao: {
      authorizeUrl: 'https://kauth.kakao.com/oauth/authorize',
      clientId: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '',
      redirectUri: `${baseUrl}/api/auth/kakao/callback`,
    },
    naver: {
      authorizeUrl: 'https://nid.naver.com/oauth2.0/authorize',
      clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || '',
      redirectUri: `${baseUrl}/api/auth/naver/callback`,
    },
  };

  return configs[provider];
}

/**
 * OAuth 인증 URL 생성
 * state 파라미터에 returnUrl 등 추가 정보 포함 가능
 */
export function getOAuthAuthorizeUrl(provider: OAuthProvider, returnUrl?: string): string {
  const config = getOAuthConfig(provider);

  // state에 returnUrl 인코딩
  const state = returnUrl ? btoa(JSON.stringify({ returnUrl })) : undefined;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
  });

  if (state) {
    params.set('state', state);
  }

  // 네이버는 state 필수
  if (provider === 'naver' && !state) {
    params.set('state', btoa(JSON.stringify({ ts: Date.now() })));
  }

  return `${config.authorizeUrl}?${params.toString()}`;
}

/**
 * OAuth 리다이렉트 URI 반환 (백엔드 전달용)
 */
export function getOAuthRedirectUri(provider: OAuthProvider): string {
  const config = getOAuthConfig(provider);
  return config.redirectUri;
}
