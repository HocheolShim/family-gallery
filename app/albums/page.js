// app/albums/page.js
import fs from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import DeleteAlbumForm from "./DeleteAlbumForm";
import LogoutButton from "../components/LogoutButton";

export const dynamic = "force-dynamic";

async function readAlbums() {
  const file = path.join(process.cwd(), "app", "data", "albums.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const albums = JSON.parse(raw);
    return Array.isArray(albums) ? albums : [];
  } catch {
    return [{ id: "1", title: "우리 가족 앨범" }];
  }
}

export default async function AlbumsPage({ searchParams }) {
  const sp = await searchParams; // ✅ 너 환경: Promise일 수 있음
  const isAdminMode = sp?.admin === "1" || sp?.admin === "true";

  const c = await cookies();
  const isAdminSession = c.get("admin_session")?.value === "ok";

  // ✅ 진짜 관리자 권한(로그인+모드)
  const canAdmin = isAdminMode && isAdminSession;

  const albums = await readAlbums();

  return (
    <div className="section">
      <div className="sectionHead">
        <div>
          <h2 className="sectionTitle">앨범</h2>
          <p className="sectionDesc">앨범을 선택해서 사진을 올리고 볼 수 있어요.</p>
        </div>

        <div className="row">
          <a className="btn btnPrimary" href="/albums/new">+ 새 앨범</a>

          {/* ✅ 관리자모드 켜기: 로그인 안됐으면 "로그인"으로 유도 */}
          {isAdminSession ? (
            <a className="btn" href={isAdminMode ? "/albums" : "/albums?admin=1"}>
              {isAdminMode ? "관리자 모드 끄기" : "관리자 모드 켜기"}
            </a>
          ) : (
            <a className="btn" href={`/admin?redirectTo=${encodeURIComponent("/albums?admin=1")}`}>
              관리자 모드 켜기(로그인)
            </a>
          )}

          {/* 로그인/로그아웃 */}
          {isAdminSession ? (
            <LogoutButton redirectTo="/albums" />
          ) : (
            <a className="btn" href={`/admin?redirectTo=${encodeURIComponent("/albums?admin=1")}`}>
              관리자 로그인
            </a>
          )}
        </div>
      </div>

      <div className="sectionBody">
        {/* 상태 배지 */}
        {canAdmin ? (
          <div style={{ marginBottom: 12 }}>
            <span className="pill">
              <span className="dot dotOn" /> 관리자 모드 ON (삭제 가능)
            </span>
          </div>
        ) : isAdminMode && !isAdminSession ? (
          <div style={{ marginBottom: 12 }}>
            <span className="pill">
              <span className="dot" /> 관리자 모드 요청됨 (로그인 필요)
            </span>
          </div>
        ) : null}

        <div className="grid">
          {albums.map((a) => (
            <div key={a.id} className="card" style={{ position: "relative" }}>
              <a
                href={`/albums/${a.id}${isAdminMode ? "?admin=1" : ""}`}
                className="cardBody"
                style={{ display: "block" }}
              >
                <div className="kicker">앨범 #{a.id}</div>
                <div className="title">{a.title}</div>
                <div className="meta">열기 →</div>
              </a>

              {/* ✅ 삭제 버튼은 canAdmin일 때만 */}
              {canAdmin && (
                <DeleteAlbumForm albumId={a.id} title={a.title} redirectTo="/albums?admin=1" />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <span className="small">
            관리자 기능은 <b>?admin=1</b> + <b>관리자 로그인</b>이 모두 필요해요. 로그아웃하면 관리자모드는 자동으로 무력화됩니다.
          </span>
        </div>
      </div>
    </div>
  );
}
