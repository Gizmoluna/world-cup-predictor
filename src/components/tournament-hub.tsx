import Link from "next/link";
import { BarChart3, Medal, Trophy } from "lucide-react";

const ITEMS = [
  { href: "/standings", label: "Standings", sub: "Live group tables", Icon: BarChart3 },
  { href: "/predict-groups", label: "Group winners", sub: "+10 pts each", Icon: Medal },
  { href: "/knockout", label: "Knockout", sub: "Bracket · +8 pts", Icon: Trophy },
];

export function TournamentHub() {
  return (
    <div className="grid grid-cols-3 gap-2">
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
