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
    const albumId = String(form.get("albumId") || "").trim();
    const title = String(form.get("title") || "").trim();
    const redirectTo = String(form.get("redirectTo") || `/albums/${albumId}?admin=1`);

    if (!isSafeId(albumId) || !title) {
        return NextResponse.redirect(new URL(`${redirectTo}&err=bad_rename`, req.url), { status: 303 });
    }

    const file = path.join(process.cwd(), "app", "data", "albums.json");

    let albums = [];
    try {
        albums = JSON.parse(await fs.readFile(file, "utf-8"));
        if (!Array.isArray(albums)) albums = [];
    } catch {
        albums = [];
    }

    const idx = albums.findIndex((a) => String(a.id) === albumId);
    if (idx === -1) {
        return NextResponse.redirect(new URL(`${redirectTo}&err=not_found`, req.url), { status: 303 });
    }

    albums[idx] = { ...albums[idx], title };

    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(albums, null, 2), "utf-8");

    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
