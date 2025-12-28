"use client";

export default function DeleteAlbumForm({ albumId, title, redirectTo = "/albums?admin=1" }) {
    return (
        <form
            action="/api/albums/delete"
            method="post"
            style={{ position: "absolute", top: 12, right: 12, margin: 0 }}
            onSubmit={(e) => {
                if (!confirm(`앨범을 삭제할까요?\n"${title}"\n(앨범 안 사진도 전부 삭제됩니다)`)) {
                    e.preventDefault();
                }
            }}
        >
            <input type="hidden" name="albumId" value={albumId} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <button className="btn btnDanger" type="submit" style={{ padding: "8px 10px" }}>
                삭제
            </button>
        </form>
    );
}
