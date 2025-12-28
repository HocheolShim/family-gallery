"use client";

export default function LogoutButton({ redirectTo = "/albums" }) {
    return (
        <form action="/api/admin/logout" method="post" style={{ margin: 0 }}>
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button className="btn" type="submit">
                로그아웃
            </button>
        </form>
    );
}
