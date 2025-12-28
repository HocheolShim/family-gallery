import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

async function readAlbums(file) {
    try {
        const raw = await fs.readFile(file, "utf-8");
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function makeId(albums) {
    const max = albums.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0);
    return String(max + 1);
}

export async function POST(req) {
    const form = await req.formData();
    const title = String(form.get("title") || "").trim();

    if (!title) {
        return NextResponse.redirect(new URL("/albums/new?err=bad_title", req.url), { status: 303 });
    }

    const file = path.join(process.cwd(), "app", "data", "albums.json");
    const albums = await readAlbums(file);

    const id = makeId(albums);
    const newAlbum = { id, title };

    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify([newAlbum, ...albums], null, 2), "utf-8");

    // ✅ 업로드 폴더 미리 생성
    await fs.mkdir(path.join(process.cwd(), "uploads", id), { recursive: true });

    return NextResponse.redirect(new URL(`/albums/${id}`, req.url), { status: 303 });
}
