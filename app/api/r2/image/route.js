export async function GET(req) {
    const { searchParams } = new URL(req.url);

    const key = searchParams.get("key");

    // 나머지 기존 코드
}


import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2 from "@/lib/r2";

export const runtime = "nodejs";

/**
 * key를 최소한으로 검증:
 * - "albums/<albumId>/<filename>" 형태만 허용
 * - 경로 탈출(../), 역슬래시(\) 등 금지
 */
function isSafeKey(key) {
    if (typeof key !== "string") return false;
    if (!key.startsWith("albums/")) return false;
    if (key.includes("..")) return false;
    if (key.includes("\\")) return false;
    if (key.includes("\n") || key.includes("\r")) return false;

    // albums/<id>/<name>
    const parts = key.split("/");
    if (parts.length < 3) return false;

    const albumId = parts[1];
    if (!/^[0-9A-Za-z_-]+$/.test(albumId)) return false;

    // 너무 긴 키 방지(남용 방지)
    if (key.length > 512) return false;

    return true;
}

/**
 * Node.js Readable -> Web ReadableStream 변환
 * (Next/Response는 Web Stream이 가장 안정적)
 */
function nodeReadableToWeb(nodeStream) {
    return new ReadableStream({
        start(controller) {
            nodeStream.on("data", (chunk) => controller.enqueue(chunk));
            nodeStream.on("end", () => controller.close());
            nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
            try {
                nodeStream.destroy();
            } catch { }
        },
    });
}

export async function GET(req) {
    try {
        const bucket = process.env.R2_BUCKET_NAME;
        if (!bucket) {
            console.error("❌ Missing env: R2_BUCKET_NAME");
            return new Response("server misconfigured", { status: 500 });
        }

        const { searchParams } = new URL(req.url);
        const key = searchParams.get("key");

        if (!key) return new Response("missing key", { status: 400 });
        if (!isSafeKey(key)) return new Response("invalid key", { status: 400 });

        const out = await r2.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );

        // out.Body는 Node Readable(Stream)일 가능성이 큼
        if (!out?.Body) return new Response("not found", { status: 404 });

        const contentType = out.ContentType || "application/octet-stream";

        // 조건부 요청(If-None-Match) 처리 (ETag가 있으면 304 가능)
        const etag = out.ETag; // 보통 `"..."` 형태
        const ifNoneMatch = req.headers.get("if-none-match");
        if (etag && ifNoneMatch && ifNoneMatch === etag) {
            return new Response(null, {
                status: 304,
                headers: {
                    ETag: etag,
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        // 스트리밍 응답(메모리 절약)
        const stream =
            typeof out.Body.getReader === "function"
                ? out.Body // 이미 Web ReadableStream이면 그대로
                : nodeReadableToWeb(out.Body);

        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Cache-Control", "public, max-age=3600");
        if (etag) headers.set("ETag", etag);

        // 길이 있으면 넣어줌(선택)
        if (typeof out.ContentLength === "number") {
            headers.set("Content-Length", String(out.ContentLength));
        }

        return new Response(stream, { status: 200, headers });
    } catch (err) {
        // AWS SDK에서 NoSuchKey 등도 여기로 옴
        console.error("🔥 R2 IMAGE ERROR:", err);
        return new Response("not found", { status: 404 });
    }
}
