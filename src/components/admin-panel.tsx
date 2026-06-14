"use client";

import { useState } from "react";

interface ExportPrediction {
  userId: string;
  matchId: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  predictedWinnerTeamId: string | null;
  confidenceMultiplier: number | null;
}

const SYNC_ACTIONS: { label: string; path: string }[] = [
  { label: "Sync fixtures", path: "/api/sync/fixtures" },
  { label: "Sync live scores", path: "/api/sync/live" },
  { label: "Sync standings", path: "/api/sync/standings" },
  { label: "Sync news", path: "/api/sync/news" },
  { label: "Recompute scores", path: "/api/score" },
];

function csvCell(value: string | number | null): string {
  const s = value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function AdminPanel({ predictions }: { predictions: ExportPrediction[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultLabel, setResultLabel] = useState<string | null>(null);

  async function run(label: string, path: string) {
    setPending(path);
    setResultLabel(label);
    setResult(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw text */
      }
      setResult(`HTTP ${res.status}\n${pretty}`);
    } catch (err) {
      setResult(`Request failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setPending(null);
    }
  }

  function exportCsv() {
    const header = [
      "userId",
      "matchId",
      "predictedHomeScore",
      "predictedAwayScore",
      "predictedWinnerTeamId",
      "confidenceMultiplier",
    ];
    const rows = predictions.map((p) =>
      [
        p.userId,
        p.matchId,
        p.predictedHomeScore,
        p.predictedAwayScore,
        p.predictedWinnerTeamId,
        p.confidenceMultiplier,
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predictions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {SYNC_ACTIONS.map((a) => (
          <button
            key={a.path}
            type="button"
            disabled={pending !== null}
            onClick={() => run(a.label, a.path)}
            className="h-12 rounded-xl border border-border bg-surface-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50"
          >
            {pending === a.path ? "Running…" : a.label}
          </button>
        ))}
        <button
          type="button"
          disabled={predictions.length === 0}
          onClick={exportCsv}
          className="h-12 rounded-xl bg-[var(--accent)] text-sm font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
        >
          Export predictions CSV ({predictions.length})
        </button>
      </div>

      {result !== null && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
            {resultLabel} result
          </span>
          <pre className="max-h-72 overflow-auto rounded-xl border border-border bg-surface-2 p-3 text-xs leading-relaxed text-muted">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
