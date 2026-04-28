/**
 * Code block with shiki syntax highlighting.
 *
 * Uses the same TextMate grammars as VS Code / Cursor — supports CSS, SCSS,
 * Swift, Kotlin, JS/TS, JSON, Bash, HTML, Markdown out of the box.
 *
 * The component name is kept for backwards-compat with existing imports;
 * it's no longer CSS-specific.
 */

import React, { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "../../utils/clipboard";
import {
  getHighlighter,
  normalizeLang,
  LIGHT_THEME,
  DARK_THEME,
  type SupportedLang,
} from "../../utils/highlighter";

export type CodeLang = SupportedLang | string;

interface CssSyntaxBlockProps {
  code: string;
  lang?: CodeLang;
  maxHeight?: string;
}

const BADGE_LABELS: Record<string, string> = {
  css: "CSS", scss: "SCSS", swift: "Swift", kotlin: "Kotlin",
  javascript: "JavaScript", typescript: "TypeScript",
  jsx: "JSX", tsx: "TSX", json: "JSON",
  bash: "Bash", html: "HTML", markdown: "Markdown",
  plaintext: "",
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function CssSyntaxBlock({ code, lang = "css", maxHeight }: CssSyntaxBlockProps) {
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  const normalLang = normalizeLang(lang);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((h) => {
        if (cancelled) return;
        // Dual-theme mode → shiki emits CSS variables for both themes.
        // CSS in src/styles/index.css switches between them based on the
        // .dark class on an ancestor.
        const out = h.codeToHtml(code, {
          lang: normalLang,
          themes: { light: LIGHT_THEME, dark: DARK_THEME },
          defaultColor: false,
        });
        setHtml(out);
      })
      .catch((err) => {
        console.error("[shiki] highlight error", err);
        if (!cancelled) {
          setHtml(`<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, normalLang]);

  const handleCopy = () => {
    copyToClipboard(code);
    toast.success("Copied");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const badge = BADGE_LABELS[normalLang] ?? lang;

  const codeFontStyle: React.CSSProperties = {
    fontSize: "var(--text-label)",
    fontFamily:
      "'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
    lineHeight: "1.75",
    fontVariantLigatures: "none",
    letterSpacing: 0,
  };

  return (
    <div className="relative group rounded-[var(--radius-card)] overflow-hidden border border-border">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-b border-border"
        style={{ backgroundColor: "var(--secondary)", minHeight: "32px" }}
      >
        {badge ? (
          <span
            style={{
              fontSize: "var(--text-label)",
              color: "var(--muted-foreground)",
            }}
          >
            {badge}
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius)] transition-colors hover:bg-muted"
          style={{
            fontSize: "var(--text-label)",
            color: copied ? "var(--color-global-green-60)" : "var(--muted-foreground)",
          }}
        >
          <Copy className="size-3" />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code body */}
      {html ? (
        <div
          className="shiki-block"
          style={{
            ...codeFontStyle,
            ...(maxHeight ? { maxHeight, overflowY: "auto" } : {}),
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        // Loading state — show plain code with same dimensions to avoid jump
        <pre
          className="m-0 p-5 overflow-x-auto"
          style={{
            ...codeFontStyle,
            backgroundColor: "var(--secondary)",
            color: "var(--foreground)",
            whiteSpace: "pre",
            ...(maxHeight ? { maxHeight, overflowY: "auto" } : {}),
          }}
        >
          {code}
        </pre>
      )}
    </div>
  );
}
