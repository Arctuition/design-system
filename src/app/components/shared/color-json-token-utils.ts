import JSZip from "jszip";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedColorToken {
  cssVar: string;    // e.g. --color-label-primary
  hex: string;       // resolved hex, always available for swatches
  displayValue: string; // what to show in CSS: hex for global, var() ref for semantic
  aliasOf?: string;  // original Figma alias e.g. color/global/gray/85
}

export interface CssLine {
  type: "blank" | "comment" | "token" | "brace";
  text: string;
  swatch?: string; // resolved hex for inline swatch
}

// ── JSON imports ───────────────────────────────────────────────────────────

import lightJson  from "../../../../tokens/color/light.tokens.json";
import darkJson   from "../../../../tokens/color/dark.tokens.json";
import globalJson from "../../../../tokens/color/color-global-value.tokens.json";

// ── Flatten JSON → ParsedColorToken[] ─────────────────────────────────────

function flattenColorTokens(obj: Record<string, any>, prefix = ""): ParsedColorToken[] {
  const items: ParsedColorToken[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const path = prefix ? `${prefix}-${key}` : key;
    if (val && typeof val === "object" && "$value" in val) {
      const raw = (val as any).$value;
      const hex: string = raw && typeof raw === "object" && "hex" in raw ? raw.hex : String(raw);
      const aliasData = (val as any).$extensions?.["com.figma.aliasData"];
      const aliasOf: string | undefined = aliasData?.targetVariableName;
      const displayValue = aliasOf ? `var(--${aliasOf.replace(/\//g, "-")})` : hex;
      items.push({ cssVar: `--${path}`, hex, displayValue, ...(aliasOf ? { aliasOf } : {}) });
    } else if (val && typeof val === "object") {
      items.push(...flattenColorTokens(val as Record<string, any>, path));
    }
  }
  return items;
}

// ── Public accessors ───────────────────────────────────────────────────────

export function getLightColorTokens():  ParsedColorToken[] { return flattenColorTokens(lightJson  as Record<string, any>); }
export function getDarkColorTokens():   ParsedColorToken[] { return flattenColorTokens(darkJson   as Record<string, any>); }
export function getGlobalColorTokens(): ParsedColorToken[] { return flattenColorTokens(globalJson as Record<string, any>); }

// ── Grouping helpers ───────────────────────────────────────────────────────

const TIER = new Set(["primary", "secondary", "tertiary", "quaternary", "on", "dark", "light", "increased", "contrast", "default", "dim", "bright", "extra", "high", "higher"]);

function getSemanticGroup(cssVar: string): string {
  const segs = cssVar.replace("--color-", "").split("-");
  const cat = segs[0];
  if (cat !== "label") {
    const MAP: Record<string, string> = { surface: "Surface", fill: "Fill", border: "Border", divider: "Divider" };
    return MAP[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
  }
  const sub1 = segs[1];
  if (!sub1 || TIER.has(sub1)) return "Label / Neutral";
  if (sub1 === "caution" && segs[2] === "yellow") return "Label / Caution Yellow";
  const SUB: Record<string, string> = { brand: "Brand", action: "Action", success: "Success", caution: "Caution", danger: "Danger" };
  return `Label / ${SUB[sub1] ?? sub1.charAt(0).toUpperCase() + sub1.slice(1)}`;
}

function getGlobalGroup(cssVar: string): string {
  const path = cssVar.replace("--color-global-", "");
  const transpIdx = path.indexOf("-transparency");
  let baseColor: string;
  let variant: string | null = null;
  if (transpIdx >= 0) {
    baseColor = path.slice(0, transpIdx);
    variant = path.slice(transpIdx).includes("light") ? "Transparency On Light" : "Transparency On Dark";
  } else {
    baseColor = path.replace(/-[\d.]+$/, "");
  }
  const baseLabel = baseColor.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
  return variant ? `${baseLabel} / ${baseLabel} ${variant}` : `${baseLabel} / ${baseLabel}`;
}

// ── CssLine builders ───────────────────────────────────────────────────────

function blank(): CssLine { return { type: "blank", text: "" }; }
function brace(text: string): CssLine { return { type: "brace", text }; }
function comment(text: string): CssLine { return { type: "comment", text: `/* ${text} */` }; }
function sectionComment(text: string): CssLine {
  return { type: "comment", text: `/* =========================================\n * ${text}\n * ========================================= */` };
}
function tokenLine(t: ParsedColorToken): CssLine {
  return { type: "token", text: `  ${t.cssVar}: ${t.displayValue};`, swatch: t.hex };
}

export function buildSemanticCssLines(tokens: ParsedColorToken[], sectionHeader: string): CssLine[] {
  const lines: CssLine[] = [brace(":root {"), blank(), sectionComment(sectionHeader), blank()];

  // Group preserving insertion order
  const groupMap = new Map<string, ParsedColorToken[]>();
  for (const t of tokens) {
    const g = getSemanticGroup(t.cssVar);
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(t);
  }

  for (const [groupName, groupTokens] of groupMap) {
    lines.push(comment(groupName), blank());
    groupTokens.forEach(t => lines.push(tokenLine(t)));
    lines.push(blank(), blank());
  }

  lines.push(brace("}"));
  return lines;
}

export function buildGlobalCssLines(tokens: ParsedColorToken[]): CssLine[] {
  const lines: CssLine[] = [brace(":root {"), blank(), sectionComment("Global tokens"), blank()];

  const groupMap = new Map<string, ParsedColorToken[]>();
  for (const t of tokens) {
    const g = getGlobalGroup(t.cssVar);
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(t);
  }

  for (const [groupName, groupTokens] of groupMap) {
    lines.push(comment(groupName), blank());
    groupTokens.forEach(t => lines.push(tokenLine(t)));
    lines.push(blank(), blank());
  }

  lines.push(brace("}"));
  return lines;
}

// ── Plain CSS string for export (same grouped format) ─────────────────────

function cssLinesToString(lines: CssLine[]): string {
  return lines.map(l => l.text).join("\n");
}

// ── Export as ZIP (3 files) ────────────────────────────────────────────────

export async function exportColorCSSAsZip(): Promise<void> {
  const zip = new JSZip();
  zip.file("color-light.css",  cssLinesToString(buildSemanticCssLines(getLightColorTokens(),  "SEMANTIC TOKENS — LIGHT MODE")));
  zip.file("color-dark.css",   cssLinesToString(buildSemanticCssLines(getDarkColorTokens(),   "SEMANTIC TOKENS — DARK MODE")));
  zip.file("color-global.css", cssLinesToString(buildGlobalCssLines(getGlobalColorTokens())));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "color-tokens.zip";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Legacy grouping (kept for ColorSwatchesPage) ───────────────────────────

export function groupColorTokens(tokens: ParsedColorToken[]): { groupName: string; tokens: ParsedColorToken[] }[] {
  const map = new Map<string, ParsedColorToken[]>();
  for (const t of tokens) {
    const g = t.cssVar.startsWith("--color-global") ? getGlobalGroup(t.cssVar) : getSemanticGroup(t.cssVar);
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(t);
  }
  return Array.from(map.entries()).map(([groupName, tokens]) => ({ groupName, tokens }));
}
