// app/enter/page.js
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function EnterPage() {
    async function onSubmit(formData) {
        "use server";

        // ✅ input name="pass" 이므로 pass로 받기
        const pass = formData.get("pass")?.toString();

        // ✅ API 라우트는 상대경로로 호출 (BASE_URL 불필요)
        const res = await fetch("/api/auth/family", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pass }),
            cache: "no-store",
        });

        const data = await res.json().catch(() => ({}));

        // ✅ 실패 처리 (원하면 쿼리로 에러 표시)
        if (!res.ok || !data?.ok) {
            redirect("/enter?err=1");
        }

        // ✅ 성공하면 앨범으로
        redirect("/albums");
    }

    return (
        <main style={{ maxWidth: 420, margin: "60px auto", fontFamily: "sans-serif" }}>
            <h1>가족 사진관</h1>
            <p>공용 비밀번호를 입력하세요.</p>

            {/* ✅ 서버 액션 연결 */}
            <form action={onSubmit}>
                <input
                    name="pass"
                    type="password"
                    placeholder="예: 0531"
                    style={{ width: "100%", padding: 12, fontSize: 16 }}
                    required
                />
                <button type="submit" style={{ width: "100%", marginTop: 12, padding: 12, fontSize: 16 }}>
                    입장
                </button>
            </form>

            <p style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
                * 비밀번호를 아는 사람만 열람/업로드 가능해요.
            </p>
        </main>
    );
}
