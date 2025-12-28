import { headers } from "next/headers";

async function getAlbums() {
  const h = await headers();

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (!host) {
    console.error("getAlbums failed: missing host header");
    return [];
  }

  const url = `${proto}://${host}/api/albums/list`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    console.error("getAlbums failed:", res.status, "url:", url);
    return [];
  }

  const data = await res.json();
  return data?.albums || [];
}
