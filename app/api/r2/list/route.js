import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const albumId = searchParams.get("albumId");

        if (!albumId) {
            return NextResponse.json({ ok: false, error: "missing albumId" }, { status: 400 });
        }

        const prefix = `albums/${albumId}/`;
        const keys = [];

        let ContinuationToken = undefined;

        do {
            const out = await r2.send(
                new ListObjectsV2Command({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Prefix: prefix,
                    ContinuationToken,
                })
            );

            (out.Contents || []).forEach((obj) => {
                if (obj.Key) keys.push(obj.Key);
            });

            ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
        } while (ContinuationToken);

        // 최신 업로드가 위로 오게 대충 역정렬(키가 timestamp 기반이면 효과 좋음)
        keys.sort().reverse();

        return NextResponse.json({ ok: true, prefix, keys });
    } catch (err) {
        console.error("R2 LIST ERROR:", err);
        return NextResponse.json({ ok: false, error: "list failed" }, { status: 500 });
    }
}
