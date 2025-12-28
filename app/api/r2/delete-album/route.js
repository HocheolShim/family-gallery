import { NextResponse } from "next/server";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req) {
    try {
        const { albumId } = await req.json();

        if (!albumId) {
            return NextResponse.json({ ok: false, error: "missing albumId" }, { status: 400 });
        }

        const prefix = `albums/${albumId}/`;
        let ContinuationToken = undefined;
        let totalDeleted = 0;

        do {
            const list = await r2.send(
                new ListObjectsV2Command({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Prefix: prefix,
                    ContinuationToken,
                })
            );

            const objects = (list.Contents || [])
                .map((o) => o.Key)
                .filter(Boolean)
                .map((Key) => ({ Key }));

            if (objects.length) {
                const del = await r2.send(
                    new DeleteObjectsCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Delete: { Objects: objects, Quiet: true },
                    })
                );

                totalDeleted += objects.length;
            }

            ContinuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
        } while (ContinuationToken);

        return NextResponse.json({ ok: true, prefix, deleted: totalDeleted });
    } catch (err) {
        console.error("R2 DELETE ALBUM ERROR:", err);
        return NextResponse.json({ ok: false, error: "delete failed" }, { status: 500 });
    }
}
