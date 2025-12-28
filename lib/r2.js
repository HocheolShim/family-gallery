// lib/r2.js
import { S3Client } from "@aws-sdk/client-s3";

function must(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

// 둘 중 하나 방식으로 endpoint 구성
// 1) R2_ENDPOINT 를 직접 넣는 방식 (권장)
// 2) R2_ACCOUNT_ID 로 자동 생성
function getEndpoint() {
    const direct = process.env.R2_ENDPOINT;
    if (direct) return direct;

    const accountId = process.env.R2_ACCOUNT_ID;
    if (accountId) return `https://${accountId}.r2.cloudflarestorage.com`;

    // 둘 다 없으면 에러
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

// ✅ 어떤 파일은 default import 쓸 수도 있으니 둘 다 제공
export default r2;
