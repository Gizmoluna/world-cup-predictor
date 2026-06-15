import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getProvider } from "@/lib/football-api/provider";

export const dynamic = "force-dynamic";

// A branded, shareable result card (1200×630 PNG) for a match.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const sp = req.nextUrl.searchParams;
  const name = sp.get("name") ?? "";
  const pts = sp.get("pts");
  const tag = sp.get("tag") ?? "";

  const provider = getProvider();
  const [match, teams] = await Promise.all([provider.getMatch(matchId), provider.getTeams()]);
  const byId = new Map(teams.map((t) => [t.id, t]));
  const home = match ? byId.get(match.homeTeamId) : undefined;
  const away = match ? byId.get(match.awayTeamId) : undefined;
  const live = match?.status === "live";
  const finished = match?.status === "full_time";

  const gold = "#ffd34d";
  const bg = "#070b16";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: `radial-gradient(900px 500px at 50% -10%, rgba(255,211,77,0.18), transparent), ${bg}`,
          color: "#eef3ff",
          fontFamily: "sans-serif",
          padding: "60px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>
            ⚽ WORLD CUP <span style={{ color: gold, marginLeft: 10 }}>PREDICTOR</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: live ? "#ff4d6d" : "#8694b5", fontWeight: 700 }}>
            {live ? "● LIVE" : finished ? "FULL-TIME" : "UPCOMING"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
          <Side flag={home?.flagUrl} label={home?.shortName ?? home?.name ?? "TBD"} />
          <div style={{ display: "flex", fontSize: 130, fontWeight: 900, color: "#fff" }}>
            {finished || live ? `${match?.homeScore} : ${match?.awayScore}` : "VS"}
          </div>
          <Side flag={away?.flagUrl} label={away?.shortName ?? away?.name ?? "TBD"} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {name ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 24,
                padding: "18px 36px",
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              <span>{name}</span>
              {pts != null && <span style={{ color: gold }}>{pts} pts</span>}
              {tag && <span style={{ color: "#1fd65f" }}>{tag}</span>}
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 30, color: "#8694b5" }}>Predict every match · beat your friends</div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

function Side({ flag, label }: { flag?: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 280 }}>
      {flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} width={150} height={105} style={{ borderRadius: 12, objectFit: "cover" }} alt="" />
      ) : (
        <div style={{ width: 150, height: 105, borderRadius: 12, background: "#1a2333" }} />
      )}
      <div style={{ display: "flex", fontSize: 44, fontWeight: 900 }}>{label}</div>
    </div>
  );
}
