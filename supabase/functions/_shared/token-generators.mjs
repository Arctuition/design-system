/**
 * Pure token-generation logic shared by the build script
 * (scripts/generate-llms-txt.mjs) and the CMS publish flow that ships these
 * artifacts to Supabase Storage on every token upload (Option B).
 *
 * No Node-only deps — readable from both Node and the browser via Vite's
 * `.mjs` resolution. The TypeScript-side re-export lives at
 * src/app/lib/token-generators.ts.
 *
 * If the two sides drift, the bootstrap.css the CMS publishes will not match
 * the byte-identical copy `npm run build` produces. Keep all generation logic
 * in this one file.
 */

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Turn a Figma alias reference (`{color.label.primary}` or
 *  `color/label/primary`) into a `var(--color-label-primary)` reference. */
export function toVarRef(alias) {
  if (alias.startsWith("{") && alias.endsWith("}")) {
    return `var(--${alias.slice(1, -1).replace(/\./g, "-")})`;
  }
  return `var(--${alias.replace(/\//g, "-")})`;
}

/**
 * Stitch Figma's hex + alpha into an 8-digit `#RRGGBBAA`. The export ships
 * those separately; without this, every transparency token would collapse
 * to its solid base in the generated bootstrap.css.
 */
export function colorHex(raw) {
  const base = (raw.hex || "").toUpperCase();
  const alpha = typeof raw.alpha === "number" ? raw.alpha : 1;
  if (alpha >= 1 || !/^#[0-9A-F]{6}$/.test(base)) return base;
  const aa = Math.round(alpha * 255).toString(16).padStart(2, "0").toUpperCase();
  return `${base}${aa}`;
}

// ── Flatteners ──────────────────────────────────────────────────────────────

/** Flatten a color-token tree → `[{ cssVar, displayValue }]`.
 *  Aliases are preserved as `var(...)` references. */
export function flattenColor(obj, prefix = "") {
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

/** Flatten a size-token tree → `[{ cssVar, displayValue }]`.
 *  Aliases survive as `var(...)`; numbers get a `px` suffix. */
export function flattenSize(obj, prefix = "") {
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

/** Breakpoint tokens share the size-token shape, so this is a thin alias.
 *  Kept as a named export so call sites read clearly. */
export const flattenBreakpoint = flattenSize;

/** Flatten a font-token tree → `[{ cssVar, value }]`. Font tokens rarely
 *  alias each other so the alias rewriting step is omitted; numeric values
 *  get a `px` suffix (caller decides whether to special-case font-weight). */
export function flattenFont(obj, prefix = "") {
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

// ── Higher-level builders ───────────────────────────────────────────────────

/** Extract the raw pixel map `{ xs, sm, md, lg, xl }` from the breakpoint
 *  JSON. CSS custom properties can't be used inside `@media (min-width: …)`
 *  conditions, so the bootstrap.css template hard-emits these numbers. */
export function extractBreakpointPx(breakpointJson) {
  const tree = breakpointJson?.breakpoint ?? {};
  const out = { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 };
  for (const [k, v] of Object.entries(tree)) {
    if (v && typeof v === "object" && "$value" in v) {
      const n = typeof v.$value === "number" ? v.$value : parseFloat(String(v.$value));
      if (Number.isFinite(n)) out[k] = n;
    }
  }
  return out;
}

/** Return only the tokens whose value differs from the baseline (Web Mobile).
 *  Used to keep the `@media` override blocks minimal. */
export function diffFromBase(baseTokens, modeTokens) {
  const baseMap = new Map(baseTokens.map((t) => [t.cssVar, t.displayValue]));
  return modeTokens.filter((t) => baseMap.get(t.cssVar) !== t.displayValue);
}

/** Format a list of flattened tokens as CSS-property lines.
 *  `keyName` is `"displayValue"` for color/size, `"value"` for font. */
export function formatTokenLines(tokens, keyName = "displayValue") {
  return tokens.map((t) => `  ${t.cssVar}: ${t[keyName]};`).join("\n");
}

/**
 * Build the full bootstrap.css string. All inputs are pre-flattened so this
 * function is purely a template; pass the same data on either side (build
 * script or CMS publish) and the output is byte-identical.
 */
export function buildBootstrapCss({
  globalColor,
  lightTokens,
  darkTokens,
  sizeGlobal,
  breakpoints,
  sizeWebMobile,
  sizeTabletDiff,
  sizeDesktopDiff,
  sizeDesktopLargeDiff,
  fontDesktop,
  breakpointPx,
}) {
  const fmt = formatTokenLines;
  return `/*
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

/* ── Breakpoints ─────────────────────────────────────────────────────────── */
/* Exposed for JS / Tailwind / container queries. Media queries below use
 * the raw pixel numbers since CSS vars don't work inside @media (). */
:root {
${fmt(breakpoints)}
}

/* ── Size & space: semantic, mobile-first ────────────────────────────────── */
/* Default = Web Mobile. Each breakpoint overrides only the tokens that
 * differ at that screen size. Device modes (mobile/tablet) live in
 * tokens/size/device-*.json and are consumed by iOS / Android — they
 * are deliberately not in this stylesheet. */
:root {
${fmt(sizeWebMobile)}
}

@media (min-width: ${breakpointPx.sm}px) {
  /* Web Tablet */
  :root {
${fmt(sizeTabletDiff).replace(/^/gm, "  ")}
  }
}

@media (min-width: ${breakpointPx.lg}px) {
  /* Web Desktop */
  :root {
${fmt(sizeDesktopDiff).replace(/^/gm, "  ")}
  }
}

@media (min-width: ${breakpointPx.xl}px) {
  /* Web Desktop Large */
  :root {
${fmt(sizeDesktopLargeDiff).replace(/^/gm, "  ")}
  }
}

/* ── Typography (web desktop) ────────────────────────────────────────────── */
:root {
${fmt(fontDesktop, "value")}
}
`;
}

/**
 * Build the 1-line `bootstrap.css` shim that GitHub Pages serves at the
 * historical URL. The shim `@import`s the live, CMS-published copy from
 * Supabase Storage — so existing prototypes that hardcode the GH Pages URL
 * automatically pick up new token values within ~1 minute of a designer
 * hitting Publish in the CMS, with no rebuild or commit.
 *
 * Cache trade-off: GitHub Pages caches its own assets for ~10 min by default.
 * The `@import` URL is a separate request the browser resolves on its own,
 * so it respects whatever cache headers Supabase sets (`max-age=60` per the
 * design-tokens bucket helper). Worst-case staleness is roughly the GH
 * Pages cache TTL — designers can hard-reload to bypass it.
 *
 * Downtime caveat: if Supabase Storage is unreachable the `@import` fails
 * silently and prototypes lose their tokens. The deployed copy on GitHub
 * Pages is the only place to add a fallback — see the production-mode
 * branch in scripts/generate-llms-txt.mjs.
 */
export function buildBootstrapShim(projectId) {
  const liveUrl = `https://${projectId}.supabase.co/storage/v1/object/public/design-tokens/bootstrap.css`;
  return `/*
 * Arcsite Design System — token bootstrap (shim)
 *
 * This GitHub Pages copy is a 1-line forward to the live Supabase Storage
 * version, which the CMS regenerates and publishes on every token upload.
 * Prototypes that hardcode the historical URL keep working unchanged.
 *
 * To pin to a specific published version, fetch the Supabase URL directly:
 *   ${liveUrl}
 */

@import url("${liveUrl}");
`;
}

/** Build the breakpoints.js ES module — a tiny export of the same pixel map
 *  that the @media blocks use, for JS consumers that can't reach CSS vars. */
export function buildBreakpointsJs(breakpointPx) {
  return `/*
 * Arcsite Design System — breakpoint pixel values
 * Generated from /tokens/breakpoint/breakpoint.tokens.json by
 * scripts/generate-llms-txt.mjs. Do not edit by hand.
 *
 * Use these for JS conditions, matchMedia, Tailwind \`screens\`, or any
 * place CSS custom properties cannot reach (notably @media queries).
 */

export const breakpoints = ${JSON.stringify(breakpointPx, null, 2)};
`;
}

// ── Client-normalized state → flat token rows ───────────────────────────────
//
// The CMS stores tokens in a different shape from the raw Figma JSON the
// flatten* functions accept — designer uploads pass through parsers that
// normalize each token to `{name, value, aliasOf?}`. These helpers convert
// that KV shape into the `[{cssVar, displayValue}]` / `[{cssVar, value}]`
// shape `buildBootstrapCss` consumes, so a CMS publish produces the same
// bootstrap.css the prebuild script would for the same logical tokens.

/** Normalize a token name into a CSS custom-property name. Tolerates both
 *  `color.label.primary` (dot path) and `size/spacing-md` (slash path), and
 *  passes through names that already start with `--`. */
export function tokenNameToCssVar(name) {
  if (!name) return "";
  if (name.startsWith("--")) return name;
  return "--" + name.replace(/[./]/g, "-");
}

/** Color token rows → `[{cssVar, displayValue}]`. If the row carries an
 *  `aliasOf` (Figma aliasData or in-collection brace reference), emit a
 *  `var(--…)` reference so theme overrides and global cascading survive.
 *  Otherwise pass through whatever the client parser produced (hex / rgba). */
export function colorRowsToFlat(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((t) => {
    const cssVar = tokenNameToCssVar(t.name);
    if (t.aliasOf) {
      return { cssVar, displayValue: `var(${tokenNameToCssVar(t.aliasOf)})` };
    }
    return { cssVar, displayValue: String(t.value ?? "") };
  });
}

/** Size/breakpoint token rows → `[{cssVar, displayValue}]`. Aliases survive
 *  as `var(--alias-target)`; numeric values get a `px` suffix. Rows whose
 *  numeric value is non-finite AND have no alias are skipped — emitting
 *  `NaNpx` would silently break responsive cascades downstream. */
export function sizeRowsToFlat(rows) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const t of rows) {
    const cssVar = tokenNameToCssVar(t.name);
    if (t.aliasOf) {
      out.push({ cssVar, displayValue: `var(${tokenNameToCssVar(t.aliasOf)})` });
      continue;
    }
    const n = typeof t.value === "number" ? t.value : parseFloat(String(t.value));
    if (!Number.isFinite(n)) continue;  // would produce "NaNpx" — drop the row
    out.push({ cssVar, displayValue: `${n}px` });
  }
  return out;
}

/** Font token rows → `[{cssVar, value}]`. The Figma scope hint drives the
 *  unit: FONT_SIZE / LINE_HEIGHT → px; FONT_STYLE → unitless (weight);
 *  ALL_SCOPES → px with 2-decimal precision (letter-spacing); strings
 *  (typeface) pass through. Aliases survive as `var(--alias)`. Multi-scope
 *  tokens (`scopes: [...]`) pick the strictest unit hint from the array. */
export function fontRowsToFlat(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((t) => {
    const cssVar = tokenNameToCssVar(t.name);
    if (t.aliasOf) return { cssVar, value: `var(${tokenNameToCssVar(t.aliasOf)})` };
    if (typeof t.value === "string") return { cssVar, value: t.value };

    // Pick a unit-bearing scope across the full scopes array, falling back to
    // the legacy single `scope` field for back-compat with older KV rows.
    const scopeList = Array.isArray(t.scopes) && t.scopes.length ? t.scopes : t.scope ? [t.scope] : [];
    const pick = (needles) => scopeList.find((s) => needles.includes(s)) || "";
    const sizeScope = pick(["FONT_SIZE", "LINE_HEIGHT"]);
    if (sizeScope) return { cssVar, value: `${t.value}px` };
    if (scopeList.includes("FONT_STYLE")) return { cssVar, value: String(t.value) };
    if (scopeList.includes("ALL_SCOPES")) {
      const n = typeof t.value === "number" ? t.value : parseFloat(String(t.value));
      return { cssVar, value: Number.isFinite(n) ? `${parseFloat(n.toFixed(2))}px` : String(t.value) };
    }
    return { cssVar, value: String(t.value) };
  });
}

/** Extract the `{xs, sm, md, lg, xl}` pixel map from breakpoint token rows.
 *  Mirrors `extractBreakpointPx` for raw Figma JSON, but reads the KV shape. */
export function extractBreakpointPxFromRows(rows) {
  const out = { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 };
  if (!Array.isArray(rows)) return out;
  for (const t of rows) {
    if (!t?.name) continue;
    // Names look like "breakpoint/sm" — take the trailing segment.
    const key = t.name.split("/").pop();
    if (!(key in out)) continue;
    const n = typeof t.value === "number" ? t.value : parseFloat(String(t.value));
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}
