import JSZip from "jszip";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedSizeToken {
  cssVar: string;        // e.g. --size-spacing-inline-xs
  displayValue: string;  // var(--alias) for semantic/comp tokens, Npx for global
  rawValue: string;      // always the resolved px value (for export CSS)
}

export type SizeMode =
  | "web-mobile"
  | "web-tablet"
  | "web-desktop"
  | "web-desktop-large"
  | "device-mobile"
  | "device-tablet";

export const SIZE_MODES: { key: SizeMode; label: string }[] = [
  { key: "web-mobile",        label: "Web Mobile" },
  { key: "web-tablet",        label: "Web Tablet" },
  { key: "web-desktop",       label: "Web Desktop" },
  { key: "web-desktop-large", label: "Web Desktop Large" },
  { key: "device-mobile",     label: "Device Mobile" },
  { key: "device-tablet",     label: "Device Tablet" },
];

// ── JSON imports ───────────────────────────────────────────────────────────

import globalJson           from "../../../../tokens/size/size-global-value.tokens.json";
import webMobileJson        from "../../../../tokens/size/web-mobile.tokens.json";
import webTabletJson        from "../../../../tokens/size/web-tablet.tokens.json";
import webDesktopJson       from "../../../../tokens/size/web-desktop.tokens.json";
import webDesktopLargeJson  from "../../../../tokens/size/web-desktop-large.tokens.json";
import deviceMobileJson     from "../../../../tokens/size/device-mobile.tokens.json";
import deviceTabletJson     from "../../../../tokens/size/device-tablet.tokens.json";
import breakpointJson       from "../../../../tokens/breakpoint/breakpoint.tokens.json";

const JSON_BY_MODE: Record<SizeMode, Record<string, any>> = {
  "web-mobile":        webMobileJson        as Record<string, any>,
  "web-tablet":        webTabletJson        as Record<string, any>,
  "web-desktop":       webDesktopJson       as Record<string, any>,
  "web-desktop-large": webDesktopLargeJson  as Record<string, any>,
  "device-mobile":     deviceMobileJson     as Record<string, any>,
  "device-tablet":     deviceTabletJson     as Record<string, any>,
};

// ── Value helpers ──────────────────────────────────────────────────────────

/**
 * Convert a Figma string alias like `{size.radius-sm}` → `var(--size-radius-sm)`
 * or a Figma slash alias like `size-global/4` → `var(--size-global-4)`
 */
function toVarRef(alias: string): string {
  // Format 1: {size.radius-sm}  (Figma token reference)
  if (alias.startsWith("{") && alias.endsWith("}")) {
    const inner = alias.slice(1, -1); // "size.radius-sm"
    return `var(--${inner.replace(/\./g, "-")})`;
  }
  // Format 2: size-global/4  (aliasData.targetVariableName)
  return `var(--${alias.replace(/\//g, "-")})`;
}

// ── Flatten nested Figma token JSON → ParsedSizeToken[] ───────────────────

