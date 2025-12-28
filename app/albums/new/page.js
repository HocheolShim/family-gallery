// app/albums/new/page.js
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewAlbumPage({ searchParams }) {
  const isAdmin = searchParams?.admin === "1";

  return (
    <div style={{ padding: 18, maxWidth: 520 }}>
      <h1 style={{ marginBottom: 12 }}>새 앨범 만들기</h1>

      <form action="/api/albums/create" method="post">
        <label style={{ display: "block", marginBottom: 8 }}>
          앨범 이름
        </label>

        <input
          type="text"
          name="title"
          placeholder="예) 2025 가족여행"
          required
          maxLength={80}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 12,
          }}
        />

        {/* ✅ 생성 후 돌아갈 위치
            - 관리자면 admin=1 유지
            - 일반 사용자는 /albums
        */}
        <input
          type="hidden"
          name="redirectTo"
          value={isAdmin ? "/albums?admin=1" : "/albums"}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            className="btn"
            style={{ padding: "10px 14px" }}
          >
            생성
          </button>

          <Link
            href={isAdmin ? "/albums?admin=1" : "/albums"}
            className="btn"
          >
            취소
          </Link>
        </div>
      </form>

      {/* 안내 텍스트 */}
      {!isAdmin && (
        <p style={{ marginTop: 14, fontSize: 13, opacity: 0.7 }}>
          ※ 앨범 생성은 누구나 가능하며, 삭제는 관리자만 할 수 있습니다.
        </p>
      )}
    </div>
  );
}
