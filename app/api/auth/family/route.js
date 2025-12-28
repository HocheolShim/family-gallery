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
        return NextResponse.redirect(new URL("/login?err=1", req.url), { status: 303 });
    }

    const res = NextResponse.redirect(new URL("/albums", req.url), { status: 303 });

    res.cookies.set("fg_auth", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    });

    return res;
}
