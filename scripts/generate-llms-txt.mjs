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

// The Figma export ships the RGB hex separately from the alpha. Stitch them
// into an 8-digit `#RRGGBBAA` so transparency tokens survive the trip into
// CSS — without this, every transparency-on-* token collapsed to its solid
// base color in the generated bootstrap.css.
function colorHex(raw) {
  const base = (raw.hex || "").toUpperCase();
  const alpha = typeof raw.alpha === "number" ? raw.alpha : 1;
  if (alpha >= 1 || !/^#[0-9A-F]{6}$/.test(base)) return base;
  const aa = Math.round(alpha * 255).toString(16).padStart(2, "0").toUpperCase();
  return `${base}${aa}`;
}

function flattenColor(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${k}` : k;
    if (v && typeof v === "object" && "$value" in v) {
      const raw = v.$value;
      const hex = raw && typeof raw === "object" && "hex" in raw ? colorHex(raw) : String(raw);
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

## Bootstrap (non-optional for new prototypes / standalone UI)

Any new ArcSite UI being built from scratch (prototype, demo, marketing page, internal tool) **must** start by importing the canonical token + font bootstrap stylesheet. This loads Inter, defines every CSS variable referenced below, and sets up dark-mode swap automatically. Copy these two lines into the \`<head>\`:

\`\`\`html
<link rel="stylesheet" href="https://arctuition.github.io/design-system/tokens/bootstrap.css">
\`\`\`

After importing, reference tokens by name only (\`color: var(--color-label-primary);\`). Do not hand-copy values from the sections below into your CSS — those sections are reference, not source. Dark mode: add \`class="dark"\` or \`data-theme="dark"\` to \`<html>\` (or any subtree).

If you are editing inside an established codebase that already wires tokens through its own build (\`arcsite_web\`, \`proposalv3\`, etc.), follow that codebase's existing import pattern instead — do not import bootstrap.css alongside it.

---

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

---

## Design Principles (LLM-applicable)

When generating ArcSite designs or UI code, follow these rules. Each is
phrased as **Rule / Why / How to apply** — apply them in order before falling
back to your own judgment.

### 1. Component namespace must not cross scopes
- **Rule** — Library components are scoped by **name prefix** (primary truth). The Figma section is only a fallback when a component has no prefix.
  - \`app/*\` → ArcSite webapp only (in-product drawing / proposal UI)
  - \`web/*\` → user-site / marketing web only
  - **Unprefixed → shared primitive.** Includes design tokens (\`color/*\`, \`size/*\`, \`font/*\`), the main icon library (the \`Icons\` and \`Icons-Source\` pages, plus shared icon families like \`icon 48/*\`, \`icon 30/*\`), navigation primitives (\`navigation-item/*\`), shared media (\`image/*\`, \`logo-arcsite/*\`, \`cursor/*\`, \`ar-icons\`, placeholder variants like \`default img\`, \`default video\`, \`low-fi/img\`), and illustrations on the \`Image\` page.
  - When prefix is absent, fall back to the enclosing Figma section: \`app\` section → app-only, \`web\` section → web-only, no scoped section → shared.
- **Why** — The two products have different visual density and language; mixing breaks system intent and produces designs that need rework. Prefix-as-truth makes scope decidable from the component name alone — no need to inspect Figma section context at consumption time.
- **How to apply** — Before instantiating, read the prefix. When \`search_design_system\` returns multiple variants of the same logical component (e.g. \`app/table/row\` vs \`web/table/row\`), pick the one matching the current project. If no match exists for your project's namespace, flag to the user — never force a wrong-namespace component.

### 2. Default interaction color is action blue; onboarding is the only exception
- **Rule** — Primary interactive color (primary buttons, active nav, links, chart emphasis, focus ring):
  - All products (user-site, marketing web, webapp interior) → \`action\` token family (blue)
  - **Onboarding flows** (regardless of which product they live in) → \`brand\` token family (orange)
  - Logo / brand-identity surfaces (splash, brand storytelling, empty-state illustrations) → \`brand\` token family
- **Why** — The product's default interactive language is cool/blue (matches the \`action\` token semantic). Brand orange reads as warm/promotional and is reserved for moments where brand identity is the message — most importantly the user's first encounter via onboarding.
- **How to apply** —
  - Onboarding: primary CTA, active step, focus ring all bind to \`brand/primary\`; container uses \`surface/container/brand\`. Do not mix in \`action\` tokens.
  - Everywhere else: active nav row = \`surface/container/action\` + \`label/action/primary\`; chart series primary/secondary = \`label/action/primary\` / \`…/secondary\`.
  - Logo SVGs: reference \`https://arctuition.github.io/design-system/logos/glyph*.svg\` directly — they bake in brand orange.

### 3. Empty input placeholders bind to tertiary
- **Rule** — When an input is empty, the placeholder text binds to \`color/label/tertiary\` (or \`…/tertiary-increased-contrast\`). Never \`primary\` or \`secondary\`.
- **Why** — Tertiary is the system's "low-emphasis hint" semantic. Primary makes empty inputs look pre-filled (misleading); secondary is for sub-labels, not placeholders.
- **How to apply** — All input components default placeholder = tertiary. Filled state = \`label/primary\` / \`…/primary-increased-contrast\`. The placeholder ↔ filled toggle is exactly tertiary ↔ primary.

### 4. Active / selected states use intent surface + intent label
- **Rule** — For "currently selected" / "highlighted" states, compose \`surface/container/{intent}\` as background and \`label/{intent}/primary\` as foreground. Do not roll your own tinted colors or fade the brand color manually.
- **Why** — Container tokens are pre-tuned so foreground text remains legible; ad-hoc tints break the brightness system and don't follow dark-mode swaps.
- **How to apply** —
  - User-site, webapp default → \`intent=action\`
  - Onboarding → \`intent=brand\` (see principle 2)
  - Status states → \`intent=caution / danger / success\`
  - Brand-tinted promo / splash cards → \`intent=brand\`

### 5. Ghost / chrome-less inputs only when external chrome already frames them
- **Rule** — Input \`style=ghost\` (no border, no trailing button) is allowed only when an external container already provides the visual edge — header global search, inline edit, quick-input embedded in a card title row. Do not default to ghost.
- **Why** — Ghost removes the affordance (border / button). Without external context, users can't see "where to type."
- **How to apply** —
  - Use only inside header / card title row / modal inset where an outer frame supplies the boundary.
  - All form inputs → \`style=default\`, always.
  - Dropdown / date-picker / number-stepper variants → never ghost; the trailing icon is the core interaction and removing it breaks the control.

### 6. Do not translate tokens across sources
- **Rule** — The code-side \`llms.txt\` and Figma-side variables should hold the same values, but each side must read from its own source. Don't translate hex from \`llms.txt\` into Figma fills; don't treat a Figma variable's resolved value as the canonical code value.
- **Why** — The two sides can drift at any moment. Letting code read \`llms.txt\` and design read the Figma library is the only way both sides stay current.
- **How to apply** — Writing code: fetch \`llms.txt\`, reference tokens by name. Designing in Figma: \`search_design_system\` + \`importVariableByKeyAsync\` to bind variables.

---

## Logos

Brand logo assets for ArcSite. Use these when a design needs the product or
company mark — never re-trace, redraw, or recolor; reference the SVG directly.

Variants:
- **glyph** — icon-only mark for **light backgrounds**. Brand-orange glyph on transparent. Default for most product UI, headers, and marketing surfaces with light/white backgrounds.
  \`https://arctuition.github.io/design-system/logos/glyph.svg\`
- **glyph on dark** — icon-only mark for **dark backgrounds**. Light-treated glyph designed to remain legible on dark surfaces, photography, or busy backgrounds.
  \`https://arctuition.github.io/design-system/logos/glyph-on-dark.svg\`
- **glyph and text** — full wordmark + glyph for **light backgrounds**. Default lockup for headers, marketing pages, and product surfaces with light/white backgrounds.
  \`https://arctuition.github.io/design-system/logos/glyph-and-text.svg\`
- **glyph and text on dark** — full wordmark + glyph for **dark backgrounds**. Light-treated lockup; use on dark or photographic backgrounds where the default would lose contrast.
  \`https://arctuition.github.io/design-system/logos/glyph-and-text-on-dark.svg\`

Repo path: \`public/logos/\` (served at \`/logos/*.svg\`).

---

## Skills

LLM application guides for the ArcSite design system:

- [Prototype mode guide](https://arctuition.github.io/design-system/skills/arcsite-ds-apply/prototype.md)
- [AntD conflict handling](https://arctuition.github.io/design-system/skills/arcsite-ds-apply/antd-conflict.md)
- [Figma MCP flow](https://arctuition.github.io/design-system/skills/arcsite-ds-apply/figma-flow.md)
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

// Generate bootstrap.css — the paste-ready stylesheet that loads Inter and
// defines every token referenced in llms.txt. Standalone UI (prototypes,
// demos, marketing pages) imports this once and gets all tokens + dark-mode
// for free. Same source data as llms.txt — there is no risk of drift.
const bootstrapCss = `/*
 * Arcsite Design System — token bootstrap
 * Generated from /tokens/*.json by scripts/generate-llms-txt.mjs.
 * Do not edit by hand — changes will be overwritten on next build.
 *
 * Usage: import once at the root of any new prototype or standalone UI.
 *   <link rel="stylesheet"
 *         href="https://arctuition.github.io/design-system/tokens/bootstrap.css">
 *
 * Then reference tokens via CSS custom properties:
 *   color: var(--color-label-primary);
 *   padding: var(--size-spacing-md);
 *   font: var(--text-body-medium);
 *
 * Dark mode: add class="dark" or data-theme="dark" to <html> (or any subtree).
 */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap');

/* ── Color: global primitives ────────────────────────────────────────────── */
:root {
${fmt(globalColor)}
}

/* ── Color: semantic, light mode ─────────────────────────────────────────── */
:root {
${fmt(lightTokens)}
}

/* ── Color: semantic, dark mode ──────────────────────────────────────────── */
:root.dark, [data-theme='dark'] {
${fmt(darkTokens)}
}

/* ── Size & space: global primitives ─────────────────────────────────────── */
:root {
${fmt(sizeGlobal)}
}

/* ── Size & space: semantic (web desktop) ────────────────────────────────── */
:root {
${fmt(sizeDesktop)}
}

/* ── Typography (web desktop) ────────────────────────────────────────────── */
:root {
${fmt(fontDesktop, "value")}
}
`;
const bootstrapPath = resolve(publicTokensDir, "bootstrap.css");
writeFileSync(bootstrapPath, bootstrapCss, "utf-8");
console.log(`[bootstrap.css] wrote ${bootstrapPath} — ${bootstrapCss.length} chars`);
