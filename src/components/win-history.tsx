import { cn } from "@/lib/utils";

interface Item {
  label: string;
  day: string;
  winner: string | null;
  winnerFlag?: string | null;
  winnerName?: string | null;
}

export function WinHistory({ history }: { history: Item[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted">No finished matches yet — the clash begins soon.</p>;
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {history.map((h, i) => (
        <li key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span className="font-semibold">{h.label}</span>
          <span className={cn("font-bold", h.winner ? "text-[var(--accent)]" : "text-muted")}>
            {h.winner ? `${h.winnerFlag ?? ""} ${h.winnerName ?? ""}`.trim() : "Tie"}
          </span>
        </li>
      ))}
    </ul>
  );
}
