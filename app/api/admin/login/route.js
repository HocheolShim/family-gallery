import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
    const form = await req.formData();
    const pass = String(form.get("password") || "");

    const ADMIN_PASS = process.env.ADMIN_PASSCODE;

    if (!ADMIN_PASS || pass !== ADMIN_PASS) {
        return NextResponse.redirect(
            new URL("/albums?err=bad_password", req.url),
            { status: 303 }
        );
    }

    const res = NextResponse.redirect(
        new URL("/albums?admin=1", req.url),
        { status: 303 }
    );

    // 🔴 여기 핵심
    res.cookies.set("admin_session", "ok", {
        httpOnly: true,
        secure: true,      // ✅ Vercel 필수
        sameSite: "lax",   // ✅ POST/redirect 허용
        path: "/",         // ✅ 모든 API 경로에서 접근 가능
        maxAge: 60 * 60 * 6, // 6시간
    });

    return res;
}
