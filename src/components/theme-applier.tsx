"use client";

import { useEffect } from "react";
import { THEMES, DEFAULT_THEME } from "@/lib/constants";

/** Applies the current user's chosen accent colour to the CSS variables. */
export function ThemeApplier({ theme }: { theme: string }) {
  useEffect(() => {
    const t = THEMES[theme] ?? THEMES[DEFAULT_THEME];
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-soft", t.accentSoft);
    root.style.setProperty("--accent-glow", t.glow);
  }, [theme]);
  return null;
}
