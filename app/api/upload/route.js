// app/api/upload/route.js
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

// 허용 MIME + MIME에 맞는 확장자 매핑(확장자 위조 방지용)
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const ALLOWED_MIME = new Set(Object.keys(MIME_TO_EXT));

function isSafeId(s) {
  return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

function normalizeString(v) {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  if (!s || s === "undefined" || s === "null") return "";
  return s;
}

/**
 * redirectTo는 "상대경로(/...)"만 허용 (오픈리다이렉트 방지)
 */
function safeRedirectPath(path, fallback = "/albums/1") {
  const p = normalizeString(path);
  if (!p) return fallback;
  if (!p.startsWith("/")) return fallback;
  // 아주 기본적인 정리
  if (p.includes("\n") || p.includes("\r")) return fallback;
  return p;
}

function makeFileName(mimeType) {
  const ext = MIME_TO_EXT[mimeType] || "jpg";
  const base = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${base}.${ext}`;
}

export async function POST(req) {
  try {
    // env 체크 (배포/로컬에서 가장 흔한 원인)
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      console.error("❌ Missing env: R2_BUCKET_NAME");
      return NextResponse.json(
        { ok: false, error: "Missing R2_BUCKET_NAME" },
        { status: 500 }
      );
    }

    const form = await req.formData();

    const file = form.get("file");
    const albumId = normalizeString(form.get("albumId"));
    const redirectTo = safeRedirectPath(form.get("redirectTo"), "/albums/1");

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
      return NextResponse.redirect(new URL(`${redirectTo}?err=nofile`, req.url), {
        status: 303,
      });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      console.log("❌ INVALID FILE TYPE:", file.type);
      return NextResponse.redirect(new URL(`${redirectTo}?err=type`, req.url), {
        status: 303,
      });
    }

    // ===== 파일 내용 읽기 =====
    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.log("❌ EMPTY FILE");
      return NextResponse.redirect(new URL(`${redirectTo}?err=empty`, req.url), {
        status: 303,
      });
    }

    const buffer = Buffer.from(arrayBuffer);

    // 확장자는 MIME 기준으로만 생성(원본 파일명 무시)
    const filename = makeFileName(file.type);
    const key = `albums/${albumId}/${filename}`;

    console.log("🚀 R2 UPLOAD START", {
      bucket,
      key,
      contentType: file.type,
      bytes: buffer.length,
    });

    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        // 브라우저 캐시 최적화(원하면 바꿔도 됨)
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    console.log("✅ R2 UPLOAD SUCCESS:", key);

    // 업로드 후 원래 페이지로 복귀
    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  } catch (err) {
    console.error("🔥 R2 UPLOAD ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "R2 upload failed" },
      { status: 500 }
    );
  }
}
