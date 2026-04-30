/**
 * Generate `public/llms.txt` from the Figma-exported token JSON files.
 *
 * Runs in `prebuild` (before `vite build`) and `predev` (before `vite`) so the
 * file is always in sync with the source tokens. Outputs plain text with
 * `Content-Type: text/plain` semantics — AI agents can fetch the URL directly
 * (no JS execution required).
 */

import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function readJson(rel) {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf-8"));
}

// ── Token flatteners (mirror the React utilities) ─────────────────────────

function toVarRef(alias) {
  if (alias.startsWith("{") && alias.endsWith("}")) {
    return `var(--${alias.slice(1, -1).replace(/\./g, "-")})`;
  }
  return `var(--${alias.replace(/\//g, "-")})`;
}

function flattenColor(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === "object" && "$value" in v) {
      const raw = v.$value;
      const hex = raw && typeof raw === "object" && "hex" in raw ? raw.hex : String(raw);
      const aliasName = v.$extensions?.["com.figma.aliasData"]?.targetVariableName;
      const display = aliasName ? `var(--${aliasName.replace(/\//g, "-")})` : hex;
      out.push({ cssVar: `--${path}`, displayValue: display });
    } else if (v && typeof v === "object") {
      out.push(...flattenColor(v, path));
    }
  }
  return out;
}

function flattenSize(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === "object" && "$value" in v) {
      const raw = v.$value;
      const aliasName = v.$extensions?.["com.figma.aliasData"]?.targetVariableName;
      let display;
      if (typeof raw === "string") display = toVarRef(raw);
      else if (aliasName) display = toVarRef(aliasName);
      else {
        const n = typeof raw === "number" ? raw : parseFloat(String(raw));
        display = `${n}px`;
      }
      out.push({ cssVar: `--${path}`, displayValue: display });
    } else if (v && typeof v === "object") {
      out.push(...flattenSize(v, path));
    }
  }
  return out;
}

function flattenFont(obj, prefix = "") {
  // Font tokens are simpler — values are already strings/numbers and we don't
  // try to rewrite aliases (font tokens rarely alias each other).
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === "object" && "$value" in v) {
      const raw = v.$value;
      let value;
      if (typeof raw === "number") value = `${raw}px`;
      else value = String(raw);
      out.push({ cssVar: `--${path}`, value });
    } else if (v && typeof v === "object") {
      out.push(...flattenFont(v, path));
    }
  }
  return out;
}

// ── Build llms.txt ─────────────────────────────────────────────────────────

const lightTokens  = flattenColor(readJson("tokens/color/light.tokens.json"));
const darkTokens   = flattenColor(readJson("tokens/color/dark.tokens.json"));
const globalColor  = flattenColor(readJson("tokens/color/color-global-value.tokens.json"));
const fontDesktop  = flattenFont(readJson("tokens/font/web-desktop.tokens.json"));
const sizeDesktop  = flattenSize(readJson("tokens/size/web-desktop.tokens.json"));
const sizeGlobal   = flattenSize(readJson("tokens/size/size-global-value.tokens.json"));

const fmt = (toks, key = "displayValue") =>
  toks.map((t) => `  ${t.cssVar}: ${t[key]};`).join("\n");

const content = `# Arcsite Design System
Single source of truth for Arcsite product UI.
All tokens are CSS custom properties — reference as \`var(--token-name)\`.
Tailwind 4 arbitrary value syntax: \`bg-(--color-label-primary)\`, \`text-(--color-label-primary)\`, etc.

Token resolution rule: bind layers and components to **semantic** tokens
(\`--color-label-*\`, \`--color-fill-*\`, \`--color-surface-*\`, \`--color-border-*\`,
\`--size-spacing-*\`, \`--size-padding-*\`, \`--size-radius-*\`, \`--text-*\`).
Globals (\`--color-global-*\`, \`--size-global-*\`) are primitives — only reference
them directly inside the design system itself, never in product UI.

---

## Token reference pages
- Typography tokens: /typography/tokens
- Color tokens:      /color/tokens
- Color swatches:    /color/swatches
- Size tokens:       /size/tokens

## Full token documentation
- /tokens/tokens-color.md
- /tokens/tokens-typography.md
- /tokens/tokens-size-space.md

---

## Icons — which library to use

**Rule of thumb: prefer the project's own icon library when one exists.**

1. **Working on the Arcsite user site** (\`arcsite_web\` repo)?
   Always pull icons from the project's bundled library:
   \`\`\`
   packages/arcsite-icons/icon
   \`\`\`
   (path relative to the \`arcsite_web\` repo root)
   You may still use this design system website as a *visual reference* to
   decide which icon to use, but the actual import must come from the
   \`arcsite-icons\` package — not from this design system.

2. **Working on a prototype or any project that does not have its own
   icon library**? Use the design system's icon library:
   - Visual browser:  /iconology
   - JSON manifest:   /icons.json   (machine-readable, includes inline SVG + tags)

   Each entry in \`/icons.json\` has:
   - \`name\`        — kebab-case identifier
   - \`fileName\`    — original upload filename
   - \`tags\`        — search keywords (intent + visual descriptors)
   - \`svgContent\`  — full inline SVG, ready to drop into a component

   Search the manifest by tag (e.g. \`tags.includes("arrow")\`) or name to
   pick an icon, then inline the \`svgContent\` directly.

---

## Color — light mode (semantic)
:root {
${fmt(lightTokens)}
}

---

## Color — dark mode (semantic)
:root.dark, [data-theme='dark'] {
${fmt(darkTokens)}
}

---

## Color — global palette (raw primitives)
:root {
${fmt(globalColor)}
}

---

## Typography — web desktop
:root {
${fmt(fontDesktop, "value")}
}

---

## Size & space — web desktop (semantic)
:root {
${fmt(sizeDesktop)}
}

---

## Size & space — global scale (raw primitives)
:root {
${fmt(sizeGlobal)}
}
`;

const outPath = resolve(ROOT, "public/llms.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, content, "utf-8");

console.log(
  `[llms.txt] wrote ${outPath} — ${content.length} chars, ${content.split("\n").length} lines`
);

// Mirror the canonical token markdown into public/tokens/ so the URLs listed
// in llms.txt (and consumed by AI agents) serve the same content the React
// pages import via `?raw`. The source-of-truth lives in /tokens — this is
// just a build-time copy.
const TOKEN_DOCS = [
  "tokens-color.md",
  "tokens-typography.md",
  "tokens-size-space.md",
];
const publicTokensDir = resolve(ROOT, "public/tokens");
mkdirSync(publicTokensDir, { recursive: true });
for (const name of TOKEN_DOCS) {
  copyFileSync(resolve(ROOT, "tokens", name), resolve(publicTokensDir, name));
}
console.log(`[llms.txt] mirrored ${TOKEN_DOCS.length} token docs to public/tokens/`);
