import type { SizeToken, SizeTokenSet, SizeTokenMode } from "../../store/data-store";
import JSZip from "jszip";

// ─── Parsing ───

/**
 * Recursively flattens a Figma variable export tree. Leaves have `$value`
 * (numeric) and optionally `$extensions.com.figma.aliasData.targetVariableName`
 * pointing at a global token, which we preserve as `aliasOf`.
 */
export function flattenSizeTokens(obj: any, prefix: string = ""): SizeToken[] {
  const tokens: SizeToken[] = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;

  const hasValue = Object.prototype.hasOwnProperty.call(obj, "$value") || Object.prototype.hasOwnProperty.call(obj, "value");

  if (hasValue) {
    const rawValue = obj["$value"] ?? obj["value"];
    const rawType = obj["$type"] ?? obj["type"];
    // Only accept numeric tokens
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(numericValue)) return tokens;
    if (rawType && String(rawType).toLowerCase() !== "number") return tokens;

    const aliasName = obj?.$extensions?.["com.figma.aliasData"]?.targetVariableName;
    tokens.push({
      name: prefix || "unnamed",
      value: numericValue,
      aliasOf: typeof aliasName === "string" ? aliasName : undefined,
    });
    return tokens;
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const childPrefix = prefix ? `${prefix}/${key}` : key;
    if (typeof val === "object" && val !== null) {
      tokens.push(...flattenSizeTokens(val, childPrefix));
    }
  }
  return tokens;
}

/**
 * Parses a single Figma size-tokens JSON. Accepts either the semantic shape
 * (`{ size: {...} }`) or the global shape (`{ "size-global": {...} }`). Any
 * other top-level key is flattened as-is.
 */
export function parseSizeTokenFile(data: any): SizeToken[] {
  if (!data || typeof data !== "object") return [];

  if (Object.prototype.hasOwnProperty.call(data, "size")) {
    return flattenSizeTokens(data.size, "size");
  }
  if (Object.prototype.hasOwnProperty.call(data, "size-global")) {
    return flattenSizeTokens(data["size-global"], "size-global");
  }
  // Fallback: flatten everything
  return flattenSizeTokens(data);
}

// ─── File name matching for bulk upload ───

export const EXPECTED_FILES: Record<SizeTokenMode | "global", string> = {
  global: "global.tokens.json",
  deviceMobile: "device-mobile.tokens.json",
  deviceTablet: "device-tablet.tokens.json",
  webMobile: "web-mobile.tokens.json",
  webDesktop: "web-desktop.tokens.json",
};

export type MatchSlot = keyof typeof EXPECTED_FILES;

/**
 * Maps a file name to a SizeTokenSet slot based on known patterns.
 * Case-insensitive, tolerant of extra path segments or slight naming variants.
 */
export function matchFileToSlot(fileName: string): MatchSlot | null {
  const base = fileName.toLowerCase().split("/").pop() || "";
  if (base === "global.tokens.json" || base === "size-global.tokens.json") return "global";
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
    if (list.length === 1) {
      matched.push({ slot, file: list[0], expected: EXPECTED_FILES[slot] });
    } else {
      // Keep first as the matched one, flag the rest as duplicates
      matched.push({ slot, file: list[0], expected: EXPECTED_FILES[slot] });
      duplicates.push({ slot, files: list.slice(1) });
    }
  }

  const allSlots: MatchSlot[] = ["global", "deviceMobile", "deviceTablet", "webMobile", "webDesktop"];
  const missing = allSlots.filter((s) => !bySlot.has(s));

  return { matched, duplicates, unmatched, missing };
}

// ─── Grouping ───

export interface GroupedSizeTokens {
  groupName: string;
  tokens: SizeToken[];
}

/**
 * Group a list of size tokens by category, preserving first-seen order.
 * Categories are derived from the segment after "size/" (e.g. "spacing-inline-md" → "Spacing Inline").
 */
