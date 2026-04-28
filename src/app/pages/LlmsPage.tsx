import React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "../utils/clipboard";
import { getLightColorTokens, getDarkColorTokens, getGlobalColorTokens } from "../components/shared/color-json-token-utils";
import { getFontTokens } from "../components/shared/font-token-utils";
import { getGlobalSizeTokens, getSizeTokens } from "../components/shared/size-json-token-utils";

function buildLlmsContent(baseUrl: string): string {
  const lightTokens  = getLightColorTokens();
  const darkTokens   = getDarkColorTokens();
  const globalColor  = getGlobalColorTokens();
  const fontDesktop  = getFontTokens("web-desktop");
  const sizeDesktop  = getSizeTokens("web-desktop");
  const sizeGlobal   = getGlobalSizeTokens();

  const colorLightLines  = lightTokens.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");
  const colorDarkLines   = darkTokens.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");
  const colorGlobalLines = globalColor.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");
  const fontLines        = fontDesktop.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");
  const sizeLines        = sizeDesktop.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");
  const sizeGlobalLines  = sizeGlobal.map((t) => `  ${t.cssVar}: ${t.value};`).join("\n");

  return `# Arcsite Design System
Single source of truth for Arcsite product UI.
All tokens are CSS custom properties — reference as \`var(--token-name)\`.
Tailwind 4 arbitrary value syntax: \`bg-(--color-label-primary)\`, \`text-(--color-label-primary)\` etc.

---

## Token Reference Pages
Full interactive token tables with export:
- Typography tokens: ${baseUrl}/typography/tokens
- Color tokens:      ${baseUrl}/color/tokens
- Size tokens:       ${baseUrl}/size/tokens
- Color swatches:    ${baseUrl}/color/swatches

---

## Full Token Documentation (Markdown)
Detailed usage guidelines and rationale:
- Color:      ${baseUrl}/tokens/tokens-color.md
- Typography: ${baseUrl}/tokens/tokens-typography.md
- Size/Space: ${baseUrl}/tokens/tokens-size-space.md

---

## Color Tokens — Light Mode
:root {
${colorLightLines}
}

---

## Color Tokens — Dark Mode
:root.dark, [data-theme='dark'] {
${colorDarkLines}
}

---

## Color Tokens — Global Palette
:root {
${colorGlobalLines}
}

---

## Typography Tokens (Web Desktop)
:root {
${fontLines}
}

---

## Size & Space Tokens (Web Desktop)
:root {
${sizeLines}
}

---

## Size & Space Tokens — Global Scale
:root {
${sizeGlobalLines}
}
`.trim();
}

export function LlmsPage() {
  const baseUrl = window.location.origin;
  const content = buildLlmsContent(baseUrl);

  const handleCopy = () => {
    copyToClipboard(content);
    toast.success("Copied llms.txt content");
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
            AI Reference
          </h1>
          <p className="text-muted-foreground mt-2" style={{ fontSize: "var(--text-p)" }}>
            Machine-readable design token reference for AI coding agents.
            Share the URL <code className="bg-secondary px-1.5 py-0.5 rounded-[var(--radius)] text-foreground" style={{ fontSize: "var(--text-label)" }}>{baseUrl}/llms.txt</code> with your agent.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-[var(--radius-card)] text-foreground hover:bg-secondary transition-colors shrink-0"
          style={{ fontSize: "var(--text-label)" }}
        >
          <Copy className="size-4" />
          Copy all
        </button>
      </div>

      <pre
        className="bg-secondary rounded-[var(--radius-card)] p-6 overflow-x-auto text-foreground"
        style={{ fontSize: "var(--text-label)", fontFamily: "monospace", lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {content}
      </pre>
    </div>
  );
}
