import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "pagelet-dev.kr";
const RESERVED = new Set(["www", "app", "admin"]);

function getHostname(req: NextRequest) {
  const xfHost = req.headers.get("x-forwarded-host");
  const host = xfHost?.split(",")[0]?.trim() || req.headers.get("host") || "";
  // 포트 번호 제거 (localhost:3000 -> localhost)
  return host.split(":")[0].toLowerCase();
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const host = getHostname(req);
  const path = url.pathname;

  // 1) app 서브도메인: route groups (app)이 자동으로 처리
  // rewrite 없이 그대로 전달 (route groups는 URL에 영향을 주지 않음)
  if (host === `app.${ROOT_DOMAIN}` || host === "app.localhost") {
    return NextResponse.next();
  }

  // 2) 테넌트 서브도메인: /t/[slug]/* 로 rewrite
  if (host.endsWith(`.${ROOT_DOMAIN}`) || host.includes(".localhost")) {
    // .pagelet-dev.kr 또는 .localhost 제거
    const slug = host
      .replace(`.${ROOT_DOMAIN}`, "")
      .replace(".localhost", "")
      .split(":")[0]; // 포트가 있으면 제거
    
    // slug가 비어있거나 예약어면 404
    if (!slug || RESERVED.has(slug)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    url.pathname = `/t/${slug}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
