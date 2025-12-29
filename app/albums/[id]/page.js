import { cookies } from "next/headers";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import r2 from "@/lib/r2";

import Gallery from "./Gallery";
import AdminBar from "./AdminBar";
import TitleEditor from "./TitleEditor";

export const dynamic = "force-dynamic";

const ALBUMS_KEY = process.env.ALBUMS_KEY || "albums/index.json";

async function bodyToString(body) {
  if (!body) return "";

  // 1) Node.js Readable stream
  if (typeof body.on === "function") {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      body.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", reject);
    });
  }

  // 2) Web ReadableStream
  if (typeof body.getReader === "function") {
    return await new Response(body).text();
  }

  // 3) string
  if (typeof body === "string") return body;

  // 4) fallback
  return String(body);
}

async function readAlbumsFromR2() {
  try {
    const res = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: ALBUMS_KEY,
      })
    );

    const raw = await bodyToString(res.Body);
    if (!raw) return [];

    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // 파일이 아직 없거나 읽기 실패면 빈 배열
    console.error("readAlbumsFromR2 failed:", e);
    return [];
  }
}

async function getAlbumTitle(albumId) {
  const albums = await readAlbumsFromR2();
  const found = albums.find((a) => String(a?.id) === String(albumId));
  return found?.title || null;
}

/**
 * ⚠️ 현재 listImages는 로컬 uploads 폴더를 읽고 있음.
 * Vercel(서버리스) 환경에선 로컬 디스크가 지속되지 않아 운영에 부적합.
 * 지금 당장 제목 문제만 해결하려면 일단 유지 가능.
 * (추후 R2 기반 이미지 리스트 API로 바꾸는 게 정석)
 */
import fs from "fs/promises";
import path from "path";
async function listImages(albumId) {
  const dir = path.join(process.cwd(), "uploads", albumId);
  try {
    const files = await fs.readdir(dir);
    return files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort().reverse();
  } catch {
    return [];
  }
}

export default async function AlbumPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;

  const albumId = String(id);
  const isAdminMode = sp?.admin === "1" || sp?.admin === "true";

  const c = await cookies();

  // ✅ 네 프로젝트의 관리자 쿠키는 fg_admin 으로 쓰고 있으니 그걸로 통일
  // (기존 admin_session은 예전 코드라서 여기서부터 일치시키는 게 맞음)
  const isAdminSession = c.get("fg_admin")?.value === "1";
  const canAdmin = isAdminMode && isAdminSession;

  const [title, images] = await Promise.all([getAlbumTitle(albumId), listImages(albumId)]);
  const albumTitle = title || `앨범 #${albumId}`;

  return (
    <div className="section">
      <div className="sectionHead">
        <div>
          <div className="kicker">
            <a href="/albums" style={{ textDecoration: "none" }}>
              ← 앨범
            </a>
          </div>

          <h2 className="sectionTitle" style={{ marginTop: 8 }}>
            {albumTitle}
          </h2>

          <p className="sectionDesc">
            <span style={{ color: "rgba(255,255,255,0.75)" }}>앨범 ID:</span> #{albumId}
          </p>

          {/* ✅ 제목 변경: canAdmin일 때만 */}
          <TitleEditor albumId={albumId} initialTitle={title || ""} canAdmin={canAdmin} />
        </div>

        {/* ✅ 상단 관리자 바(로그아웃 포함) */}
        <AdminBar albumId={albumId} isAdminSession={isAdminSession} />
      </div>

      <div className="sectionBody">
        <div className="section" style={{ marginTop: 0 }}>
          <div className="sectionHead">
            <div>
              <h3 className="sectionTitle" style={{ fontSize: 16 }}>
                사진 업로드
              </h3>
              <p className="sectionDesc">선택 후 업로드하면 이 앨범에 저장돼요.</p>
            </div>
          </div>

          <div className="sectionBody">
            <form className="formRow" action="/api/upload" method="post" encType="multipart/form-data">
              <input type="hidden" name="albumId" value={albumId} />
              <input type="hidden" name="redirectTo" value={`/albums/${albumId}${isAdminMode ? "?admin=1" : ""}`} />
              <input className="input" type="file" name="file" accept="image/*" required />
              <button className="btn btnPrimary" type="submit">
                업로드
              </button>
              <span className="small">
                삭제/제목변경은 <b>관리자 로그인 + 관리자모드</b>에서만 가능합니다.
              </span>
            </form>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>사진</h3>
            <span className="small">총 {images.length}장</span>
          </div>

          {/* ✅ 갤러리 삭제 버튼도 canAdmin일 때만 */}
          <Gallery images={images} albumId={albumId} canAdmin={canAdmin} />
        </div>
      </div>
    </div>
  );
}
