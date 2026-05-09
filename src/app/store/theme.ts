import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "ds-theme-mode";

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "system";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveDark(mode: ThemeMode): boolean {
  return mode === "dark" || (mode === "system" && systemPrefersDark());
}

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolveDark(mode));
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => readStored());

  // Re-apply when the user switches modes, and react to OS changes while in
  // "system" mode so the chrome flips without a reload.
  useEffect(() => {
    apply(mode);
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  function setMode(next: ThemeMode) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    setModeState(next);
  }

  return { mode, setMode };
}

// Inline init script — run in <head> before React boots to avoid a flash of
// the wrong theme. Returns the script body as a string so it can be embedded
// in index.html via a <script> tag.
export const themeInitScript = `
(function () {
  try {
    var v = localStorage.getItem('${STORAGE_KEY}');
    var mode = (v === 'light' || v === 'dark' || v === 'system') ? v : 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (_) {}
})();
`;
