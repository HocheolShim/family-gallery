// lib/r2.js
import { S3Client } from "@aws-sdk/client-s3";

function must(name) {
    const v = process.env[name];
    if (!v) {
        throw new Error(`Missing env: ${name}`);
    }
    return v;
}

function getEndpoint() {
    // 1순위: 직접 지정
    if (process.env.R2_ENDPOINT) {
        return process.env.R2_ENDPOINT;
    }

    // 2순위: account id 기반
    if (process.env.R2_ACCOUNT_ID) {
        return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    }

    throw new Error("Missing env: R2_ENDPOINT or R2_ACCOUNT_ID");
}

/**
 * ✅ 핵심
 * named export + default export 둘 다 제공
 */
export const r2 = new S3Client({
    region: "auto",
    endpoint: getEndpoint(),
    credentials: {
        accessKeyId: must("R2_ACCESS_KEY_ID"),
        secretAccessKey: must("R2_SECRET_ACCESS_KEY"),
    },
});

export default r2;
