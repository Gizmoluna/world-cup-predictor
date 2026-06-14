// ---------------------------------------------------------------------------
// App-wide constants: the two rivals, their themes, and navigation.
// ---------------------------------------------------------------------------

export interface ThemeDef {
  key: string;
  label: string;
  flag: string;
  /** CSS custom-property values applied on <html data-theme>. */
  accent: string;
  accentSoft: string;
  glow: string;
  gradient: string;
}

export const THEMES: Record<string, ThemeDef> = {
  carina: {
    key: "carina",
    label: "Carina",
    flag: "🇨🇴",
    // Colombia: yellow / blue / red
    accent: "#FCD116",
    accentSoft: "rgba(252,209,22,0.16)",
    glow: "0 0 30px rgba(252,209,22,0.45)",
    gradient: "linear-gradient(135deg,#FCD116 0%,#003893 55%,#CE1126 100%)",
  },
  johnny: {
    key: "johnny",
    label: "Johnny",
    flag: "🇮🇪",
    // Ireland: green / white / orange
    accent: "#169B62",
    accentSoft: "rgba(22,155,98,0.16)",
    glow: "0 0 30px rgba(22,155,98,0.45)",
    gradient: "linear-gradient(135deg,#169B62 0%,#ffffff 50%,#FF883E 100%)",
  },
};

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

export const APP_NAME = "World Cup Predictor";
export const APP_SHORT = "Predictor";
export const APP_TAGLINE = "Predict every match";
export const APP_SUBTITLE = "Every match. Every prediction. Glory forever.";
