"use client";

import { useEffect, useState, useTransition } from "react";
import { updateProfile } from "@/app/actions";
import { PICKER_THEMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PlayerPicker } from "./player-picker";
import type { AppUser, Player, Team } from "@/lib/types";

type RosterPlayer = { id: string; name: string; position?: string | null };

const FIELD =
  "h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-base outline-none focus:border-[var(--accent)]";

export function SettingsForm({
  user,
  teams,
  players,
}: {
  user: AppUser;
  teams: Team[];
  players: Player[];
}) {
  const [nationality, setNationality] = useState(user.nationality ?? "");
  const [favouriteTeamId, setFavouriteTeamId] = useState(user.favouriteTeamId ?? "");
  const [favouritePlayerId, setFavouritePlayerId] = useState(user.favouritePlayerId ?? "");
  const [worldCupWinnerPickId, setWorldCupWinnerPickId] = useState(
    user.worldCupWinnerPickId ?? "",
  );
  const [goldenBootPickId, setGoldenBootPickId] = useState(user.goldenBootPickId ?? "");
  const [theme, setTheme] = useState(user.theme);

  // Roster of the chosen favourite team — loaded on demand so the player
  // pickers populate even when there's no global player list (live provider).
  const [roster, setRoster] = useState<RosterPlayer[]>(
    players.map((p) => ({ id: p.id, name: p.name })),
  );
  const [loadingRoster, setLoadingRoster] = useState(false);

  useEffect(() => {
    if (!favouriteTeamId) {
      setRoster([]);
      return;
    }
    let cancelled = false;
    setLoadingRoster(true);
    fetch(`/api/players?team=${encodeURIComponent(favouriteTeamId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRoster(d.players ?? []);
      })
      .catch(() => {
        if (!cancelled) setRoster([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRoster(false);
      });
    return () => {
      cancelled = true;
    };
  }, [favouriteTeamId]);

  const favTeamFlag = teams.find((t) => t.id === favouriteTeamId)?.flagUrl ?? null;

  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      const res = await updateProfile({
        nationality: nationality.trim() || null,
        favouriteTeamId: favouriteTeamId || null,
        favouritePlayerId: favouritePlayerId || null,
        worldCupWinnerPickId: worldCupWinnerPickId || null,
        goldenBootPickId: goldenBootPickId || null,
        theme,
      });
      if (res.ok) {
        setMessage({ ok: true, text: "Saved! Your profile is up to date." });
      } else {
        setMessage({ ok: false, text: res.error ?? "Something went wrong." });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Colour theme */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted">Colour</label>
        <div className="grid grid-cols-5 gap-2">
          {PICKER_THEMES.map((t) => {
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                title={t.label}
                aria-label={t.label}
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl transition active:scale-90",
                  active ? "ring-2 ring-white" : "opacity-85",
                )}
                style={{ background: t.accent }}
              >
                {active && <span className="text-black">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nationality */}
      <div className="flex flex-col gap-2">
        <label htmlFor="nationality" className="text-xs font-bold uppercase tracking-widest text-muted">
          Nationality
        </label>
        <input
          id="nationality"
          type="text"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          placeholder="e.g. Colombia"
          className={FIELD}
        />
      </div>

      {/* Favourite team */}
      <div className="flex flex-col gap-2">
        <label htmlFor="fav-team" className="text-xs font-bold uppercase tracking-widest text-muted">
          Favourite team
        </label>
        <select
          id="fav-team"
          value={favouriteTeamId}
          onChange={(e) => setFavouriteTeamId(e.target.value)}
          className={FIELD}
        >
          <option value="">— None —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Favourite player */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted">
          Favourite player {loadingRoster && <span className="text-muted">· loading…</span>}
        </label>
        <PlayerPicker
          players={roster.map((p) => ({ ...p, flagUrl: favTeamFlag }))}
          value={favouritePlayerId}
          onChange={setFavouritePlayerId}
          placeholder={favouriteTeamId ? "Pick a player" : "Pick a favourite team first"}
        />
      </div>

      {/* World Cup winner pick */}
      <div className="flex flex-col gap-2">
        <label htmlFor="wc-winner" className="text-xs font-bold uppercase tracking-widest text-muted">
          World Cup winner pick
        </label>
        <select
          id="wc-winner"
          value={worldCupWinnerPickId}
          onChange={(e) => setWorldCupWinnerPickId(e.target.value)}
          className={FIELD}
        >
          <option value="">— None —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Golden Boot pick */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted">
          Golden Boot pick <span className="text-muted">· from your favourite team</span>
        </label>
        <PlayerPicker
          players={roster.map((p) => ({ ...p, flagUrl: favTeamFlag }))}
          value={goldenBootPickId}
          onChange={setGoldenBootPickId}
          placeholder={favouriteTeamId ? "Pick a player" : "Pick a favourite team first"}
        />
      </div>

      {message && (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-semibold",
            message.ok ? "bg-pitch/20 text-pitch" : "bg-danger/20 text-danger",
          )}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="h-14 w-full rounded-2xl bg-[var(--accent)] text-base font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
