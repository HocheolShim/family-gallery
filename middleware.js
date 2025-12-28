// middleware.js
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/albums", "/api/albums"];
const PUBLIC_PATHS = ["/", "/login", "/api/auth/login", "/api/auth/logout"];

export function middleware(req) {
    const { pathname } = req.nextUrl;

    // 공개 경로는 통과
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
    }

    // 보호 경로가 아니면 통과
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isProtected) return NextResponse.next();

    // 로그인 쿠키 체크
    const authed = req.cookies.get("fg_auth")?.value === "1";
    if (authed) return NextResponse.next();

    // API는 401, 페이지는 로그인으로 리다이렉트
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

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
