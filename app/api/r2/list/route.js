import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import r2 from "@/lib/r2";

export const runtime = "nodejs";

function isSafeId(s) {
    return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

export async function GET(req) {
    try {
        const bucket = process.env.R2_BUCKET_NAME;
        if (!bucket) {
            console.error("❌ Missing env: R2_BUCKET_NAME");
            return NextResponse.json(
                { ok: false, error: "missing bucket env" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(req.url);
        const albumId = searchParams.get("albumId");

        if (!albumId || !isSafeId(albumId)) {
            return NextResponse.json(
                { ok: false, error: "invalid albumId" },
                { status: 400 }
            );
        }

        const prefix = `albums/${albumId}/`;
        const keys = [];
        let continuationToken;

        do {
            const out = await r2.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                })
            );

            for (const obj of out.Contents || []) {
                if (obj?.Key) keys.push(obj.Key);
            }

            continuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
        } while (continuationToken);

        // 최신 업로드가 위로 오게(키가 timestamp 기반이면 매우 잘 맞음)
        keys.sort().reverse();

        // 프론트에서 바로 쓸 수 있게 url 제공
        const origin = new URL(req.url).origin;
        const items = keys.map((key) => ({
            key,
            url: `${origin}/api/r2/image?key=${encodeURIComponent(key)}`,
        }));

        return NextResponse.json({
            ok: true,
            albumId,
            prefix,
            count: items.length,
            keys,   // 기존 호환 유지
            items,  // 새 권장
        });
    } catch (err) {
        console.error("🔥 R2 LIST ERROR:", err);
        return NextResponse.json({ ok: false, error: "list failed" }, { status: 500 });
    }
}
