// app/login/page.js
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
    const next = typeof searchParams?.next === "string" ? searchParams.next : "/albums";
    const err = searchParams?.err;

    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
            <div
                style={{
                    width: "min(420px, 100%)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 16,
                    padding: 18,
                    backdropFilter: "blur(10px)",
                }}
            >
                <h1 style={{ margin: "0 0 8px", fontSize: 26 }}>가족 갤러리</h1>
                <p style={{ margin: "0 0 14px", opacity: 0.75 }}>
                    공용 비밀번호를 입력하면 앨범으로 들어갈 수 있어요.
                </p>

                {err ? (
                    <p style={{ margin: "0 0 10px", color: "salmon" }}>
                        비밀번호가 올바르지 않아요.
                    </p>
                ) : null}

                <form action="/api/auth/login" method="post" style={{ display: "grid", gap: 10 }}>
                    <input type="hidden" name="next" value={next} />
                    <input
                        name="password"
                        type="password"
                        placeholder="공용 비밀번호"
                        required
                        style={{
                            padding: "12px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(0,0,0,0.25)",
                            color: "white",
                            outline: "none",
                        }}
                    />
                    <button
                        type="submit"
                        className="btn"
                        style={{ padding: "10px 12px", borderRadius: 12 }}
                    >
                        들어가기
                    </button>
                </form>

                <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
                    * 이 비밀번호는 가족 공용입니다.
                </div>
            </div>
        </div>
    );
}
