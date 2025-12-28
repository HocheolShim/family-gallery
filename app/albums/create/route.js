// app/api/albums/create/route.js
import { NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { getR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALBUMS_KEY = process.env.ALBUMS_KEY || "albums/index.json";

function safeText(s, max = 60) {
    return String(s || "").trim().slice(0, max);
}

function makeId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function streamToString(stream) {
    return await new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (c) => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        stream.on("error", reject);
    });
}

async function readAlbumsFromR2() {
    const r2 = getR2();
    try {
        const res = await r2.send(
            new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: ALBUMS_KEY,
            })
        );
        const raw = await streamToString(res.Body);
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

async function writeAlbumsToR2(albums) {
    const r2 = getR2();
    await r2.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: ALBUMS_KEY,
            Body: JSON.stringify(albums, null, 2),
            ContentType: "application/json; charset=utf-8",
            // 캐시로 인해 목록이 안 바뀌는 것 방지(중요)
            CacheControl: "no-store, max-age=0",
        })
    );
}

// (선택) 브라우저에서 /api/albums/create 를 직접 열면 보기 좋게 405 처리
export async function GET() {
    return NextResponse.json(
        { ok: false, error: "Method Not Allowed" },
        { status: 405 }
    );
}

export async function POST(req) {
    // ✅ 생성은 누구나 가능 (관리자 체크 제거)

    const form = await req.formData();
    const title = safeText(form.get("title"), 80);

    // ✅ 일반 사용자 기준 기본 리다이렉트
    const redirectToRaw = safeText(form.get("redirectTo") || "/albums", 200);
    const redirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "/albums";

    if (!title) {
        return NextResponse.redirect(new URL(`${redirectTo}?err=empty_title`, req.url), {
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
    await writeAlbumsToR2(next);

    // ✅ /albums 페이지 캐시 무효화
    revalidatePath("/albums");

    // ✅ 즉시 반영 강제(쿼리 버스터)
    return NextResponse.redirect(
        new URL(`${redirectTo}?t=${Date.now()}`, req.url),
        { status: 303 }
    );
}
