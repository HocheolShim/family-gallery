// app/api/auth/login/route.js
import { NextResponse } from "next/server";

function safeNext(v) {
    const s = String(v || "").trim();
    return s.startsWith("/") ? s : "/albums";
}

export async function POST(req) {
    const form = await req.formData();
    const pw = String(form.get("password") || "");
    const next = safeNext(form.get("next") || "/albums");

    // ✅ 둘 다 지원
    const correct = process.env.FAMILY_PASSWORD || process.env.FAMILY_PASSCODE;

    if (!correct || pw !== correct) {
        const url = new URL("/login", req.url);
        url.searchParams.set("err", "1");
        url.searchParams.set("next", next);
        return NextResponse.redirect(url, { status: 303 });
    }

    const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set("fg_auth", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    });

    return res;
}
