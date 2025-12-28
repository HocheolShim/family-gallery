// app/albums/page.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { headers } from "next/headers";

function getBaseUrl() {
  // 1) 직접 지정한 값이 있으면 최우선
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL;
  if (fromEnv && fromEnv.startsWith("http")) return fromEnv;

  // 2) Vercel 환경이면 자동으로 생성
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 3) 런타임 요청 헤더 기반으로 생성 (Preview/커스텀 도메인에서도 안전)
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;

  // 4) 로컬 fallback
  return "http://localhost:3000";
}

async function getAlbums() {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/albums/list`, {
    cache: "no-store",
  });

  if (!res.ok) {
    // 서버 로그에서 원인 확인 가능
    console.error("getAlbums failed:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data?.albums || [];
}

export default async function AlbumsPage({ searchParams }) {
  const albums = await getAlbums();
  const admin = searchParams?.admin === "1";

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginBottom: 8 }}>앨범</h1>
      <p style={{ opacity: 0.75, marginBottom: 12 }}>
        앨범을 선택해서 사진을 올리고 볼 수 있어요.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <Link className="btn" href={admin ? "/albums/new?admin=1" : "/albums/new"}>
          + 새 앨범
        </Link>

        <Link className="btn" href="/admin">
          관리자 로그인
        </Link>

        {admin ? (
          <Link className="btn" href="/albums">
            관리자 모드 끄기
          </Link>
        ) : (
          <Link className="btn" href="/albums?admin=1">
            관리자 모드 켜기(로그인)
          </Link>
        )}
      </div>

      {albums.length === 0 ? (
        <p style={{ opacity: 0.7 }}>아직 앨범이 없어요.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 12,
          }}
        >
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
