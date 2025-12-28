import { NextResponse } from "next/server";
export const runtime = "nodejs";

function isSafeRedirect(p) {
    return typeof p === "string" && p.startsWith("/");
}

export async function POST(req) {
    const form = await req.formData();
    const redirectToRaw = String(form.get("redirectTo") || "/albums").trim();
    const redirectTo = isSafeRedirect(redirectToRaw) ? redirectToRaw : "/albums";

    const res = NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
    // ✅ 쿠키 삭제
    res.cookies.set("admin_session", "", { path: "/", maxAge: 0 });
    return res;
}

export async function GET() {
    return NextResponse.json({ ok: false, message: "Use POST" }, { status: 405 });
}
