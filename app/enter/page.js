export default function EnterPage() {
    async function onSubmit(formData) {
        "use server";
        const pass = formData.get("passcode");
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/auth/family`, {
            method: "POST",
            body: JSON.stringify({ pass }),
            headers: { "Content-Type": "application/json" },
        });
    }

    return (
        <main style={{ maxWidth: 420, margin: "60px auto", fontFamily: "sans-serif" }}>
            <h1>가족 사진관</h1>
            <p>공용 비밀번호를 입력하세요.</p>

            <form action="/api/auth/family" method="post">
                <input
                    name="pass"
                    type="password"
                    placeholder="예: 0531"
                    style={{ width: "100%", padding: 12, fontSize: 16 }}
                    required
                />
                <button style={{ width: "100%", marginTop: 12, padding: 12, fontSize: 16 }}>
                    입장
                </button>
            </form>

            <p style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
                * 비밀번호를 아는 사람만 열람/업로드 가능해요.
            </p>
        </main>
    );
}
