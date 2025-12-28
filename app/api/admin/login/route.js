// app/api/admin/login/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
    const form = await req.formData();
    const pass = String(form.get("pass") ?? "");
    const redirectTo = String(form.get("redirectTo") ?? "/albums");

    if (pass !== process.env.ADMIN_PASSCODE) {
        return NextResponse.redirect(new URL("/admin?err=1", req.url), { status: 303 });
    }

    const res = NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });

    res.cookies.set("fg_admin", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    });

    return res;
}
