// app/albums/new/page.js
export default async function NewAlbumPage({ searchParams }) {
  const sp = await searchParams; // Vercel 환경: Promise일 수 있음
  const err = sp?.err;

  return (
    <div className="section">
      <div className="sectionHead">
        <div>
          <div className="kicker">
            <a href="/albums" style={{ textDecoration: "none" }}>
              ← 앨범
            </a>
          </div>
          <h2 className="sectionTitle" style={{ marginTop: 8 }}>
            새 앨범 만들기
          </h2>
          <p className="sectionDesc">앨범 이름을 입력하면 새 앨범이 생성돼요.</p>
        </div>
      </div>

      <div className="sectionBody">
        <form action="/api/albums/create" method="post" className="formRow">
          <input type="hidden" name="redirectTo" value="/albums" />
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
