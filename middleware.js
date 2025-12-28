// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/admin", "/api/auth/login", "/api/auth/logout", "/api/auth/admin-login"];

const PROTECTED_PREFIXES = ["/albums", "/api/albums"];

// 관리자만 허용할 경로(생성/삭제/업로드 등)
const ADMIN_ONLY_PREFIXES = [
    "/albums/new",
    "/api/albums/create",
    "/api/albums/delete",
];

export function middleware(req) {
    const { pathname } = req.nextUrl;

    // 공개 경로는 통과
    if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next();
    }

    // 보호 경로가 아니면 통과
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isProtected) return NextResponse.next();

    // 공용 로그인 쿠키 체크
    const authed = req.cookies.get("fg_auth")?.value === "1";
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

    // ✅ 여기부터 “관리자 전용” 체크
    const isAdminOnly = ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isAdminOnly) return NextResponse.next();

    const isAdmin = req.cookies.get("fg_admin")?.value === "1";
    if (isAdmin) return NextResponse.next();

    // 관리자 아니면 차단
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
