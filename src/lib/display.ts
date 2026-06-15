import type { AppUser } from "@/lib/types";
import { rival, THEMES, DEFAULT_THEME } from "@/lib/constants";

export interface UserChrome {
  id: string;
  name: string;
  flag: string;
  theme: string;
  gradient: string;
}

/** Display chrome (name/flag/theme) for any user — OG rivals or new friends. */
export function chrome(user: Pick<AppUser, "id" | "name" | "theme" | "flag">): UserChrome {
  const og = rival(user.id);
  const flag = user.flag || og?.flag || "⚽";
  const theme = user.theme || og?.theme || DEFAULT_THEME;
  return {
    id: user.id,
    name: user.name,
    flag,
    theme,
    gradient: (THEMES[theme] ?? THEMES[DEFAULT_THEME]).gradient,
  };
}
