import Link, { type LinkOptions } from '@tiptap/extension-link';

// 차단할 프로토콜 목록
const DISALLOWED_PROTOCOLS = ['ftp', 'file', 'mailto'] as const;

// 차단할 도메인 목록
const DISALLOWED_DOMAINS = ['example-phishing.com', 'malicious-site.net'] as const;

// 자동 링크 차단 도메인 목록
const DISALLOWED_AUTOLINK_DOMAINS = ['example-no-autolink.com', 'another-no-autolink.com'] as const;

// isAllowedUri의 ctx 파라미터 타입
type IsAllowedUriContext = Parameters<LinkOptions['isAllowedUri']>[1];

/**
 * URL이 허용 가능한지 검증하는 함수
 */
function isAllowedUri(url: string, ctx: IsAllowedUriContext): boolean {
  try {
    // URL 구성
    const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`);

    // 기본 검증 사용
    if (!ctx.defaultValidate(parsedUrl.href)) {
      return false;
    }

    // 차단된 프로토콜 확인
    const protocol = parsedUrl.protocol.replace(':', '');
    if (DISALLOWED_PROTOCOLS.includes(protocol as (typeof DISALLOWED_PROTOCOLS)[number])) {
      return false;
    }

    // ctx.protocols에 지정된 프로토콜만 허용
    const allowedProtocols = ctx.protocols.map((p) => (typeof p === 'string' ? p : p.scheme));
    if (!allowedProtocols.includes(protocol)) {
      return false;
    }

    // 차단된 도메인 확인
    const domain = parsedUrl.hostname;
    if (DISALLOWED_DOMAINS.includes(domain as (typeof DISALLOWED_DOMAINS)[number])) {
      return false;
    }

    // 모든 검증 통과
    return true;
  } catch {
    return false;
  }
}

/**
 * URL이 자동 링크로 변환되어야 하는지 확인하는 함수
 */
function shouldAutoLink(url: string): boolean {
  try {
    const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`);
    const domain = parsedUrl.hostname;

    return !DISALLOWED_AUTOLINK_DOMAINS.includes(
      domain as (typeof DISALLOWED_AUTOLINK_DOMAINS)[number],
    );
  } catch {
    return false;
  }
}

/**
 * Link extension 설정
 */
export const linkExtension = Link.configure({
  openOnClick: false,
  autolink: true,
  defaultProtocol: 'https',
  protocols: ['http', 'https'],
  isAllowedUri,
  shouldAutoLink,
});
