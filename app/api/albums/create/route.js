// app/api/albums/create/route.js
import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const INDEX_KEY = "albums/index.json";

function isSafeRedirect(p) {
  return typeof p === "string" && p.startsWith("/");
}
function sanitizeTitle(s) {
  const t = String(s || "").trim();
  return t.length > 60 ? t.slice(0, 60) : t;
}
function newId() {
  // 파일/키에 안전한 ID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getEndpoint() {
  const raw = process.env.R2_ENDPOINT || "";
  if (!raw) return "";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
function getR2() {
  const endpoint = getEndpoint();
  if (!endpoint) throw new Error("Missing R2_ENDPOINT");
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
}
async function loadAlbums() {
  const r2 = getR2();
  const Bucket = process.env.R2_BUCKET_NAME;
  if (!Bucket) throw new Error("Missing R2_BUCKET_NAME");

  try {
    const out = await r2.send(new GetObjectCommand({ Bucket, Key: INDEX_KEY }));
    const raw = await streamToString(out.Body);
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    const code = e?.name || e?.Code || e?.code;
    if (code === "NoSuchKey" || code === "NotFound") return [];
    if (String(e?.message || "").toLowerCase().includes("nosuchkey")) return [];
    return [];
  }
}
async function saveAlbums(albums) {
  const r2 = getR2();
  const Bucket = process.env.R2_BUCKET_NAME;
  if (!Bucket) throw new Error("Missing R2_BUCKET_NAME");

  await r2.send(
    new PutObjectCommand({
      Bucket,
      Key: INDEX_KEY,
      Body: JSON.stringify(albums, null, 2),
      ContentType: "application/json; charset=utf-8",
    })
  );
}

export async function POST(req) {
  // ✅ 관리자 쿠키 체크 (httpOnly 쿠키는 서버에서만 확인 가능)
  const isAdmin = req.cookies?.get?.("admin_session")?.value === "ok";
  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const title = sanitizeTitle(form.get("title") || form.get("name") || "");
  const redirectToRaw = String(form.get("redirectTo") || "/albums?admin=1").trim();
  const redirectTo = isSafeRedirect(redirectToRaw) ? redirectToRaw : "/albums?admin=1";

  if (!title) {
    return NextResponse.redirect(new URL(`${redirectTo}&err=empty_title`, req.url), { status: 303 });
  }

  try {
    const albums = await loadAlbums();

    const id = newId();
    const now = new Date().toISOString();

    // 기존 코드 호환: title / name 둘 다 넣어줌
    const newAlbum = { id, title, name: title, createdAt: now };

    const nextAlbums = [newAlbum, ...albums];
    await saveAlbums(nextAlbums);

    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  } catch (e) {
    console.error("🔥 ALBUM CREATE ERROR:", e);
    return NextResponse.redirect(new URL(`${redirectTo}&err=server`, req.url), { status: 303 });
  }
}
