// lib/r2.js
import { S3Client } from "@aws-sdk/client-s3";

function must(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

function getEndpoint() {
    if (process.env.R2_ENDPOINT) return process.env.R2_ENDPOINT;
    if (process.env.R2_ACCOUNT_ID)
        return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    throw new Error("Missing env: R2_ENDPOINT or R2_ACCOUNT_ID");
}

export const r2 = new S3Client({
    region: "auto",
    endpoint: getEndpoint(),
    credentials: {
        accessKeyId: must("R2_ACCESS_KEY_ID"),
        secretAccessKey: must("R2_SECRET_ACCESS_KEY"),
    },
});

export default r2;
