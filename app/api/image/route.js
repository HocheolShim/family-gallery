export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const album = searchParams.get("album") || "";
  const name = searchParams.get("name");

  // 나머지 기존 코드
}


import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function isSafeName(name) {
  return !!name && !name.includes("..") && !name.includes("/") && !name.includes("\\");
}
function isSafeId(s) {
  return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const album = searchParams.get("album") || "1";
  const name = searchParams.get("name");

  if (!isSafeId(album) || !isSafeName(name)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filepath = path.join(process.cwd(), "uploads", album, name);

  try {
    const data = await fs.readFile(filepath);
    const ext = path.extname(name).toLowerCase();
    const type = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    return new NextResponse(data, {
      status: 200,
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
