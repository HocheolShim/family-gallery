import { NextResponse } from "next/server";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import r2 from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALBUMS_KEY = process.env.ALBUMS_KEY || "albums/index.json";

async function streamToString(stream) {
    return await new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (c) => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        stream.on("error", reject);
    });
}

async function readAlbumsFromR2() {
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
    await r2.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: ALBUMS_KEY,
            Body: JSON.stringify(albums, null, 2),
            ContentType: "application/json; charset=utf-8",
        })
    );
}

export async function POST(req) {
    // middleware가 /api/albums 보호하지만, 여기서도 관리자 쿠키 체크 한번 더
    const isAdmin = req.cookies.get("fg_admin")?.value === "1";
    if (!isAdmin) {
        return NextResponse.json({ ok: false, error: "NOT_ADMIN" }, { status: 403 });
    }

    const form = await req.formData();
    const albumId = String(form.get("albumId") || "").trim();
    if (!albumId) {
        return NextResponse.json({ ok: false, error: "MISSING_ALBUM_ID" }, { status: 400 });
    }

    const albums = await readAlbumsFromR2();
    const next = albums.filter((a) => a?.id !== albumId);

    // 이미 없던 id여도 결과 ok로 처리
    await writeAlbumsToR2(next);

    revalidatePath("/albums");
    return NextResponse.json({ ok: true }, { status: 200 });
}
