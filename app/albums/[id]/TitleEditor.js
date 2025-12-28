"use client";

import { useState } from "react";

export default function TitleEditor({ albumId, initialTitle, canAdmin }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(initialTitle || "");

    if (!canAdmin) return null;

    return (
        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={() => setOpen((v) => !v)}>
                {open ? "취소" : "이름 바꾸기"}
            </button>

            {open && (
                <form action="/api/albums/rename" method="post" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input type="hidden" name="albumId" value={albumId} />
                    <input type="hidden" name="redirectTo" value={`/albums/${albumId}?admin=1`} />
                    <input className="input" name="title" value={value} onChange={(e) => setValue(e.target.value)} placeholder="앨범 제목" required />
                    <button className="btn btnPrimary" type="submit">저장</button>
                </form>
            )}
        </div>
    );
}
