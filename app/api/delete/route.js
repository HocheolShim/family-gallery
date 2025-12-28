import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function isSafeName(name) {
  return !!name && !name.includes("..") && !name.includes("/") && !name.includes("\\");
}
function isSafeId(s) {
  return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

export async function POST(req) {
  const admin = req.cookies?.get?.("admin_session")?.value === "ok";
  if (!admin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const albumId = String(form.get("albumId") || "1");
  const name = String(form.get("name") || "");
  const redirectTo = String(form.get("redirectTo") || `/albums/${albumId}?admin=1`);

  if (!isSafeId(albumId) || !isSafeName(name)) {
    return NextResponse.redirect(new URL(`${redirectTo}&err=badname`, req.url), { status: 303 });
  }

  const filepath = path.join(process.cwd(), "uploads", albumId, name);

  try {
    await fs.unlink(filepath);
  } catch { }

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
