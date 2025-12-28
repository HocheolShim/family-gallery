// app/api/albums/create/route.js
import { NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import r2 from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALBUMS_KEY = process.env.ALBUMS_KEY || "albums/index.json";

function safeText(s, max = 60) {
  return String(s || "").trim().slice(0, max);
}

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function bodyToString(body) {
  if (!body) return "";

  // 1) Node.js Readable stream
  if (typeof body.on === "function") {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      body.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", reject);
    });
  }

  // 2) Web ReadableStream
  if (typeof body.getReader === "function") {
    return await new Response(body).text();
  }

  // 3) string
  if (typeof body === "string") return body;

  // 4) fallback
  return String(body);
}

async function readAlbumsFromR2() {
  try {
    const res = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: ALBUMS_KEY,
      })
    );

    const raw = await bodyToString(res.Body);
    if (!raw) return [];

    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // 파일이 아직 없거나, 읽기 실패면 빈 배열로 시작
    console.error("readAlbumsFromR2 failed (fallback to []):", e);
    return [];
  }
}

async function writeAlbumsToR2(albums) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: ALBUMS_KEY,
      Body: JSON.stringify(albums, null, 2),
      ContentType: "application/json; charset=utf-8",
    })
  );
}

function withTs(url) {
  const u = new URL(url, "http://local"); // 더미 base
  u.searchParams.set("t", String(Date.now()));
  return u.pathname + u.search;
}

export async function POST(req) {
  const form = await req.formData();
  const title = safeText(form.get("title"), 80);

  // redirectTo는 내부 경로만 허용
  const redirectToRaw = safeText(form.get("redirectTo") || "/albums", 200);
  const redirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "/albums";

  if (!title) {
    return NextResponse.redirect(new URL(withTs(`${redirectTo}?err=empty_title`), req.url), {
      status: 303,
    });
  }

  const albums = await readAlbumsFromR2();

  const album = {
    id: makeId(),
    title,
    createdAt: new Date().toISOString(),
  };

  const next = [album, ...albums];

  try {
    await writeAlbumsToR2(next);
  } catch (e) {
    console.error("writeAlbumsToR2 failed:", e);
    return NextResponse.redirect(new URL(withTs(`${redirectTo}?err=write_failed`), req.url), {
      status: 303,
    });
  }

  // ✅ 목록 페이지 캐시 무효화
  revalidatePath("/albums");

  return NextResponse.redirect(new URL(withTs(redirectTo), req.url), { status: 303 });
}
