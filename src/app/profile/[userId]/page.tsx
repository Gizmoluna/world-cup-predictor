import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/data";
import { getReadModel } from "@/lib/aggregate";
import { getBadge } from "@/lib/scoring/badges";
import { getCurrentUser } from "@/lib/session";
import { friendState, getFriendIds, getIncomingRequests } from "@/lib/friends";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamFlag } from "@/components/team-flag";
import { FriendButton } from "@/components/friend-button";
import { FriendRequests } from "@/components/friend-requests";
import { LevelBar } from "@/components/level-bar";
import { AchievementsGrid } from "@/components/achievements-grid";
import { computeAchievements } from "@/lib/achievements";
import { THEMES, DEFAULT_THEME, rival } from "@/lib/constants";
import { chrome } from "@/lib/display";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-surface-2 p-3">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
      <span className={cn("text-lg font-black", tone)}>{value}</span>
    </div>
  );
}

function PickRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right text-sm font-semibold">
        {children}
      </span>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getUser(userId);
  if (!user) notFound();

  const model = await getReadModel();
  const row = model.leaderboard.find((r) => r.user.id === user.id);

  const theme = THEMES[user.theme] ?? THEMES[DEFAULT_THEME];
  const r = rival(user.id);
  const userFlag = chrome(user).flag;

  const favTeam = user.favouriteTeamId ? model.teamById.get(user.favouriteTeamId) : undefined;
  const favPlayer = user.favouritePlayerId
    ? model.playerById.get(user.favouritePlayerId)
    : undefined;
  const winnerTeam = user.worldCupWinnerPickId
    ? model.teamById.get(user.worldCupWinnerPickId)
    : undefined;
  const bootPlayer = user.goldenBootPickId
    ? model.playerById.get(user.goldenBootPickId)
    : undefined;

  const played = row?.played ?? 0;
  const exactScores = row?.exactScores ?? 0;
  const streak = row?.currentStreak ?? 0;
  const accuracy = played > 0 ? Math.round((exactScores / played) * 100) : 0;

  const uniqueBadges = Array.from(new Set(row?.badges ?? []));

  const achievements = computeAchievements({
    points: row?.points ?? 0,
    played: row?.played ?? 0,
    exactScores: row?.exactScores ?? 0,
    perfectPicks: row?.perfectPicks ?? 0,
    matchWins: row?.matchWins ?? 0,
    currentStreak: row?.currentStreak ?? 0,
    groupCorrect: row?.groupCorrect ?? 0,
    knockoutPoints: row?.knockoutPoints ?? 0,
    winnings: row?.winnings ?? 0,
  });

  // Friends
  const viewer = await getCurrentUser();
  const isSelf = viewer?.id === user.id;
  const friendIds = await getFriendIds(user.id);
  const friends = (await Promise.all(friendIds.map((id) => getUser(id)))).filter(
    (u): u is NonNullable<typeof u> => Boolean(u),
  );
  const state = viewer && !isSelf ? await friendState(viewer.id, user.id) : "none";
  const incomingIds = isSelf && viewer ? await getIncomingRequests(viewer.id) : [];
  const incoming = (await Promise.all(incomingIds.map((id) => getUser(id))))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => ({ id: u.id, name: u.name, flag: chrome(u).flag }));

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl text-4xl shadow-lg"
            style={{ background: theme.gradient }}
          >
            {userFlag}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black">{user.name}</h1>
            <p className="text-sm text-muted">
              {user.nationality ?? r?.nationality ?? "—"}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge tone="accent">{friends.length} friend{friends.length === 1 ? "" : "s"}</Badge>
              {viewer && !isSelf && <FriendButton targetId={user.id} state={state} />}
            </div>
          </div>
        </div>

        {/* Friend requests (own profile) */}
        {isSelf && incoming.length > 0 && (
          <Card className="flex flex-col gap-3">
            <CardTitle>Friend requests ({incoming.length})</CardTitle>
            <FriendRequests requests={incoming} />
          </Card>
        )}

        {/* Friends list */}
        {friends.length > 0 && (
          <Card className="flex flex-col gap-2">
            <CardTitle>Friends</CardTitle>
            <div className="flex flex-wrap gap-2">
              {friends.map((f) => (
                <Link
                  key={f.id}
                  href={`/profile/${f.id}`}
                  className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-bold"
                >
                  {chrome(f).flag} {f.name}
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Picks */}
        <Card className="flex flex-col gap-1">
          <CardTitle>Picks</CardTitle>
          <div className="mt-1 divide-y divide-border">
            <PickRow label="Favourite team">
              {favTeam ? (
                <>
                  <TeamFlag team={favTeam} size={22} />
                  <span className="truncate">{favTeam.name}</span>
                </>
              ) : (
                <span className="text-muted">Not set</span>
              )}
            </PickRow>
            <PickRow label="Favourite player">
              {favPlayer ? favPlayer.name : <span className="text-muted">Not set</span>}
            </PickRow>
            <PickRow label="World Cup winner">
              {winnerTeam ? (
                <>
                  <TeamFlag team={winnerTeam} size={22} />
                  <span className="truncate">{winnerTeam.name}</span>
                </>
              ) : (
                <span className="text-muted">Not set</span>
              )}
            </PickRow>
            <PickRow label="Golden Boot">
              {bootPlayer ? bootPlayer.name : <span className="text-muted">Not set</span>}
            </PickRow>
          </div>
        </Card>

        {/* Level / XP */}
        <LevelBar points={row?.points ?? 0} />

        {/* Achievements */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Achievements</CardTitle>
          <AchievementsGrid achievements={achievements} />
        </Card>

        {/* Prediction stats */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Prediction stats</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Points" value={String(row?.points ?? 0)} tone="text-gold" />
            <Stat label="Played" value={String(played)} />
            <Stat
              label="W–D–L"
              value={`${row?.matchWins ?? 0}–${row?.matchDraws ?? 0}–${row?.matchLosses ?? 0}`}
            />
            <Stat label="Exact scores" value={String(exactScores)} tone="text-pitch" />
            <Stat label="Perfect picks" value={String(row?.perfectPicks ?? 0)} tone="text-pitch" />
            <Stat
              label="Streak"
              value={
                streak >= 2
                  ? `🔥 ${streak}`
                  : streak <= -2
                    ? `🥶 ${streak}`
                    : String(streak)
              }
              tone={streak >= 2 ? "text-pitch" : streak <= -2 ? "text-danger" : undefined}
            />
            <Stat label="Confidence acc." value={`${row?.avgConfidenceAccuracy ?? 0}%`} />
            <Stat label="Accuracy" value={`${accuracy}%`} />
          </div>
        </Card>

        {/* Trophy cabinet */}
        <Card className="flex flex-col gap-3">
          <CardTitle>Trophy cabinet</CardTitle>
          {uniqueBadges.length === 0 ? (
            <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">
              No badges yet. Nail an exact score to start the collection. 🏆
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {uniqueBadges.map((id) => {
                const b = getBadge(id);
                if (!b) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl bg-surface-2 p-3"
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{b.name}</p>
                      <p className="text-[11px] uppercase tracking-wide text-muted">{b.rarity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
