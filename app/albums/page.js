// app/albums/page.js
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import AlbumsClient from "./AlbumsClient";

export default async function AlbumsPage() {
  const c = await cookies(); // ✅ Next 16에서 Promise일 수 있음
  const authed = c.get("fg_auth")?.value === "1";
  const isAdmin = c.get("fg_admin")?.value === "1";

  if (!authed) {
    return (
      <div style={{ padding: 18 }}>
        <h1>앨범</h1>
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 8 }}>앨범</h1>
          <p style={{ opacity: 0.75, marginBottom: 12 }}>앨범을 선택해서 사진을 올리고 볼 수 있어요.</p>
        </div>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(0,0,0,0.15)",
            fontSize: 12,
            opacity: 0.9,
          }}
        >
          모드: <b>{isAdmin ? "관리자" : "공용"}</b>
        </div>
      </div>

      <AlbumsClient isAdmin={isAdmin} />
    </div>
  );
}
