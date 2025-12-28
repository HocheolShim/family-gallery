// app/albums/page.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { headers } from "next/headers";

async function getAlbums() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (!host) return [];

  const res = await fetch(`${proto}://${host}/api/albums/list`, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  return data?.albums || [];
}

export default async function Page({ searchParams }) {
  const albums = await getAlbums();
  const admin = searchParams?.admin === "1";

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginBottom: 8 }}>앨범</h1>
      <p style={{ opacity: 0.75, marginBottom: 12 }}>
        앨범을 선택해서 사진을 올리고 볼 수 있어요.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Link className="btn" href={admin ? "/albums/new?admin=1" : "/albums/new"}>
          + 새 앨범
        </Link>

        <Link className="btn" href="/admin">관리자 로그인</Link>

        {admin ? (
          <Link className="btn" href="/albums">관리자 모드 끄기</Link>
        ) : (
          <Link className="btn" href="/albums?admin=1">관리자 모드 켜기(로그인)</Link>
        )}
      </div>

      {albums.length === 0 ? (
        <p style={{ opacity: 0.7 }}>아직 앨범이 없어요.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {albums.map((a) => (
            <Link
              key={a.id}
              href={`/albums/${a.id}${admin ? "?admin=1" : ""}`}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 14,
                textDecoration: "none",
                display: "block",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.title}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{a.createdAt || ""}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
