"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Lock } from "lucide-react";
import type { Match, Player, Prediction, Team } from "@/lib/types";
import { Button } from "./ui/button";
import { savePredictionAction } from "@/app/actions";
import { cn } from "@/lib/utils";

interface Props {
  match: Match;
  home: Team;
  away: Team;
  homePlayers: Player[];
  awayPlayers: Player[];
  userId: string;
  existing: Prediction | null;
}

const isKnockout = (m: Match) => m.stage !== "group";

export function PredictionForm({
  match,
  home,
  away,
  homePlayers,
  awayPlayers,
  userId,
  existing,
}: Props) {
  const [p, setP] = useState<Prediction>(
    existing ?? {
      userId,
      matchId: match.id,
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      confidenceMultiplier: 1,
      wagerAmount: 50,
    },
  );
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const allPlayers = [...homePlayers, ...awayPlayers];
  const set = (patch: Partial<Prediction>) => setP((prev) => ({ ...prev, ...patch }));

  function save() {
    setMsg(null);
    start(async () => {
      const res = await savePredictionAction(p);
      setMsg(res.ok ? { ok: true, text: "Locked in. Good luck 🍀" } : { ok: false, text: res.error });
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* Scoreline */}
      <Section title="Full-time score" hint="Exact +5 · Result +2 · GD/Total +1">
        <div className="flex items-center justify-center gap-4">
          <Stepper
            label={home.shortName}
            value={p.predictedHomeScore ?? 0}
            onChange={(v) => set({ predictedHomeScore: v })}
          />
          <span className="text-3xl font-black text-muted">–</span>
          <Stepper
            label={away.shortName}
            value={p.predictedAwayScore ?? 0}
            onChange={(v) => set({ predictedAwayScore: v })}
          />
        </div>
      </Section>

      <Section title="Half-time score" hint="optional">
        <div className="flex items-center justify-center gap-4">
          <Stepper
            label={home.shortName}
            value={p.predictedHalfTimeHomeScore ?? 0}
            onChange={(v) => set({ predictedHalfTimeHomeScore: v })}
          />
          <span className="text-3xl font-black text-muted">–</span>
          <Stepper
            label={away.shortName}
            value={p.predictedHalfTimeAwayScore ?? 0}
            onChange={(v) => set({ predictedHalfTimeAwayScore: v })}
          />
        </div>
      </Section>

      <Section title="First team to score" hint="+1">
        <ChipGroup
          value={p.firstTeamToScoreId ?? null}
          options={[
            { value: home.id, label: home.shortName },
            { value: "none", label: "No goals" },
            { value: away.id, label: away.shortName },
          ]}
          onChange={(v) => set({ firstTeamToScoreId: v })}
        />
      </Section>

      <Section title="Both teams to score?" hint="+1">
        <YesNo value={p.bothTeamsToScore ?? null} onChange={(v) => set({ bothTeamsToScore: v })} />
      </Section>

      <Section title="Clean sheet" hint="+1">
        <ChipGroup
          value={p.cleanSheetTeamId ?? null}
          options={[
            { value: home.id, label: home.shortName },
            { value: "none", label: "Neither" },
            { value: away.id, label: away.shortName },
          ]}
          onChange={(v) => set({ cleanSheetTeamId: v === "none" ? null : v })}
        />
      </Section>

      <Section title="First goal scorer" hint="+4">
        <PlayerSelect
          players={allPlayers}
          value={p.firstGoalScorerId ?? ""}
          onChange={(v) => set({ firstGoalScorerId: v || null })}
          home={home}
          away={away}
        />
      </Section>

      <Section title="Anytime goal scorer" hint="+2">
        <PlayerSelect
          players={allPlayers}
          value={p.anytimeGoalScorerId ?? ""}
          onChange={(v) => set({ anytimeGoalScorerId: v || null })}
          home={home}
          away={away}
        />
      </Section>

      <Section title="Player of the match" hint="+3">
        <PlayerSelect
          players={allPlayers}
          value={p.playerOfMatchId ?? ""}
          onChange={(v) => set({ playerOfMatchId: v || null })}
          home={home}
          away={away}
        />
      </Section>

      <Section title="Yellow card for…" hint="+1 · optional">
        <PlayerSelect
          players={allPlayers}
          value={p.yellowCardPlayerId ?? ""}
          onChange={(v) => set({ yellowCardPlayerId: v || null })}
          home={home}
          away={away}
        />
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section title="Red card?" hint="+3">
          <YesNo value={p.redCardExpected ?? null} onChange={(v) => set({ redCardExpected: v })} />
        </Section>
        <Section title="Penalty?" hint="+2">
          <YesNo value={p.penaltyExpected ?? null} onChange={(v) => set({ penaltyExpected: v })} />
        </Section>
        <Section title="VAR drama?" hint="+1">
          <YesNo value={p.varDramaExpected ?? null} onChange={(v) => set({ varDramaExpected: v })} />
        </Section>
        {isKnockout(match) && (
          <Section title="Extra time?" hint="+1">
            <YesNo value={p.extraTimeExpected ?? null} onChange={(v) => set({ extraTimeExpected: v })} />
          </Section>
        )}
      </div>

      {isKnockout(match) && (
        <Section title="Penalty shootout winner" hint="+3 · if it goes to pens">
          <ChipGroup
            value={p.shootoutWinnerTeamId ?? null}
            options={[
              { value: home.id, label: home.shortName },
              { value: away.id, label: away.shortName },
            ]}
            onChange={(v) => set({ shootoutWinnerTeamId: v })}
          />
        </Section>
      )}

      <Section title="💵 Wager" hint="$100 to stake · exact 3× · result 1.8×">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-3xl font-black text-pitch">${p.wagerAmount ?? 0}</span>
          <span className="text-xs text-muted">
            win ${Math.round((p.wagerAmount ?? 0) * 1.8)}–${(p.wagerAmount ?? 0) * 3}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={p.wagerAmount ?? 0}
          onChange={(e) => set({ wagerAmount: Number(e.target.value) })}
          className="w-full accent-pitch"
        />
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[0, 25, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => set({ wagerAmount: v })}
              className={cn(
                "rounded-lg py-2 text-xs font-bold transition active:scale-95",
                (p.wagerAmount ?? 0) === v ? "bg-pitch text-black" : "bg-white/8",
              )}
            >
              {v === 100 ? "All in" : `$${v}`}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Confidence boost" hint="multiplies this match · once per round">
        <ChipGroup
          value={String(p.confidenceMultiplier ?? 1)}
          options={[
            { value: "1", label: "1×" },
            { value: "2", label: "2×" },
            { value: "3", label: "3×" },
          ]}
          onChange={(v) => set({ confidenceMultiplier: Number(v) as 1 | 2 | 3 })}
        />
      </Section>

      <Section title="Upset alert 💣" hint="bonus if your underdog wins">
        <YesNo value={p.upsetAlert ?? null} onChange={(v) => set({ upsetAlert: v })} />
      </Section>

      <Section title="Heart pick ❤️ / Head pick 🧠" hint="just for fun">
        <input
          className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Heart says…"
          value={p.heartPick ?? ""}
          onChange={(e) => set({ heartPick: e.target.value })}
        />
        <input
          className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Head says…"
          value={p.headPick ?? ""}
          onChange={(e) => set({ headPick: e.target.value })}
        />
      </Section>

      {msg && (
        <p className={cn("text-center text-sm font-bold", msg.ok ? "text-pitch" : "text-danger")}>
          {msg.text}
        </p>
      )}

      {/* Sticky save */}
      <div className="fixed inset-x-0 bottom-[64px] z-40 mx-auto max-w-xl px-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={save}
        >
          <Lock size={18} />
          {pending ? "Saving…" : existing ? "Update prediction" : "Lock in prediction"}
        </Button>
      </div>
    </div>
  );
}

// --- controls -------------------------------------------------------------

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-bold">{title}</h3>
        {hint && <span className="text-[10px] uppercase tracking-wide text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-bold uppercase text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 active:scale-90"
        >
          <Minus size={18} />
        </button>
        <span className="w-10 text-center text-3xl font-black tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(15, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-black active:scale-90"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

function ChipGroup({
  value,
  options,
  onChange,
}: {
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl py-3 text-sm font-bold transition active:scale-95",
            value === o.value ? "bg-[var(--accent)] text-black" : "bg-white/8 text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onChange(true)}
        className={cn(
          "rounded-xl py-3 text-sm font-bold transition active:scale-95",
          value === true ? "bg-pitch text-black" : "bg-white/8",
        )}
      >
        Yes
      </button>
      <button
        onClick={() => onChange(false)}
        className={cn(
          "rounded-xl py-3 text-sm font-bold transition active:scale-95",
          value === false ? "bg-danger text-white" : "bg-white/8",
        )}
      >
        No
      </button>
    </div>
  );
}

function PlayerSelect({
  players,
  value,
  onChange,
  home,
  away,
}: {
  players: Player[];
  value: string;
  onChange: (v: string) => void;
  home: Team;
  away: Team;
}) {
  const homeP = players.filter((p) => p.teamId === home.id);
  const awayP = players.filter((p) => p.teamId === away.id);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border border-border bg-surface-2 px-4 py-3.5 text-base font-semibold outline-none focus:border-[var(--accent)]"
    >
      <option value="">— Pick a player —</option>
      <optgroup label={home.name}>
        {homeP.map((pl) => (
          <option key={pl.id} value={pl.id}>{pl.name}</option>
        ))}
      </optgroup>
      <optgroup label={away.name}>
        {awayP.map((pl) => (
          <option key={pl.id} value={pl.id}>{pl.name}</option>
        ))}
      </optgroup>
    </select>
  );
}
