// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/admin",
  "/api/auth/family",
  "/api/auth/logout",
  "/api/auth/admin",
  "/api/auth/admin-logout",
  "/api/admin/login",
];

const PROTECTED_PREFIXES = ["/albums", "/api/albums", "/api/r2", "/api/image"];

// ✅ 삭제만 관리자 전용으로 유지
const ADMIN_ONLY_PREFIXES = [
  "/api/albums/delete",
  // 필요하면 여기에 업로드/삭제 API 추가
  // "/api/r2/upload",
];

function getCookie(req, name) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // 보호 경로가 아니면 통과
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) return NextResponse.next();

  // 공용 로그인 체크 (공용 로그인이 되어있으면 /albums/new, /api/albums/create 모두 허용됨)
  const authed = getCookie(req, "fg_auth") === "1";
  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ ok: false, error: "UNAUTHORIZED" }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 관리자 전용 체크 (삭제만)
  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isAdminOnly) return NextResponse.next();

  const isAdmin = getCookie(req, "fg_admin") === "1";
  if (isAdmin) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ ok: false, error: "FORBIDDEN" }), {
      status: 403,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/albums";
  url.searchParams.set("err", "admin_only");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
