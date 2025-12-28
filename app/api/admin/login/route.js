import { NextResponse } from "next/server";
export const runtime = "nodejs";

function isSafeRedirect(p) {
    return typeof p === "string" && p.startsWith("/");
}

export async function POST(req) {
    const form = await req.formData();

    const password = String(form.get("password") || "").trim();
    const redirectToRaw = String(form.get("redirectTo") || "/albums").trim();
    const redirectTo = isSafeRedirect(redirectToRaw) ? redirectToRaw : "/albums";

    // ✅ 여기 핵심
    const ADMIN_PASSWORD = String(process.env.ADMIN_PASSCODE || "").trim();

    if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return NextResponse.redirect(
            new URL(`/admin?err=wrong&redirectTo=${encodeURIComponent(redirectTo)}`, req.url),
            { status: 303 }
        );
    }

    const res = NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
    res.cookies.set("admin_session", "ok", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
    });
    return res;
}
