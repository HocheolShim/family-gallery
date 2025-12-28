import { NextResponse } from "next/server";

export async function POST(req) {
    const url = new URL(req.url);
    const next = url.searchParams.get("next") || "/albums";

    const res = NextResponse.redirect(new URL(next, req.url), { status: 303 });
    res.cookies.set("fg_admin", "0", { path: "/", maxAge: 0 });
    return res;
}