export function getSizeGroupKey(name: string): string {
  // Strip leading "size/" or "size-global/"
  if (name.startsWith("size-global/")) return "Global Scale";
  const rest = name.startsWith("size/") ? name.slice(5) : name;

  // Nested: font/* and comp/*
  if (rest.startsWith("font/")) {
    const parts = rest.split("/");
    // size/font/body/large → Font / Body
    // size/font/body/line-height/large → Font / Body Line Height
    // size/font/title/* → Font / Title
    const section = parts[1];
    const sub = parts[2];
    const sectionLabel = section ? section.charAt(0).toUpperCase() + section.slice(1) : "Font";
    if (sub === "line-height") return `Font / ${sectionLabel} Line Height`;
    return `Font / ${sectionLabel}`;
  }
  if (rest.startsWith("comp/")) {
    const parts = rest.split("/");
    const compName = parts[1] || "other";
    const display = compName.charAt(0).toUpperCase() + compName.slice(1);
    return `Component / ${display}`;
  }

  // Flat categories
  if (rest.startsWith("spacing-inline")) return "Spacing — Inline";
  if (rest.startsWith("spacing-stack")) return "Spacing — Stack";
  if (rest.startsWith("padding-component")) return "Padding — Component";
  if (rest.startsWith("padding")) return "Padding";
  if (rest.startsWith("height")) return "Heights";
  if (rest.startsWith("icon")) return "Icon Sizes";
  if (rest.startsWith("radius")) return "Border Radius";
  if (rest.startsWith("layout")) return "Layout Grid";
  if (rest.startsWith("touch-target")) return "Touch Target";
  return "Other";
}

/**
 * Preferred display order for groups on the preview page. Groups not in this
 * list are appended in first-seen order.
 */
const GROUP_ORDER = [
  "Spacing — Inline",
  "Spacing — Stack",
  "Padding",
  "Padding — Component",
  "Heights",
  "Icon Sizes",
  "Border Radius",
  "Layout Grid",
  "Touch Target",
  "Font / Body",
  "Font / Body Line Height",
  "Font / Title",
  "Font / Title Line Height",
  "Component / Button",
  "Component / Input",
  "Component / Dialog",
  "Component / Tag",
  "Global Scale",
];

export function groupSizeTokensStable(tokens: SizeToken[]): GroupedSizeTokens[] {
  const map = new Map<string, SizeToken[]>();
  const seenOrder: string[] = [];
  for (const t of tokens) {
    const key = getSizeGroupKey(t.name);
    if (!map.has(key)) {
      map.set(key, []);
      seenOrder.push(key);
    }
    map.get(key)!.push(t);
  }

  // Sort Global Scale numerically
  if (map.has("Global Scale")) {
    map.get("Global Scale")!.sort((a, b) => a.value - b.value);
  }

  // Compose in preferred order, then appended extras
  const result: GroupedSizeTokens[] = [];
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

/** `size/font/body/large` → `--size-font-body-large`, `size-global/16` → `--size-global-16`. */
export function tokenNameToCSSVar(name: string): string {
  return "--" + name.replace(/\//g, "-");
}

/**
 * Build CSS output for one token set. Leaf values are emitted as `Npx`; aliased
 * values are emitted as `var(--alias)` so the token architecture survives into
 * the exported CSS.
 */
export function buildSizeCSSOutput(
  tokens: SizeToken[],
  header: string
): string {
  const groups = groupSizeTokensStable(tokens);
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
        : `${token.value}px`;
      out.push(`\t${cssName}: ${cssValue};`);
    }
    out.push("");
  }

  out.push("}");
  out.push("");
  return out.join("\n");
}

const MODE_HEADERS: Record<SizeTokenMode | "global", string> = {
  global: "GLOBAL SIZE SCALE",
  deviceMobile: "DEVICE MOBILE — iPhone / Android phone",
  deviceTablet: "DEVICE TABLET — iPad / Android tablet",
  webMobile: "WEB MOBILE — Browser ≤ 768px",
  webDesktop: "WEB DESKTOP — Browser on desktop",
};

const MODE_FILENAMES: Record<SizeTokenMode | "global", string> = {
  global: "size-global.css",
  deviceMobile: "size-device-mobile.css",
  deviceTablet: "size-device-tablet.css",
  webMobile: "size-web-mobile.css",
  webDesktop: "size-web-desktop.css",
};

export async function exportSizeCSSAsZip(set: SizeTokenSet): Promise<void> {
  const zip = new JSZip();
  const entries: Array<[SizeTokenMode | "global", SizeToken[]]> = [
    ["global", set.global],
    ["deviceMobile", set.deviceMobile],
    ["deviceTablet", set.deviceTablet],
    ["webMobile", set.webMobile],
    ["webDesktop", set.webDesktop],
  ];
  for (const [key, tokens] of entries) {
    if (tokens.length === 0) continue;
    zip.file(MODE_FILENAMES[key], buildSizeCSSOutput(tokens, MODE_HEADERS[key]));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "size-tokens.zip";
  a.click();
  URL.revokeObjectURL(url);
}
