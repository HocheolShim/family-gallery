import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

function isSafeTitle(s) {
    return typeof s === "string" && s.trim().length >= 1 && s.trim().length <= 60;
}
function newId() {
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
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error(
            `Missing R2 envs: R2_ENDPOINT=${!!endpoint}, R2_ACCESS_KEY_ID=${!!accessKeyId}, R2_SECRET_ACCESS_KEY=${!!secretAccessKey}`
        );
    }

    return new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
}

const ALBUMS_KEY = "albums.json";

async function readAlbumsFromR2(r2, bucket) {
    try {
        const out = await r2.send(new GetObjectCommand({ Bucket: bucket, Key: ALBUMS_KEY }));
        const text = await streamToString(out.Body);
        const data = JSON.parse(text);
        return Array.isArray(data) ? data : [];
    } catch (e) {
        const name = e?.name || "";
        const code = e?.Code || e?.code || "";
        // 처음이면 없을 수 있음
        if (name === "NoSuchKey" || code === "NoSuchKey" || code === "NotFound") return [];
        // 그 외는 위로 던져서 에러 보이게
        throw e;
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
    try {
        // ✅ 여기서 쿠키가 실제로 들어오는지 로그
        const cookieVal = req.cookies?.get?.("admin_session")?.value;
        console.log("[albums/create] cookie admin_session =", cookieVal);

        const isAdmin = cookieVal === "ok";
        if (!isAdmin) {
            // ❗️Forbidden이면 이유를 화면에 찍게 돌려보냄
            return NextResponse.redirect(new URL(`/albums/new?err=forbidden`, req.url), { status: 303 });
        }

        const form = await req.formData();
        const titleRaw = String(form.get("title") || "");
        const title = titleRaw.trim();

        console.log("[albums/create] title =", title);

        if (!isSafeTitle(title)) {
            return NextResponse.redirect(new URL(`/albums/new?err=bad_title`, req.url), { status: 303 });
        }

        const bucket = process.env.R2_BUCKET_NAME;
        if (!bucket) {
            throw new Error("Missing env: R2_BUCKET_NAME");
        }

        const r2 = getR2Client();

        // ✅ 읽기/쓰기 테스트 로그
        console.log("[albums/create] read albums.json from R2 ...");
        const albums = await readAlbumsFromR2(r2, bucket);
        console.log("[albums/create] current albums length =", albums.length);

        const id = newId();
        const now = new Date().toISOString();

        const nextAlbums = [{ id, title, createdAt: now }, ...albums];

        console.log("[albums/create] write albums.json to R2 ...");
        await writeAlbumsToR2(r2, bucket, nextAlbums);
        console.log("[albums/create] write OK. redirect to /albums/" + id);

        return NextResponse.redirect(new URL(`/albums/${id}?admin=1`, req.url), { status: 303 });
    } catch (e) {
        // ❗️무조건 화면에서 보이게
        const msg = encodeURIComponent(e?.message || String(e));
        const name = encodeURIComponent(e?.name || "");
        console.error("[albums/create] ERROR:", e);

        return NextResponse.redirect(new URL(`/albums/new?err=server&name=${name}&msg=${msg}`, req.url), {
            status: 303,
        });
    }
}
