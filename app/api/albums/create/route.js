import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function makeId() {
  return String(Date.now());
}

export async function POST(req) {
  const form = await req.formData();
  const title = String(form.get("title") || "").trim();

  if (!title) {
    return NextResponse.redirect(new URL("/albums/new?err=title_required", req.url), { status: 303 });
  }

  const file = path.join(process.cwd(), "app", "data", "albums.json");

  let albums = [];
  try {
    const raw = await fs.readFile(file, "utf-8");
    albums = JSON.parse(raw);
    if (!Array.isArray(albums)) albums = [];
  } catch {
    albums = [];
  }

  const id = makeId();
  albums.unshift({ id, title });

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(albums, null, 2), "utf-8");

  return NextResponse.redirect(new URL(`/albums/${id}`, req.url), { status: 303 });
}
