// app/albums/new/page.js
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewAlbumPage({ searchParams }) {
  const err = searchParams?.err;

  return (
    <div className="section">
      <div className="sectionHead">
        <div className="kicker">
          <Link href="/albums" style={{ textDecoration: "none" }}>← 앨범</Link>
        </div>
        <h2 className="sectionTitle" style={{ marginTop: 8 }}>새 앨범 만들기</h2>
        <p className="sectionDesc">앨범 이름을 입력하면 새 앨범이 생성돼요.</p>
      </div>

      <div className="sectionBody">
        <form action="/api/albums/create" method="post" className="formRow">
          <input
            className="input"
            name="title"
            placeholder="예) 2025 여름휴가"
            required
          />
          {/* ✅ 중요: 일반 유저 기준 redirect */}
          <input type="hidden" name="redirectTo" value="/albums" />
          <button className="btn btnPrimary" type="submit">생성</button>
        </form>

        {err && (
          <p style={{ marginTop: 12, color: "crimson" }}>
            앨범 생성 실패: {String(err)}
          </p>
        )}

        <p className="small" style={{ marginTop: 12 }}>
          생성 후 자동으로 앨범 목록으로 이동합니다.
        </p>
      </div>
    </div>
  );
}
