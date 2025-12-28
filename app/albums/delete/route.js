import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function isSafeId(s) {
    return typeof s === "string" && /^[0-9A-Za-z_-]+$/.test(s);
}
function isSafeRedirect(p) {
    return typeof p === "string" && p.startsWith("/");
}

async function readAlbums(file) {
    try {
        const raw = await fs.readFile(file, "utf-8");
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export async function POST(req) {
    // ✅ 관리자 쿠키 체크 (httpOnly 쿠키는 서버에서만 확인 가능)
    const isAdmin = req.cookies?.get?.("admin_session")?.value === "ok";
    if (!isAdmin) {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const albumId = String(form.get("albumId") || "").trim();
    const redirectToRaw = String(form.get("redirectTo") || "/albums?admin=1").trim();
    const redirectTo = isSafeRedirect(redirectToRaw) ? redirectToRaw : "/albums?admin=1";

    if (!isSafeId(albumId)) {
        return NextResponse.redirect(new URL(`${redirectTo}&err=bad_albumId`, req.url), { status: 303 });
    }

    // 1) albums.json에서 삭제
    const file = path.join(process.cwd(), "app", "data", "albums.json");
    const albums = await readAlbums(file);

    const nextAlbums = albums.filter((a) => String(a.id) !== albumId);

    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(nextAlbums, null, 2), "utf-8");

    // 2) uploads/albumId 폴더도 삭제(사진 전부)
    const albumDir = path.join(process.cwd(), "uploads", albumId);
    try {
        await fs.rm(albumDir, { recursive: true, force: true });
    } catch {
        // 없어도 무시
    }

    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
