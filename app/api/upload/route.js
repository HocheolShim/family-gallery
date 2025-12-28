import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeName(original) {
  const ext = (original || "").split(".").pop()?.toLowerCase();
  const base = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${base}.${ext || "jpg"}`;
}

function isSafeId(s) {
  return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

function normalizeString(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

export async function POST(req) {
  try {
    const form = await req.formData();

    const file = form.get("file");
    const redirectTo = normalizeString(form.get("redirectTo")) || "/albums/1";
    const albumId = normalizeString(form.get("albumId"));

    // ===== 기본 검증 =====
    if (!albumId || !isSafeId(albumId)) {
      console.log("❌ INVALID albumId:", albumId);
      return NextResponse.redirect(
        new URL(`${redirectTo}?err=missing_albumId`, req.url),
        { status: 303 }
      );
    }

    if (!file || typeof file === "string") {
      console.log("❌ NO FILE");
      return NextResponse.redirect(
        new URL(`${redirectTo}?err=nofile`, req.url),
        { status: 303 }
      );
    }

    if (!allowed.has(file.type)) {
      console.log("❌ INVALID FILE TYPE:", file.type);
      return NextResponse.redirect(
        new URL(`${redirectTo}?err=type`, req.url),
        { status: 303 }
      );
    }

    // ===== R2 업로드 =====
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = safeName(file.name);
    const key = `albums/${albumId}/${filename}`;

    console.log("🚀 R2 UPLOAD START", {
      bucket: process.env.R2_BUCKET_NAME,
      key,
      contentType: file.type,
    });

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    console.log("✅ R2 UPLOAD SUCCESS:", key);

    return NextResponse.redirect(
      new URL(redirectTo, req.url),
      { status: 303 }
    );
  } catch (err) {
    console.error("🔥 R2 UPLOAD ERROR:", err);

    return NextResponse.json(
      { ok: false, error: "R2 upload failed" },
      { status: 500 }
    );
  }
}
