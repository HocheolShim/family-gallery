import { NextResponse } from "next/server";

export async function POST(req) {
  const form = await req.formData();
  const pass = String(form.get("pass") ?? "");

  if (pass !== process.env.ADMIN_PASSCODE) {
    return NextResponse.redirect(new URL("/admin?err=1", req.url), { status: 303 });
  }

  // ✅ 관리자 쿠키 심기 (fg_admin으로 통일)
  const res = NextResponse.redirect(new URL("/albums", req.url), { status: 303 });

  res.cookies.set("fg_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
