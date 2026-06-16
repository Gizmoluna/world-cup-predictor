import Link from "next/link";
import { BarChart3, ListOrdered, Trophy, Swords } from "lucide-react";

const ITEMS = [
  { href: "/standings", label: "Standings", sub: "Live group tables", Icon: BarChart3 },
  { href: "/predict-standings", label: "Group order", sub: "Rank all 4 · +10/5/3", Icon: ListOrdered },
  { href: "/knockout", label: "Knockout", sub: "Bracket · 90/ET/pens", Icon: Trophy },
  { href: "/duels", label: "Duels", sub: "Bet a friend $", Icon: Swords },
];

export function TournamentHub() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ITEMS.map(({ href, label, sub, Icon }) => (
        <Link
          key={href}
          href={href}
          className="glass card-bc flex flex-col items-center gap-1 p-3 text-center transition active:scale-95"
        >
          <Icon size={22} className="text-[var(--accent)]" />
          <span className="title-bc text-[13px] leading-tight">{label}</span>
          <span className="text-[10px] leading-tight text-muted">{sub}</span>
        </Link>
      ))}
    </div>
  );
}
