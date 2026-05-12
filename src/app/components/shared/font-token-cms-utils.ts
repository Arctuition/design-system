import type { FontToken, FontTokenSet, FontTokenMode } from "../../store/data-store";
import JSZip from "jszip";

// ─── Parsing ───

/**
 * Recursively flattens a Figma font-variable export tree. Leaves have `$value`
 * (string for typeface, number for size/weight/letter-spacing). The Figma
 * scope hint (`$extensions["com.figma.scopes"]`) is captured so the CSS
 * writer can pick the right unit per scope.
 */
export function flattenFontTokens(obj: any, prefix: string = ""): FontToken[] {
  const tokens: FontToken[] = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;

  const hasValue =
    Object.prototype.hasOwnProperty.call(obj, "$value") ||
    Object.prototype.hasOwnProperty.call(obj, "value");

  if (hasValue) {
    const rawValue = obj["$value"] ?? obj["value"];
    if (rawValue === undefined || rawValue === null) return tokens;
    const scopes: string[] = obj?.$extensions?.["com.figma.scopes"] ?? [];
    const aliasName = obj?.$extensions?.["com.figma.aliasData"]?.targetVariableName;
    tokens.push({
      name: prefix || "unnamed",
      value: typeof rawValue === "number" ? rawValue : String(rawValue),
      scope: scopes[0],
      aliasOf: typeof aliasName === "string" ? aliasName : undefined,
    });
    return tokens;
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const childPrefix = prefix ? `${prefix}/${key}` : key;
    if (typeof val === "object" && val !== null) {
      tokens.push(...flattenFontTokens(val, childPrefix));
    }
  }
  return tokens;
}

/**
 * Parses a single Figma font-tokens JSON. Accepts either the wrapped shape
 * (`{ font: {...} }`) or anything top-level — falls back to flatten-everything.
 */
export function parseFontTokenFile(data: any): FontToken[] {
  if (!data || typeof data !== "object") return [];
  if (Object.prototype.hasOwnProperty.call(data, "font")) {
    return flattenFontTokens(data.font, "font");
  }
  return flattenFontTokens(data);
}

// ─── File name matching for bulk upload ───

export const EXPECTED_FILES: Record<FontTokenMode, string> = {
  deviceMobile: "device-mobile.tokens.json",
  deviceTablet: "device-tablet.tokens.json",
  webMobile: "web-mobile.tokens.json",
  webDesktop: "web-desktop.tokens.json",
};

export type MatchSlot = FontTokenMode;

/**
 * Maps a file name to a FontTokenSet slot based on known patterns.
 * Case-insensitive, tolerant of path segments and naming variants.
 * More-specific patterns are checked before substrings they contain.
 */
export function matchFileToSlot(fileName: string): MatchSlot | null {
  const base = fileName.toLowerCase().split("/").pop() || "";
  if (base.includes("device-mobile")) return "deviceMobile";
  if (base.includes("device-tablet")) return "deviceTablet";
  if (base.includes("web-mobile")) return "webMobile";
  if (base.includes("web-desktop")) return "webDesktop";
  return null;
}

export interface BulkUploadAnalysis {
  matched: Array<{ slot: MatchSlot; file: File; expected: string }>;
  duplicates: Array<{ slot: MatchSlot; files: File[] }>;
  unmatched: File[];
  missing: MatchSlot[];
}

export function analyzeBulkFiles(files: File[]): BulkUploadAnalysis {
  const bySlot = new Map<MatchSlot, File[]>();
  const unmatched: File[] = [];

  for (const file of files) {
    const slot = matchFileToSlot(file.name);
    if (!slot) {
      unmatched.push(file);
      continue;
    }
    const arr = bySlot.get(slot) ?? [];
    arr.push(file);
    bySlot.set(slot, arr);
  }

  const matched: BulkUploadAnalysis["matched"] = [];
  const duplicates: BulkUploadAnalysis["duplicates"] = [];
  for (const [slot, list] of bySlot.entries()) {
    matched.push({ slot, file: list[0], expected: EXPECTED_FILES[slot] });
    if (list.length > 1) duplicates.push({ slot, files: list.slice(1) });
  }

  const allSlots: MatchSlot[] = ["deviceMobile", "deviceTablet", "webMobile", "webDesktop"];
  const missing = allSlots.filter((s) => !bySlot.has(s));

  return { matched, duplicates, unmatched, missing };
}

// ─── Grouping ───

export interface GroupedFontTokens {
  groupName: string;
  tokens: FontToken[];
}

/**
 * Group key from a font-token path. `font/size/body/medium` → "Font Size",
 * `font/font-weight/regular` → "Font Weight", `font/typeface/text` → "Typeface",
 * `font/letter-spacing/title/large` → "Letter Spacing".
 */
