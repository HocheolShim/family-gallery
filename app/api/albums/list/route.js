// app/api/albums/list/route.js
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALBUMS_KEY = process.env.ALBUMS_KEY || "albums/index.json";

async function streamToString(stream) {
    // AWS SDK v3: Body is a stream in node
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
    } catch (e) {
        // 파일 없으면 그냥 빈 배열로
        return [];
    }
}

export async function GET() {
    const albums = await readAlbumsFromR2();
    return NextResponse.json({ ok: true, albums }, { status: 200 });
}
