export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const sp = await searchParams; // ✅ Next 최신: Promise일 수 있음
  const redirectTo = sp?.redirectTo || "/albums";
  const err = sp?.err;

  return (
    <main style={{ maxWidth: 520, margin: "50px auto", fontFamily: "sans-serif", padding: "0 14px" }}>
      <a href="/albums" style={{ textDecoration: "none" }}>← 앨범으로</a>

      <h1 style={{ marginTop: 12 }}>관리자 로그인</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        관리자만 사진 삭제, 앨범 삭제, 제목 변경이 가능해요.
      </p>

      <div style={{ marginTop: 16, padding: 14, border: "1px solid #ddd", borderRadius: 12, background: "#fafafa" }}>
        {/* ✅ 핵심: action=/api/admin/login, method=post */}
        <form action="/api/admin/login" method="post" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="password"
            name="password"
            placeholder="관리자 비밀번호"
            required
            style={{
              flex: "1 1 240px",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontSize: 16,
            }}
          />

          {/* ✅ 핵심: 로그인 후 돌아갈 주소 */}
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            로그인
          </button>
        </form>

        {err && (
          <p style={{ marginTop: 12, color: "crimson" }}>
            비밀번호가 올바르지 않습니다.
          </p>
        )}

        <p style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
          로그인 성공 시 <b>{redirectTo}</b> 로 돌아갑니다.
        </p>
      </div>
    </main>
  );
}