export function getFontGroupKey(name: string): string {
  const rest = name.startsWith("font/") ? name.slice(5) : name;
  const segs = rest.split("/");
  const head = segs[0] || "";
  if (head === "size") return "Font Size";
  if (head === "line-height") return "Line Height";
  if (head === "font-weight") return "Font Weight";
  if (head === "typeface") return "Typeface";
  if (head === "letter-spacing") return "Letter Spacing";
  return head.charAt(0).toUpperCase() + head.slice(1) || "Other";
}

const GROUP_ORDER = [
  "Typeface",
  "Font Size",
  "Line Height",
  "Font Weight",
  "Letter Spacing",
];

export function groupFontTokensStable(tokens: FontToken[]): GroupedFontTokens[] {
  const map = new Map<string, FontToken[]>();
  const seenOrder: string[] = [];
  for (const t of tokens) {
    const key = getFontGroupKey(t.name);
    if (!map.has(key)) {
      map.set(key, []);
      seenOrder.push(key);
    }
    map.get(key)!.push(t);
  }
  const result: GroupedFontTokens[] = [];
  for (const key of GROUP_ORDER) {
    if (map.has(key)) {
      result.push({ groupName: key, tokens: map.get(key)! });
      map.delete(key);
    }
  }
  for (const key of seenOrder) {
    if (map.has(key)) {
      result.push({ groupName: key, tokens: map.get(key)! });
    }
  }
  return result;
}

// ─── CSS VAR output ───

/** `font/size/body/medium` → `--font-size-body-medium`. */
export function tokenNameToCSSVar(name: string): string {
  return "--" + name.replace(/\//g, "-");
}

/**
 * Format a font token's value for CSS output, using the Figma scope hint to
 * decide the unit. Unscoped string values (e.g. a typeface name) are emitted
 * raw; numeric line-height / font-size get `px`; font-weight stays unitless;
 * letter-spacing (ALL_SCOPES) gets `px` with 2-decimal precision.
 */
export function formatFontValueForCss(token: FontToken): string {
  if (typeof token.value === "string") return token.value;
  const scope = token.scope ?? "";
  if (scope === "FONT_SIZE" || scope === "LINE_HEIGHT") return `${token.value}px`;
  if (scope === "FONT_STYLE") return String(token.value);
  if (scope === "ALL_SCOPES") return `${parseFloat(token.value.toFixed(2))}px`;
  // Fallback: numeric without scope info — emit raw.
  return String(token.value);
}

export function buildFontCSSOutput(tokens: FontToken[], header: string): string {
  const groups = groupFontTokensStable(tokens);
  const out: string[] = [];
  out.push(":root {");
  out.push("");
  out.push(`\t/* =========================================`);
  out.push(`\t   ${header}`);
  out.push(`\t   ========================================= */`);
  out.push("");

  for (const group of groups) {
    out.push(`\t/* ${group.groupName} */`);
    for (const token of group.tokens) {
      const cssName = tokenNameToCSSVar(token.name);
      const cssValue = token.aliasOf
        ? `var(${tokenNameToCSSVar(token.aliasOf)})`
        : formatFontValueForCss(token);
      out.push(`\t${cssName}: ${cssValue};`);
    }
    out.push("");
  }

  out.push("}");
  out.push("");
  return out.join("\n");
}

const MODE_HEADERS: Record<FontTokenMode, string> = {
  deviceMobile: "DEVICE MOBILE — iPhone / Android phone",
  deviceTablet: "DEVICE TABLET — iPad / Android tablet",
  webMobile: "WEB MOBILE — Browser < 768px",
  webDesktop: "WEB DESKTOP — Browser ≥ 768px",
};

const MODE_FILENAMES: Record<FontTokenMode, string> = {
  deviceMobile: "font-device-mobile.css",
  deviceTablet: "font-device-tablet.css",
  webMobile: "font-web-mobile.css",
  webDesktop: "font-web-desktop.css",
};

export async function exportFontCSSAsZip(set: FontTokenSet): Promise<void> {
  const zip = new JSZip();
  const entries: Array<[FontTokenMode, FontToken[]]> = [
    ["deviceMobile", set.deviceMobile],
    ["deviceTablet", set.deviceTablet],
    ["webMobile", set.webMobile],
    ["webDesktop", set.webDesktop],
  ];
  for (const [key, tokens] of entries) {
    if (tokens.length === 0) continue;
    zip.file(MODE_FILENAMES[key], buildFontCSSOutput(tokens, MODE_HEADERS[key]));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "font-tokens.zip";
  a.click();
  URL.revokeObjectURL(url);
}
