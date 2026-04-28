/**
 * Singleton Shiki highlighter.
 *
 * Shiki uses the same TextMate grammars as VS Code / Cursor, so the syntax
 * highlighting is accurate across all supported languages. Only the languages
 * we actually use are bundled to keep the JS payload small.
 */
import { createHighlighter, type Highlighter } from "shiki";

export const SUPPORTED_LANGS = [
  "css", "scss", "swift", "kotlin",
  "javascript", "typescript", "jsx", "tsx",
  "json", "bash", "html", "markdown",
] as const;

export type SupportedLang = typeof SUPPORTED_LANGS[number] | "plaintext";

export const LIGHT_THEME = "github-light";
export const DARK_THEME  = "github-dark";

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [...SUPPORTED_LANGS],
    });
  }
  return highlighterPromise;
}

/** Map a language tag to a shiki-supported lang; unknown → "plaintext". */
export function normalizeLang(lang?: string): SupportedLang {
  if (!lang) return "plaintext";
  const l = lang.toLowerCase().trim();
  // Aliases
  if (l === "sh" || l === "shell" || l === "zsh") return "bash";
  if (l === "js")   return "javascript";
  if (l === "ts")   return "typescript";
  if (l === "yml")  return "json"; // fallback — we don't bundle yaml
  if (l === "md")   return "markdown";
  if ((SUPPORTED_LANGS as readonly string[]).includes(l)) return l as SupportedLang;
  return "plaintext";
}
