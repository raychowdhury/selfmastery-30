"use client";

import * as React from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "selfmastery-theme";
const DEFAULT_THEME: ThemePreference = "dark";

/**
 * The token sheet is dark by default and `.light` overrides it, matching the
 * prototype's dark-first design system.
 */
function applyTheme(theme: ThemePreference) {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : theme;
  const root = document.documentElement;
  root.classList.toggle("light", resolved === "light");
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * The preference lives in localStorage, which is an external store rather than
 * React state — so it is read through useSyncExternalStore. That gives correct
 * hydration (server renders the default, the client swaps after hydrating)
 * without an effect that sets state on mount.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = () => {
    if (readTheme() === "system") applyTheme("system");
    listener();
  };
  media.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

function readTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private browsing, or storage disabled. The default is fine.
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function useTheme() {
  const theme = React.useSyncExternalStore(
    subscribe,
    readTheme,
    () => DEFAULT_THEME
  );

  const setTheme = React.useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice should not stop us applying it.
    }
    applyTheme(next);
    emit();
  }, []);

  return { theme, setTheme };
}

/** Runs before paint so a light-mode user never sees a dark flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}")||"${DEFAULT_THEME}";var l=t==="light"||(t==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches);var r=document.documentElement;r.classList.toggle("light",l);r.classList.toggle("dark",!l);r.style.colorScheme=l?"light":"dark";}catch(e){}})();`;
