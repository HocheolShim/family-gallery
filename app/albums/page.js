// app/albums/page.js
export const dynamic = "force-dynamic";

import AlbumsClient from "./AlbumsClient";

export default function AlbumsPage({ searchParams }) {
  const admin = searchParams?.admin === "1";

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginBottom: 8 }}>앨범</h1>
      <p style={{ opacity: 0.75, marginBottom: 12 }}>
        앨범을 선택해서 사진을 올리고 볼 수 있어요.
      </p>

      {/* 상단 버튼 영역 */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* 로그아웃 */}
        <form action="/api/auth/logout" method="post">
          <button className="btn" type="submit">
            로그아웃
          </button>
        </form>
      </div>

      {/* 실제 앨범 목록 (Client Component) */}
      <AlbumsClient admin={admin} />
    </div>
  );
}
