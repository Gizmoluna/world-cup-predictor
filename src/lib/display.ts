import type { AppUser } from "@/lib/types";
import { rival, THEMES } from "@/lib/constants";

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
  const theme = user.theme || og?.theme || "carina";
  return {
    id: user.id,
    name: user.name,
    flag,
    theme,
    gradient: THEMES[theme]?.gradient ?? THEMES.carina.gradient,
  };
}
