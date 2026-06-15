import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Giphy search proxy — keeps the API key server-side.
// Set GIPHY_API_KEY (free at developers.giphy.com).
export async function GET(req: NextRequest) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "GIF search not configured", gifs: [] });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const base = q
    ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(q)}&limit=24&rating=pg-13&bundle=messaging_non_clips`
    : `https://api.giphy.com/v1/gifs/trending?limit=24&rating=pg-13&bundle=messaging_non_clips`;

  try {
    const res = await fetch(`${base}&api_key=${key}`, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ ok: false, error: `giphy ${res.status}`, gifs: [] });
    const json = await res.json();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const gifs = (json.data ?? []).map((g: any) => ({
      id: g.id,
      preview: g.images?.fixed_width_small?.url ?? g.images?.preview_gif?.url,
      url: g.images?.fixed_height?.url ?? g.images?.downsized_medium?.url ?? g.images?.original?.url,
    })).filter((g: { url?: string }) => g.url);
    return NextResponse.json({ ok: true, gifs });
  } catch {
    return NextResponse.json({ ok: false, error: "giphy error", gifs: [] });
  }
}
