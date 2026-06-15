import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/football-api/provider";

export const dynamic = "force-dynamic";

// Public roster lookup for a team — powers the favourite/golden-boot pickers.
export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ players: [] });
  const players = await getProvider().getPlayers(team);
  return NextResponse.json({
    players: players.map((p) => ({ id: p.id, name: p.name, position: p.position })),
  });
}
