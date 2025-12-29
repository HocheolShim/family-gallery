"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AlbumsClient({ isAdmin }) {
  const router = useRouter();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function loadAlbums() {
    setLoading(true);
    try {
      const res = await fetch("/api/albums/list", { cache: "no-store" });
      if (!res.ok) {
        console.error("list failed:", res.status);
        setAlbums([]);
        return;
      }
      const data = await res.json();
      setAlbums(data?.albums || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  async function deleteAlbum(id, title) {
    if (!isAdmin) return;
    if (!confirm(`정말 "${title}" 앨범을 삭제할까요?\n(앨범 목록에서 제거됩니다)`)) return;

    setBusyId(id);
    try {
      const fd = new FormData();
      fd.append("albumId", id);

      const res = await fetch("/api/albums/delete", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        alert(`삭제 실패: ${data?.error || res.status}`);
        return;
      }

      await loadAlbums();
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p style={{ opacity: 0.7 }}>불러오는 중...</p>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {/* ✅ 공용/관리자 모두 앨범 생성 가능
            ✅ Link 클릭이 CSS/오버레이 때문에 씹히는 경우가 있어서 router.push 버튼으로 처리 */}
        <button
          type="button"
          className="btn"
          style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}
          onClick={() => router.push("/albums/new")}
        >
          + 새 앨범
        </button>

        {!isAdmin && (
          <Link className="btn" href="/admin" style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}>
            관리자 로그인
          </Link>
        )}

        <form action="/api/auth/logout" method="post">
          <button
            className="btn"
            type="submit"
            style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}
          >
            로그아웃(공용)
          </button>
        </form>

        {isAdmin && (
          <form action="/api/auth/admin-logout" method="post">
            <button
              className="btn"
              type="submit"
              style={{ pointerEvents: "auto", position: "relative", zIndex: 10 }}
            >
              관리자 로그아웃
            </button>
          </form>
        )}
      </div>

      {albums.length === 0 ? (
        <p style={{ opacity: 0.7 }}>아직 앨범이 없어요.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {albums.map((a) => (
            <div
              key={a.id}
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(0,0,0,0.12)",
              }}
            >
              <Link href={`/albums/${a.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.title}</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{a.createdAt || ""}</div>
              </Link>

              {/* ✅ 삭제는 관리자만 */}
              {isAdmin && (
                <button
                  className="btn"
                  style={{ marginTop: 10, width: "100%", pointerEvents: "auto", position: "relative", zIndex: 10 }}
                  disabled={busyId === a.id}
                  onClick={() => deleteAlbum(a.id, a.title)}
                  type="button"
                >
                  {busyId === a.id ? "삭제 중..." : "앨범 삭제"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
