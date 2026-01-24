import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_TENANT_DOMAIN;
const RESERVED = new Set(['www', 'app', 'admin']);

function getHostname(req: NextRequest) {
  const xfHost = req.headers.get('x-forwarded-host');
  const host = xfHost?.split(',')[0]?.trim() || req.headers.get('host') || '';
  // 포트 번호 제거 (localhost:3000 -> localhost)
  return host.split(':')[0].toLowerCase();
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = getHostname(req);
  const path = url.pathname;

  // 1) apex 도메인 (랜딩): pagelet.kr, www.pagelet.kr
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}` || host === 'localhost') {
    url.pathname = `/landing${path}`;
    return NextResponse.rewrite(url);
  }

  // 1) app 서브도메인: route groups (app)이 자동으로 처리
  // rewrite 없이 그대로 전달 (route groups는 URL에 영향을 주지 않음)
  if (host === `app.${ROOT_DOMAIN}` || host === 'app.localhost') {
    if (path === '/') {
      const token = req.cookies.get('access_token')?.value;
      url.pathname = token ? '/admin' : '/signin';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 2) 테넌트 서브도메인: /t/[slug]/* 로 rewrite
  if (host.endsWith(`.${ROOT_DOMAIN}`) || host.includes('.localhost')) {
    // .pagelet-dev.kr 또는 .localhost 제거
    const slug = host.replace(`.${ROOT_DOMAIN}`, '').replace('.localhost', '').split(':')[0]; // 포트가 있으면 제거

    // slug가 비어있거나 예약어면 404
    if (!slug || RESERVED.has(slug)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // 경로가 이미 /t/[slug]로 시작하는 경우 원래 경로로 redirect
    // 예: /t/hong/category/xxx -> /category/xxx (브라우저 URL 변경)
    if (path.startsWith(`/t/${slug}/`)) {
      const originalPath = path.replace(`/t/${slug}`, '') || '/';
      url.pathname = originalPath;
      return NextResponse.redirect(url);
    }
    if (path === `/t/${slug}`) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // 일반 경로: /category/xxx -> /t/hong/category/xxx
    url.pathname = `/t/${slug}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
