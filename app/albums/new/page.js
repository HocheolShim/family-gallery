// app/albums/new/page.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";

export default async function NewAlbumPage({ searchParams }) {
  // ✅ 기본은 일반 사용자 기준
  const redirectTo = "/albums";

  const err = searchParams?.err;

  return (
    <div className="section">
      <div className="sectionHead">
        <div className="kicker">
          <Link href="/albums" style={{ textDecoration: "none" }}>
            ← 앨범
          </Link>
        </div>
        <h2 className="sectionTitle" style={{ marginTop: 8 }}>
          새 앨범 만들기
        </h2>
        <p className="sectionDesc">앨범 이름을 입력하면 새 앨범이 생성돼요.</p>
      </div>

      <div className="sectionBody">
        <form action="/api/albums/create" method="post" className="formRow">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <input
            className="input"
            name="title"
            placeholder="예) 2025 여름휴가"
            required
          />
          <button className="btn btnPrimary" type="submit">
            생성
          </button>
        </form>

        {err && (
          <p style={{ marginTop: 12, color: "crimson" }}>
            앨범 생성에 실패했어요. 다시 시도해줘.
          </p>
        )}

        <p className="small" style={{ marginTop: 12 }}>
          생성 후 자동으로 앨범 목록 페이지로 이동합니다.
        </p>
      </div>
    </div>
  );
}
