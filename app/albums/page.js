export const dynamic = "force-dynamic";

import AlbumsClient from "./AlbumsClient";

export default function AlbumsPage({ searchParams }) {
  const admin = searchParams?.admin === "1";

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginBottom: 8 }}>앨범</h1>
      <p style={{ opacity: 0.75, marginBottom: 12 }}>
        앨범을 선택해서 사진을 올리고 볼 수 있어요.
      </p>

      <AlbumsClient admin={admin} />
    </div>
  );
}
