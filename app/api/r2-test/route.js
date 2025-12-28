import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        ok: true,
        bucket: process.env.R2_BUCKET_NAME || null,
        accountId: process.env.R2_ACCOUNT_ID ? "set" : null,
        accessKey: process.env.R2_ACCESS_KEY_ID ? "set" : null,
        secretKey: process.env.R2_SECRET_ACCESS_KEY ? "set" : null,
    });
}
