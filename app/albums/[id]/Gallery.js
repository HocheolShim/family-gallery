"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Gallery({ albumId, canAdmin = false }) {
    const [keys, setKeys] = useState([]);
    const [open, setOpen] = useState(false);
    const [idx, setIdx] = useState(0);
    const [mounted, setMounted] = useState(false);

    // 줌/팬
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const dragRef = useRef({ on: false, sx: 0, sy: 0, ox: 0, oy: 0 });

    useEffect(() => setMounted(true), []);

    // ✅ R2 목록 조회
    useEffect(() => {
        fetch(`/api/r2/list?albumId=${albumId}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => setKeys(Array.isArray(d.keys) ? d.keys : []));
    }, [albumId]);

    const currentKey = keys[idx];
    const currentSrc = currentKey
        ? `/api/r2/image?key=${encodeURIComponent(currentKey)}`
        : "";

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const resetView = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    const openAt = (i) => {
        setIdx(i);
        setOpen(true);
        resetView();
    };

    const close = () => {
        setOpen(false);
        resetView();
    };

    const prev = () => {
        setIdx((v) => (v - 1 + keys.length) % keys.length);
        resetView();
    };

    const next = () => {
        setIdx((v) => (v + 1) % keys.length);
        resetView();
    };

    if (keys.length === 0) {
        return <p className="small" style={{ marginTop: 12 }}>아직 업로드된 사진이 없어요.</p>;
    }

    const modal = (
        <div
            onMouseDown={(e) => e.target === e.currentTarget && close()}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.94)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <div style={{ padding: 12, color: "#fff" }}>
                {idx + 1} / {keys.length}
                <button onClick={close} style={{ marginLeft: 12 }}>닫기</button>
            </div>

            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                    src={currentSrc}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    draggable={false}
                />
            </div>
        </div>
    );

    return (
        <div style={{ marginTop: 12 }}>
            <div className="photoGrid">
                {keys.map((key, i) => (
                    <div key={key} className="photo">
                        <button
                            type="button"
                            onClick={() => openAt(i)}
                            style={{ padding: 0, border: 0, background: "transparent", width: "100%" }}
                        >
                            <img src={`/api/r2/image?key=${encodeURIComponent(key)}`} />
                        </button>

                        {canAdmin && (
                            <form
                                action="/api/r2/delete-album"
                                method="post"
                                onSubmit={(e) => !confirm("이 사진을 삭제할까요?") && e.preventDefault()}
                            >
                                <input type="hidden" name="albumId" value={albumId} />
                                <button className="btn btnDanger">앨범 전체 삭제</button>
                            </form>
                        )}
                    </div>
                ))}
            </div>

            {mounted && open ? createPortal(modal, document.body) : null}
        </div>
    );
}
