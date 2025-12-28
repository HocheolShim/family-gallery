import { NextResponse } from "next/server";
import {
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import r2 from "@/lib/r2";

export const runtime = "nodejs";

function isSafeId(s) {
    return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

export async function POST(req) {
    try {
        const bucket = process.env.R2_BUCKET_NAME;
        if (!bucket) {
            console.error("❌ Missing env: R2_BUCKET_NAME");
            return NextResponse.json(
                { ok: false, error: "missing bucket env" },
                { status: 500 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const albumId = body?.albumId;

        if (!albumId || !isSafeId(albumId)) {
            return NextResponse.json(
                { ok: false, error: "invalid albumId" },
                { status: 400 }
            );
        }

        const prefix = `albums/${albumId}/`;
        let continuationToken;
        let totalDeleted = 0;

        console.log("🧹 R2 DELETE ALBUM START:", prefix);

        do {
            const listRes = await r2.send(
                new ListObjectsV2Command({
                    Bucket: bucket,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                })
            );

            const objects =
                listRes.Contents?.map((o) => o.Key)
                    .filter(Boolean)
                    .map((Key) => ({ Key })) || [];

            if (objects.length > 0) {
                await r2.send(
                    new DeleteObjectsCommand({
                        Bucket: bucket,
                        Delete: {
                            Objects: objects,
                            Quiet: true,
                        },
                    })
                );

                totalDeleted += objects.length;
                console.log("🗑️ Deleted batch:", objects.length);
            }

            continuationToken = listRes.IsTruncated
                ? listRes.NextContinuationToken
                : undefined;
        } while (continuationToken);

        console.log("✅ R2 DELETE ALBUM DONE:", {
            albumId,
            deleted: totalDeleted,
        });

        return NextResponse.json({
            ok: true,
            albumId,
            deleted: totalDeleted,
        });
    } catch (err) {
        console.error("🔥 R2 DELETE ALBUM ERROR:", err);
        return NextResponse.json(
            { ok: false, error: "delete failed" },
            { status: 500 }
        );
    }
}