function flattenSizeTokens(obj: Record<string, any>, prefix = ""): ParsedSizeToken[] {
  const items: ParsedSizeToken[] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${key}` : key;

    if (val && typeof val === "object" && "$value" in val) {
      const raw = (val as any).$value;
      const aliasData = (val as any).$extensions?.["com.figma.aliasData"];
      const aliasName: string | undefined = aliasData?.targetVariableName;

      let displayValue: string;
      let rawValue: string;

      if (typeof raw === "string") {
        // Component token: value is a Figma token reference like `{size.radius-sm}`
        displayValue = toVarRef(raw);
        // For export CSS we also show the var() reference (not a resolved number)
        rawValue = displayValue;
      } else if (aliasName) {
        // Semantic token aliasing a global: show var(--size-global-N)
        displayValue = toVarRef(aliasName);
        rawValue = displayValue;
      } else {
        // Global token: raw numeric value
        const num = typeof raw === "number" ? raw : parseFloat(String(raw));
        displayValue = `${num}px`;
        rawValue = displayValue;
      }

      items.push({ cssVar: `--${path}`, displayValue, rawValue });
    } else if (val && typeof val === "object") {
      items.push(...flattenSizeTokens(val as Record<string, any>, path));
    }
  }

  return items;
}

// ── Public accessors ───────────────────────────────────────────────────────

export function getGlobalSizeTokens(): ParsedSizeToken[] {
  return flattenSizeTokens(globalJson as Record<string, any>);
}

export function getSizeTokens(mode: SizeMode): ParsedSizeToken[] {
  return flattenSizeTokens(JSON_BY_MODE[mode]);
}

export function getBreakpointTokens(): ParsedSizeToken[] {
  return flattenSizeTokens(breakpointJson as Record<string, any>);
}

/**
 * Read breakpoint values as a typed map. Used by the build script and
 * any runtime that needs the raw pixel numbers (matchMedia, JS conditions,
 * Tailwind/CSS-in-JS config). Returns 0 for any missing key so callers
 * don't have to null-check.
 */
export function getBreakpointValues(): Record<"xs" | "sm" | "md" | "lg" | "xl", number> {
  const out: Record<string, number> = { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 };
  const tree = (breakpointJson as Record<string, any>).breakpoint ?? {};
  for (const [k, v] of Object.entries(tree)) {
    if (v && typeof v === "object" && "$value" in (v as any)) {
      const raw = (v as any).$value;
      const num = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (Number.isFinite(num)) out[k] = num;
    }
  }
  return out as Record<"xs" | "sm" | "md" | "lg" | "xl", number>;
}

// ── CSS generation ─────────────────────────────────────────────────────────

function tokensToCss(tokens: ParsedSizeToken[], selector = ":root"): string {
  const lines = tokens.map(t => `  ${t.cssVar}: ${t.rawValue};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

// ── Grouped CSS with section comments ─────────────────────────────────────

interface SizeGroup {
  label: string;
  prefix: string;
  exclude?: string;  // optional prefix to exclude from this group
  note?: string;
}

const SIZE_GROUPS: SizeGroup[] = [
  { label: "Spacing — Inline",     prefix: "--size-spacing-inline-" },
  { label: "Spacing — Stack",      prefix: "--size-spacing-stack-" },
  { label: "Padding",              prefix: "--size-padding-",  exclude: "--size-padding-component-", note: "component padding excluded (see below)" },
  { label: "Padding — Component",  prefix: "--size-padding-component-" },
  { label: "Border Radius",        prefix: "--size-radius-" },
  { label: "Icon Size",            prefix: "--size-icon-" },
  { label: "Touch Target",         prefix: "--size-touch-target" },
  { label: "Layout",               prefix: "--size-layout-" },
  { label: "Component Tokens",     prefix: "--size-comp-",    note: "component-level tokens — developers may not need these immediately" },
];

function divider(label: string, note?: string): string {
  const noteStr = note ? `\n * ${note}` : "";
  return `/* =========================================\n * ${label}${noteStr}\n * ========================================= */`;
}

export function buildGroupedSizeCss(tokens: ParsedSizeToken[]): string {
  const parts: string[] = [":root {", ""];

  for (const group of SIZE_GROUPS) {
    const groupTokens = tokens.filter(t =>
      t.cssVar.startsWith(group.prefix) && !(group.exclude && t.cssVar.startsWith(group.exclude))
    );
    if (groupTokens.length === 0) continue;
    parts.push(divider(group.label, group.note), "");
    groupTokens.forEach(t => parts.push(`  ${t.cssVar}: ${t.displayValue};`));
    parts.push("", "");
  }

  // Any tokens not captured by groups (safety net)
  const captured = new Set(SIZE_GROUPS.flatMap(g =>
    tokens.filter(t => t.cssVar.startsWith(g.prefix) && !(g.exclude && t.cssVar.startsWith(g.exclude)))
  ));
  const rest = tokens.filter(t => !captured.has(t));
  if (rest.length > 0) {
    rest.forEach(t => parts.push(`  ${t.cssVar}: ${t.displayValue};`));
    parts.push("");
  }

  parts.push("}");
  return parts.join("\n");
}

export function buildGlobalSizeCss(): string {
  const tokens = getGlobalSizeTokens();
  const lines = tokens.map(t => `  ${t.cssVar}: ${t.displayValue};`);
  return `:root {\n\n/* =========================================\n * Global Size Scale\n * ========================================= */\n\n${lines.join("\n")}\n\n}`;
}

export function buildBreakpointCss(): string {
  const tokens = getBreakpointTokens();
  const lines = tokens.map(t => `  ${t.cssVar}: ${t.displayValue};`);
  return `:root {\n\n/* =========================================\n * Breakpoints — decoupled from size modes.\n * Use in JS/Tailwind/matchMedia; CSS custom\n * properties do not work inside @media queries.\n * ========================================= */\n\n${lines.join("\n")}\n\n}`;
}

// ── Export as ZIP ──────────────────────────────────────────────────────────

export async function exportSizeCSSAsZip(): Promise<void> {
  const zip = new JSZip();
  zip.file("size-global.css", tokensToCss(getGlobalSizeTokens()));
  for (const { key } of SIZE_MODES) {
    zip.file(`size-${key}.css`, tokensToCss(getSizeTokens(key)));
  }
  zip.file("breakpoint.css", tokensToCss(getBreakpointTokens()));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "size-tokens.zip";
  a.click();
  URL.revokeObjectURL(url);
}
