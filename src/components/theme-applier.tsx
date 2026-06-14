"use client";

import { useEffect } from "react";

/** Applies the current user's theme to <html data-theme> for accent colours. */
export function ThemeApplier({ theme }: { theme: string }) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}
