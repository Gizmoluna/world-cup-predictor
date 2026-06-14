"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/actions";
import { THEMES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AppUser, Player, Team } from "@/lib/types";

const FIELD =
  "h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-base outline-none focus:border-[var(--accent)]";

const THEME_KEYS: { key: string; label: string }[] = [
  { key: "carina", label: "Carina 🇨🇴" },
  { key: "johnny", label: "Johnny 🇮🇪" },
];

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
      {/* Theme */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted">Theme</label>
        <div className="grid grid-cols-2 gap-2">
          {THEME_KEYS.map((t) => {
            const active = theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                className={cn(
                  "h-16 rounded-2xl border-2 text-base font-extrabold text-black transition active:scale-[0.98]",
                  active ? "border-white shadow-lg" : "border-transparent opacity-80",
                )}
                style={{ background: THEMES[t.key]?.gradient }}
              >
                {t.label}
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
        <label htmlFor="fav-player" className="text-xs font-bold uppercase tracking-widest text-muted">
          Favourite player
        </label>
        <select
          id="fav-player"
          value={favouritePlayerId}
          onChange={(e) => setFavouritePlayerId(e.target.value)}
          className={FIELD}
        >
          <option value="">— None —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
        <label htmlFor="golden-boot" className="text-xs font-bold uppercase tracking-widest text-muted">
          Golden Boot pick
        </label>
        <select
          id="golden-boot"
          value={goldenBootPickId}
          onChange={(e) => setGoldenBootPickId(e.target.value)}
          className={FIELD}
        >
          <option value="">— None —</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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
