// app/api/albums/list/route.js
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2 from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALBUMS_KEY = process.env.ALBUMS_KEY || "albums/index.json";

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
        // ✅ 원인 로그를 숨기지 말고 찍어라 (지금 문제 잡는 핵심)
        console.error("readAlbumsFromR2 failed:", e);
        return [];
    }
}

export async function GET() {
    const albums = await readAlbumsFromR2();
    return NextResponse.json({ ok: true, albums }, { status: 200 });
}
