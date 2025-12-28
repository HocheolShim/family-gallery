import { headers } from "next/headers";

async function getAlbums() {
  const h = headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(
    `${protocol}://${host}/api/albums/list`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    console.error("getAlbums failed:", res.status);
    return [];
  }

  const data = await res.json();
  return data?.albums || [];
}
