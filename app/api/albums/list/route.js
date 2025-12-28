// app/api/albums/list/route.js
import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const INDEX_KEY = "albums/index.json";

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
        // index.json 없으면 빈 배열로 시작
        const code = e?.name || e?.Code || e?.code;
        if (code === "NoSuchKey" || code === "NotFound") return [];
        // Cloudflare R2는 에러 형태가 다양해서 message로도 방어
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

export async function GET() {
    // 혹시 인덱스 없으면 자동 생성해주기(선택)
    const albums = await loadAlbums();
    if (albums.length === 0) {
        // index.json이 아예 없을 때도 있으니, 빈 배열이라도 저장해두면 관리 편함
        try {
            await saveAlbums(albums);
        } catch { }
    }
    return NextResponse.json({ ok: true, albums }, { status: 200 });
}
