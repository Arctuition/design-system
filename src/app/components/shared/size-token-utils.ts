import type { SizeToken, SizeTokenSet, SizeTokenMode } from "../../store/data-store";
import JSZip from "jszip";

// ─── Parsing ───

/**
 * Recursively flattens a Figma variable export tree. Leaves take one of three
 * Figma alias shapes:
 *
 *   1. Numeric value, optionally with `$extensions.com.figma.aliasData.targetVariableName`
 *      → semantic token pointing at a global. We preserve the alias name.
 *
 *   2. String value of the form `"{size.padding-component-lg}"` (Figma's
 *      in-collection reference syntax) → comp/semantic token pointing at
 *      another semantic. We parse the path inside the braces as the alias name.
 *
 *   3. Plain numeric value with no alias → leaf / global token.
 *
 * `$type` is accepted as `"number"`, `"dimension"`, or absent. Anything else
 * is treated as a non-size token and skipped (preserves callers that mix
 * collections in one file).
 */
export function flattenSizeTokens(obj: any, prefix: string = ""): SizeToken[] {
  const tokens: SizeToken[] = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;

  const hasValue = Object.prototype.hasOwnProperty.call(obj, "$value") || Object.prototype.hasOwnProperty.call(obj, "value");

  if (hasValue) {
    const rawValue = obj["$value"] ?? obj["value"];
    const rawType = obj["$type"] ?? obj["type"];
    if (rawType) {
      const t = String(rawType).toLowerCase();
      if (t !== "number" && t !== "dimension") return tokens;
    }

    const ext = obj?.$extensions ?? {};
    const aliasFromExt = ext?.["com.figma.aliasData"]?.targetVariableName;
    const variableId = ext?.["com.figma.variableId"];
    const rawScopes = ext?.["com.figma.scopes"];
    const description = obj["$description"] ?? obj["description"] ?? obj["comment"];
    const meta: Pick<SizeToken, "description" | "figmaVariableId" | "scopes"> = {};
    if (typeof description === "string" && description) meta.description = description;
    if (typeof variableId === "string") meta.figmaVariableId = variableId;
    if (Array.isArray(rawScopes)) meta.scopes = rawScopes.filter((s) => typeof s === "string");

    // Shape 2: in-collection string reference `"{size.padding-component-lg}"`.
    // Convert the brace path into a slash path so it matches the global-alias
    // format coming from $extensions, which uses `size-global/16` style.
    if (typeof rawValue === "string") {
      const m = /^\s*\{([^{}]+)\}\s*$/.exec(rawValue);
      if (m) {
        tokens.push({
          name: prefix || "unnamed",
          value: 0,                                     // numeric value is unknown at parse time; resolved at render via aliasOf
          aliasOf: m[1].replace(/\./g, "/"),            // "size.padding-component-lg" → "size/padding-component-lg"
          ...meta,
        });
      }
      return tokens;
    }

    // Shape 1 / 3: numeric value, optionally aliased via $extensions.
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(numericValue)) return tokens;

    tokens.push({
      name: prefix || "unnamed",
      value: numericValue,
      aliasOf: typeof aliasFromExt === "string" ? aliasFromExt : undefined,
      ...meta,
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
 * (`{ size: {...} }`) or the global shape (`{ "size-global": {...} }`) or
 * the breakpoint shape (`{ breakpoint: {...} }`).
 *
 * Files lacking ALL of those top-level keys are rejected — previously the
 * parser fell back to a permissive `flattenSizeTokens(data)` which produced
 * nonsense tokens when a color or font JSON was misrouted to a size slot.
 * Use `validateSizeFileShape` to inspect ahead of time and surface a clear
 * "wrong slot" error to the user.
 */
export function parseSizeTokenFile(data: any): SizeToken[] {
  if (!data || typeof data !== "object") return [];

  if (Object.prototype.hasOwnProperty.call(data, "size")) {
    return flattenSizeTokens(data.size, "size");
  }
  if (Object.prototype.hasOwnProperty.call(data, "size-global")) {
    return flattenSizeTokens(data["size-global"], "size-global");
  }
  if (Object.prototype.hasOwnProperty.call(data, "breakpoint")) {
    return flattenSizeTokens(data.breakpoint, "breakpoint");
  }
  return [];
}

/**
 * Check whether `data` has a top-level key that matches what we'd expect
 * to parse out of a size JSON for the given slot. Used by the editor to
 * abort with a "looks like the wrong slot" toast instead of silently
 * importing zero tokens.
 *
 * Returns a tagged result so the caller can present a helpful message:
 *   - `valid: true`  — at least one expected key is present
 *   - `valid: false` — file is not size-shaped; show the foundKeys to the
 *     user so they can spot e.g. that they uploaded a `color` JSON.
 */
export interface SizeFileShape {
  valid: boolean;
  expectedKeys: string[];
  foundKeys: string[];
}

export function validateSizeFileShape(data: any, slot: MatchSlot): SizeFileShape {
  const expectedKeys =
    slot === "breakpoint" ? ["breakpoint"] :
    slot === "global"     ? ["size-global", "size"] :
                            ["size"];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, expectedKeys, foundKeys: [] };
  }
  const foundKeys = Object.keys(data).filter((k) => !k.startsWith("$"));
  const valid = expectedKeys.some((k) => foundKeys.includes(k));
  return { valid, expectedKeys, foundKeys };
}

// ─── File name matching for bulk upload ───

export const EXPECTED_FILES: Record<SizeTokenMode | "global" | "breakpoint", string> = {
  global: "size-global-value.tokens.json",
  deviceMobile: "device-mobile.tokens.json",
  deviceTablet: "device-tablet.tokens.json",
  webMobile: "web-mobile.tokens.json",
  webTablet: "web-tablet.tokens.json",
  webDesktop: "web-desktop.tokens.json",
  webDesktopLarge: "web-desktop-large.tokens.json",
  breakpoint: "breakpoint.tokens.json",
};

export type MatchSlot = keyof typeof EXPECTED_FILES;

/**
 * Maps a file name to a SizeTokenSet slot based on known patterns.
 * Case-insensitive, tolerant of extra path segments or slight naming variants.
 * Order matters: more-specific patterns (web-desktop-large, web-tablet) are
 * checked before the substrings they contain (web-desktop, web).
 */
export function matchFileToSlot(fileName: string): MatchSlot | null {
  const base = fileName.toLowerCase().split("/").pop() || "";
  // Figma sometimes exports the size-global file mis-named as
  // `color-global-value.tokens.json` (it reuses the color collection's name).
  // Accept either name to avoid a manual rename step.
  if (
    base === "global.tokens.json" ||
    base === "size-global.tokens.json" ||
    base === "size-global-value.tokens.json" ||
    base === "color-global-value.tokens.json"
  ) return "global";
  if (base.includes("breakpoint")) return "breakpoint";
  if (base.includes("device-mobile")) return "deviceMobile";
  if (base.includes("device-tablet")) return "deviceTablet";
  if (base.includes("web-desktop-large")) return "webDesktopLarge";
  if (base.includes("web-tablet")) return "webTablet";
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

  const allSlots: MatchSlot[] = [
    "global",
    "deviceMobile",
    "deviceTablet",
    "webMobile",
    "webTablet",
    "webDesktop",
    "webDesktopLarge",
    "breakpoint",
  ];
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
  if (name.startsWith("breakpoint/")) return "Breakpoints";
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
  "Breakpoints",
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

const MODE_HEADERS: Record<SizeTokenMode | "global" | "breakpoint", string> = {
  global: "GLOBAL SIZE SCALE",
  deviceMobile: "DEVICE MOBILE — iPhone / Android phone",
  deviceTablet: "DEVICE TABLET — iPad / Android tablet",
  webMobile: "WEB MOBILE — Browser < 768px",
  webTablet: "WEB TABLET — Browser 768–1199px",
  webDesktop: "WEB DESKTOP — Browser 1200–1399px",
  webDesktopLarge: "WEB DESKTOP LARGE — Browser ≥ 1400px",
  breakpoint: "BREAKPOINTS — viewport-width thresholds (decoupled from modes)",
};

const MODE_FILENAMES: Record<SizeTokenMode | "global" | "breakpoint", string> = {
  global: "size-global.css",
  deviceMobile: "size-device-mobile.css",
  deviceTablet: "size-device-tablet.css",
  webMobile: "size-web-mobile.css",
  webTablet: "size-web-tablet.css",
  webDesktop: "size-web-desktop.css",
  webDesktopLarge: "size-web-desktop-large.css",
  breakpoint: "breakpoint.css",
};

export async function exportSizeCSSAsZip(
  set: SizeTokenSet,
  breakpoints?: SizeToken[]
): Promise<void> {
  const zip = new JSZip();
  const entries: Array<[SizeTokenMode | "global" | "breakpoint", SizeToken[]]> = [
    ["global", set.global],
    ["deviceMobile", set.deviceMobile],
    ["deviceTablet", set.deviceTablet],
    ["webMobile", set.webMobile],
    ["webTablet", set.webTablet],
    ["webDesktop", set.webDesktop],
    ["webDesktopLarge", set.webDesktopLarge],
    ["breakpoint", breakpoints ?? []],
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
