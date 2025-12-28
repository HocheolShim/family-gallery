import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import Gallery from "./Gallery";
import AdminBar from "./AdminBar";
import TitleEditor from "./TitleEditor";

export const dynamic = "force-dynamic";

async function readAlbums() {
  const file = path.join(process.cwd(), "app", "data", "albums.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const albums = JSON.parse(raw);
    return Array.isArray(albums) ? albums : [];
  } catch {
    return [];
  }
}

async function getAlbumTitle(albumId) {
  const albums = await readAlbums();
  const found = albums.find((a) => String(a.id) === String(albumId));
  return found?.title || null;
}

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
  const isAdminSession = c.get("admin_session")?.value === "ok";
  const canAdmin = isAdminMode && isAdminSession;

  const [title, images] = await Promise.all([getAlbumTitle(albumId), listImages(albumId)]);
  const albumTitle = title || `앨범 #${albumId}`;

  return (
    <div className="section">
      <div className="sectionHead">
        <div>
          <div className="kicker">
            <a href="/albums" style={{ textDecoration: "none" }}>← 앨범</a>
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
              <h3 className="sectionTitle" style={{ fontSize: 16 }}>사진 업로드</h3>
              <p className="sectionDesc">선택 후 업로드하면 이 앨범에 저장돼요.</p>
            </div>
          </div>

          <div className="sectionBody">
            <form className="formRow" action="/api/upload" method="post" encType="multipart/form-data">
              <input type="hidden" name="albumId" value={albumId} />
              <input type="hidden" name="redirectTo" value={`/albums/${albumId}${isAdminMode ? "?admin=1" : ""}`} />
              <input className="input" type="file" name="file" accept="image/*" required />
              <button className="btn btnPrimary" type="submit">업로드</button>
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
