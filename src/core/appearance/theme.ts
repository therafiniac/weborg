import { useEffect, useSyncExternalStore } from "react";

import type { ResolvedTheme, ThemeChoice } from "./appearance";

const QUERY = "(prefers-color-scheme: light)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

const systemTheme = (): ResolvedTheme =>
  window.matchMedia?.(QUERY).matches ? "light" : "dark";

/** The theme actually shown; "system" follows the computer, live. */
export function useResolvedTheme(choice: ThemeChoice): ResolvedTheme {
  const system = useSyncExternalStore(subscribe, systemTheme);
  return choice === "system" ? system : choice;
}

/** Puts the theme on <html>, where every stylesheet's tokens read it. */
export function useApplyTheme(theme: ResolvedTheme) {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}
