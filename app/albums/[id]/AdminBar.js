"use client";

import { useSearchParams } from "next/navigation";
import LogoutButton from "../../components/LogoutButton";

export default function AdminBar({ albumId, isAdminSession }) {
    const sp = useSearchParams();
    const adminParam = sp.get("admin");
    const isAdminMode = adminParam === "1" || adminParam === "true";

    const backTo = `/albums/${albumId}?admin=1`;
    const loginUrl = `/admin?redirectTo=${encodeURIComponent(backTo)}`;

    const canAdmin = isAdminMode && isAdminSession;

    return (
        <div className="row">
            <span className="pill" title="관리자 기능은 모드+로그인이 모두 필요해요">
                <span className={canAdmin ? "dot dotOn" : "dot"} />
                {canAdmin ? "관리자 모드 ON" : isAdminMode ? "로그인 필요" : "관리자 모드 OFF"}
            </span>

            {/* 관리자 모드 켜기: 로그인 안됐으면 로그인으로 */}
            {isAdminSession ? (
                <a className="btn" href={isAdminMode ? `/albums/${albumId}` : backTo}>
                    {isAdminMode ? "모드 끄기" : "관리자 모드 켜기"}
                </a>
            ) : (
                <a className="btn" href={loginUrl}>관리자 모드 켜기(로그인)</a>
            )}

            {/* 로그인/로그아웃 */}
            {isAdminSession ? (
                <LogoutButton redirectTo={`/albums/${albumId}`} />
            ) : (
                <a className="btn" href={loginUrl}>관리자 로그인</a>
            )}

            {/* 앨범 삭제: canAdmin일 때만 */}
            {canAdmin && (
                <form
                    action="/api/albums/delete"
                    method="post"
                    style={{ margin: 0 }}
                    onSubmit={(e) => {
                        if (!confirm("앨범을 삭제할까요?\n(앨범 안의 사진도 전부 삭제됩니다)")) e.preventDefault();
                    }}
                >
                    <input type="hidden" name="albumId" value={albumId} />
                    <input type="hidden" name="redirectTo" value="/albums?admin=1" />
                    <button className="btn btnDanger" type="submit">앨범 삭제</button>
                </form>
            )}
        </div>
    );
}
