import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function isSafeId(s) {
    return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}

export async function POST(req) {
    const admin = req.cookies?.get?.("admin_session")?.value === "ok";
    if (!admin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const form = await req.formData();
    const albumId = String(form.get("albumId") || "");
    if (!isSafeId(albumId)) {
        return NextResponse.redirect(new URL(`/albums?err=bad_album`, req.url), { status: 303 });
    }

    // 1) albums.json에서 제거
    const file = path.join(process.cwd(), "app", "data", "albums.json");
    let albums = [];
    try {
        albums = JSON.parse(await fs.readFile(file, "utf-8"));
        if (!Array.isArray(albums)) albums = [];
    } catch {
        albums = [];
    }

    albums = albums.filter((a) => String(a.id) !== albumId);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(albums, null, 2), "utf-8");

    // 2) uploads/<albumId> 폴더 삭제 (사진 전부 삭제)
    const albumDir = path.join(process.cwd(), "uploads", albumId);
    try {
        await fs.rm(albumDir, { recursive: true, force: true });
    } catch { }

    return NextResponse.redirect(new URL("/albums", req.url), { status: 303 });
}
