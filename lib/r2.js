// lib/r2.js
import { S3Client } from "@aws-sdk/client-s3";

export function getR2() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT; // 예: https://<accountid>.r2.cloudflarestorage.com

    if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
        throw new Error("Missing R2 env vars: R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_ENDPOINT");
    }

    return new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
    });
}
