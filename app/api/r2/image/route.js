import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

function toUint8Array(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (c) => chunks.push(c));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
    });
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get("key");

        if (!key) return new Response("missing key", { status: 400 });

        const out = await r2.send(
            new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            })
        );

        const bodyBytes = await toUint8Array(out.Body);
        const contentType = out.ContentType || "application/octet-stream";

        return new Response(bodyBytes, {
            headers: {
                "Content-Type": contentType,
                // 캐시(선택): 자주 바뀌면 max-age를 줄여
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (err) {
        console.error("R2 IMAGE ERROR:", err);
        return new Response("not found", { status: 404 });
    }
}
