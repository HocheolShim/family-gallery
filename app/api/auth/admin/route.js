import { NextResponse } from "next/server";

export async function POST(req) {
  const form = await req.formData();
  const pass = String(form.get("pass") ?? "");

  if (pass !== process.env.ADMIN_PASSCODE) {
    return NextResponse.redirect(new URL("/admin?err=1", req.url), { status: 303 });
  }

  // ✅ 관리자 쿠키 심기
  const res = NextResponse.redirect(new URL("/albums/1?admin=1", req.url), { status: 303 });
  res.cookies.set("admin_session", "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // 나중에 배포(HTTPS)에서는 true 권장
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30일
  });

  return res;
}
