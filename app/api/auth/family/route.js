import { NextResponse } from "next/server";

export async function POST(req) {
    const contentType = req.headers.get("content-type") || "";
    let pass = "";

    if (contentType.includes("application/json")) {
        const body = await req.json();
        pass = String(body.pass ?? "");
    } else {
        const form = await req.formData();
        pass = String(form.get("pass") ?? "");
    }

    if (pass !== process.env.FAMILY_PASSCODE) {
        return NextResponse.redirect(new URL("/enter?err=1", req.url), { status: 303 });
    }

    const res = NextResponse.redirect(new URL("/albums", req.url), { status: 303 });
    res.cookies.set("family_session", "ok", {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // 나중에 배포(HTTPS)하면 true로
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30일
    });
    return res;
}
