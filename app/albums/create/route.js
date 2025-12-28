import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

function isSafeTitle(s) {
    return typeof s === "string" && s.trim().length >= 1 && s.trim().length <= 60;
}

function newId() {
    // 충돌 적고 URL-safe
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (c) => chunks.push(c));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
}

function getR2Client() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT; // 예: https://xxxx.r2.cloudflarestorage.com

    if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
        throw new Error("Missing R2 envs (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_ENDPOINT)");
    }

    return new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
}

const ALBUMS_KEY = "albums.json"; // ✅ R2 루트에 albums.json 저장

async function readAlbumsFromR2(r2, bucket) {
    try {
        const out = await r2.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: ALBUMS_KEY,
            })
        );

        const text = await streamToString(out.Body);
        const data = JSON.parse(text);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        // 처음이면 파일 없을 수 있음 → 빈 배열
        const name = e?.name || "";
        const code = e?.Code || e?.code || "";
        if (name === "NoSuchKey" || code === "NoSuchKey" || code === "NotFound") return [];
        return [];
    }
}

async function writeAlbumsToR2(r2, bucket, albums) {
    await r2.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: ALBUMS_KEY,
            Body: JSON.stringify(albums, null, 2),
            ContentType: "application/json; charset=utf-8",
            CacheControl: "no-store",
        })
    );
}

export async function POST(req) {
    // ✅ 관리자 쿠키 체크
    const isAdmin = req.cookies?.get?.("admin_session")?.value === "ok";
    if (!isAdmin) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const titleRaw = String(form.get("title") || "");
    const title = titleRaw.trim();

    if (!isSafeTitle(title)) {
        return NextResponse.redirect(new URL(`/albums/new?err=bad_title`, req.url), { status: 303 });
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
        return NextResponse.json({ ok: false, error: "Missing R2_BUCKET_NAME" }, { status: 500 });
    }

    const r2 = getR2Client();

    // ✅ 새 앨범 생성 (R2의 albums.json에 기록)
    const albums = await readAlbumsFromR2(r2, bucket);

    const id = newId();
    const now = new Date().toISOString();

    const nextAlbums = [
        {
            id,
            title,
            createdAt: now,
        },
        ...albums,
    ];

    await writeAlbumsToR2(r2, bucket, nextAlbums);

    // ✅ 생성 즉시 새 앨범으로 이동
    return NextResponse.redirect(new URL(`/albums/${id}?admin=1`, req.url), { status: 303 });
}
