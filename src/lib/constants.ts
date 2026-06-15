// ---------------------------------------------------------------------------
// App-wide constants: the two rivals, their themes, and navigation.
// ---------------------------------------------------------------------------

export interface ThemeDef {
  key: string;
  label: string;
  accent: string;
  accentSoft: string;
  glow: string;
  gradient: string;
}

function theme(key: string, label: string, accent: string): ThemeDef {
  return {
    key,
    label,
    accent,
    accentSoft: `${accent}29`, // ~16% alpha (8-digit hex)
    glow: `0 0 30px ${accent}73`, // ~45% alpha
    gradient: `linear-gradient(135deg, ${accent} 0%, ${accent}99 100%)`,
  };
}

// An inclusive colour palette — anyone picks the look they like.
export const THEMES: Record<string, ThemeDef> = {
  gold: theme("gold", "Gold", "#ffd34d"),
  emerald: theme("emerald", "Emerald", "#2ecc71"),
  crimson: theme("crimson", "Crimson", "#ff4d6d"),
  royal: theme("royal", "Royal Blue", "#4f7cff"),
  violet: theme("violet", "Violet", "#a855f7"),
  orange: theme("orange", "Orange", "#ff883e"),
  teal: theme("teal", "Teal", "#2dd4bf"),
  rose: theme("rose", "Rose", "#ff5fa2"),
  sky: theme("sky", "Sky", "#38bdf8"),
  lime: theme("lime", "Lime", "#a3e635"),
  // Legacy keys so existing accounts still resolve (hidden from the picker).
  carina: theme("carina", "Gold", "#fcd116"),
  johnny: theme("johnny", "Emerald", "#2ecc71"),
};

export const DEFAULT_THEME = "gold";

// The themes shown in the sign-up / settings picker (excludes legacy aliases).
export const PICKER_THEMES: ThemeDef[] = [
  "gold", "emerald", "crimson", "royal", "violet", "orange", "teal", "rose", "sky", "lime",
].map((k) => THEMES[k]);

export interface RivalDef {
  id: string;
  name: string;
  theme: string;
  nationality: string;
  flag: string;
  emoji: string;
}

// The two core users. More can be added later via the DB.
export const RIVALS: RivalDef[] = [
  {
    id: "carina",
    name: "Carina",
    theme: "carina",
    nationality: "Colombia",
    flag: "🇨🇴",
    emoji: "💛",
  },
  {
    id: "johnny",
    name: "Johnny",
    theme: "johnny",
    nationality: "Ireland",
    flag: "🍀",
    emoji: "🟢",
  },
];

export function rival(id: string): RivalDef | undefined {
  return RIVALS.find((r) => r.id === id);
}

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "Home" },
  { href: "/matches", label: "Matches", icon: "CalendarDays" },
  { href: "/battle", label: "Battle", icon: "Swords" },
  { href: "/leaderboard", label: "Table", icon: "Trophy" },
  { href: "/news", label: "News", icon: "Newspaper" },
] as const;

// Flag choices for new friends signing up.
export const FLAG_OPTIONS = [
  "🇨🇴", "🍀", "🇮🇪", "🇦🇺", "🇦🇷", "🇧🇷", "🇫🇷", "🇪🇸",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇩🇪", "🇵🇹", "🇮🇹", "🇳🇱", "🇲🇽", "🇺🇸", "🇯🇵",
  "🇲🇦", "🇭🇷", "🇧🇪", "🇺🇾", "⚽", "🔥",
];

// Admins (can reset friends' PINs, etc.). Override with ADMIN_USER_IDS env
// (comma-separated). Defaults to the two owners.
export const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "carina,johnny")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isAdmin(id?: string | null): boolean {
  return !!id && ADMIN_USER_IDS.includes(id);
}

// Gamification: a rank/title earned from total points.
export function rankFor(points: number): { title: string; icon: string } {
  if (points >= 120) return { title: "GOAT", icon: "🐐" };
  if (points >= 80) return { title: "Legend", icon: "🏆" };
  if (points >= 50) return { title: "Gaffer", icon: "🎯" };
  if (points >= 25) return { title: "Pundit", icon: "📈" };
  if (points >= 10) return { title: "Regular", icon: "⚽" };
  return { title: "Rookie", icon: "🌱" };
}

export const APP_NAME = "World Cup Predictor";
export const APP_SHORT = "Predictor";
export const APP_TAGLINE = "Predict every match";
export const APP_SUBTITLE = "Every match. Every prediction. Glory forever.";
