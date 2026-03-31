import type { ColorToken } from "../../store/data-store";
import JSZip from "jszip";

// ─── Color value helpers ───

export function isDirectColorValue(value: string): boolean {
  const v = value.trim();
  if (v.startsWith("{") && v.endsWith("}")) {
    if (v.includes('"hex"') || v.includes('"colorSpace"') || v.includes('"components"')) {
      return true;
    }
    return false;
  }
  if (v.startsWith("$")) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return true;
  if (/^rgba?\s*\(/.test(v)) return true;
  if (/^hsla?\s*\(/.test(v)) return true;
  if (!v.includes("{") && !v.includes("$")) return true;
  return false;
}

export function parseHexAlpha(value: string): { hex6: string; alpha: number; alphaPercent: number } | null {
  const v = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{8}$/.test(v)) return null;
  const hex6 = v.slice(0, 7);
  const alphaHex = v.slice(7, 9);
  const alpha = parseInt(alphaHex, 16) / 255;
  const alphaPercent = Math.round(alpha * 100);
  return { hex6, alpha, alphaPercent };
}

export function resolveTokenReference(value: string, globalMap: Map<string, string>): string | null {
  const v = value.trim();
  let refName = "";
  if (v.startsWith("{") && v.endsWith("}")) {
    refName = v.slice(1, -1).trim();
  } else if (v.startsWith("$")) {
    refName = v.slice(1).trim();
  }
  if (!refName) return null;
  if (globalMap.has(refName)) return globalMap.get(refName)!;
  const dashName = refName.replace(/\./g, "-");
  if (globalMap.has(dashName)) return globalMap.get(dashName)!;
  return null;
}

export function extractColorValue(rawValue: any): string {
  if (typeof rawValue === "string") {
    if (rawValue.startsWith("{") && rawValue.includes('"hex"')) {
      try {
        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed.hex === "string") {
          if (typeof parsed.alpha === "number" && parsed.alpha < 1) {
            const alphaHex = Math.round(parsed.alpha * 255).toString(16).toUpperCase().padStart(2, "0");
            return parsed.hex.toUpperCase() + alphaHex;
          }
          return parsed.hex.toUpperCase();
        }
      } catch {
        // Not valid JSON
      }
    }
    return rawValue;
  } else if (typeof rawValue === "object" && rawValue !== null) {
    if ("hex" in rawValue && typeof rawValue.hex === "string") {
      if (typeof rawValue.alpha === "number" && rawValue.alpha < 1) {
        const alphaHex = Math.round(rawValue.alpha * 255).toString(16).toUpperCase().padStart(2, "0");
        return rawValue.hex.toUpperCase() + alphaHex;
      }
      return rawValue.hex.toUpperCase();
    }
    if ("components" in rawValue && Array.isArray(rawValue.components)) {
      const [r, g, b] = rawValue.components;
      const toHex = (c: number) => Math.round(c * 255).toString(16).toUpperCase().padStart(2, "0");
      let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      if (typeof rawValue.alpha === "number" && rawValue.alpha < 1) {
        hex += toHex(rawValue.alpha);
      }
      return hex;
    }
    if ("r" in rawValue && "g" in rawValue && "b" in rawValue) {
      const { r, g, b, a } = rawValue;
      const toHex = (c: number) => {
        const val = c <= 1 ? Math.round(c * 255) : Math.round(c);
        return val.toString(16).toUpperCase().padStart(2, "0");
      };
      let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      if (typeof a === "number" && a < 1) {
        hex += toHex(a);
      }
      return hex;
    }
  }
  return JSON.stringify(rawValue);
}

export function normalizeTokenValue(value: string): string {
  return extractColorValue(value);
}

// ─── Figma/Tokens Studio JSON Parser ───

export function flattenTokens(obj: any, prefix: string = ""): ColorToken[] {
  const tokens: ColorToken[] = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;

  const hasValue = obj.hasOwnProperty("value") || obj.hasOwnProperty("$value");

  if (hasValue) {
    const rawValue = obj["$value"] ?? obj["value"];
    const rawType = obj["$type"] ?? obj["type"] ?? "";
    const description = obj["$description"] ?? obj["description"] ?? obj["comment"] ?? "";
    const tokenType = String(rawType).toLowerCase();
    if (!rawType || tokenType === "color" || tokenType === "colour") {
      const valueStr = extractColorValue(rawValue);
      tokens.push({
        name: prefix || "unnamed",
        value: valueStr,
        description: typeof description === "string" ? description : "",
      });
    }
    return tokens;
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$") || key === "type" || key === "description") continue;
    if (typeof val === "string") {
      tokens.push({
        name: prefix ? `${prefix}.${key}` : key,
        value: val,
        description: "",
      });
    } else if (typeof val === "object" && val !== null) {
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      tokens.push(...flattenTokens(val, childPrefix));
    }
  }
  return tokens;
}

export function classifyTokenByName(name: string): "global" | "semantic" | null {
  const n = name.toLowerCase();
  if (n.startsWith("color.global.") || n.startsWith("color.global/")) return "global";
  if (n.startsWith("color.") || n.startsWith("color/")) return "semantic";
  return null;
}

export function parseAndClassifyTokens(data: any): { global: ColorToken[]; semantic: ColorToken[] } {
  let allTokens: ColorToken[] = [];

  if (Array.isArray(data)) {
    allTokens = data
      .filter((t: any) => t && (t.name || t.key || t.variable))
      .map((t: any) => ({
        name: t.name || t.key || t.variable || "",
        value: t.value || t.color || t.hex || t["$value"] || "",
        description: t.description || t.desc || t.comment || t["$description"] || "",
      }));
  } else if (typeof data === "object" && data !== null) {
    allTokens = flattenTokens(data);
  }

  const global: ColorToken[] = [];
  const semantic: ColorToken[] = [];

  for (const token of allTokens) {
    const nameClass = classifyTokenByName(token.name);
    if (nameClass === "global") {
      global.push(token);
    } else if (nameClass === "semantic") {
      semantic.push(token);
    } else {
      if (isDirectColorValue(token.value)) {
        global.push(token);
      } else {
        semantic.push(token);
      }
    }
  }

  return { global, semantic };
}

// ─── Grouping logic ───
// Semantic prefix categories
const SEMANTIC_PREFIX_ORDER: Array<[string, string]> = [
  ["Border", "--color-border-"],
  ["Divider", "--color-divider-"],
  ["Fill", "--color-fill-"],
  ["Label", "--color-label-"],
  ["Surface", "--color-surface-"],
];

// Label sub-category detection order (checked against what follows "--color-label-")
const LABEL_SUBCATEGORIES: Array<[string, (rest: string) => boolean]> = [
  ["Label / Brand", (rest) => rest.startsWith("brand")],
  ["Label / Action", (rest) => rest.startsWith("action")],
  ["Label / Success", (rest) => rest.startsWith("success")],
  ["Label / Caution", (rest) => rest.startsWith("caution")],
  ["Label / Danger", (rest) => rest.startsWith("danger")],
  // Neutral: primary/secondary/tertiary/quaternary directly after "color.label."
  ["Label / Neutral", (rest) => /^(primary|secondary|tertiary|quaternary)/.test(rest)],
];

// Global color families
const GLOBAL_FAMILY_ORDER: Array<[string, string]> = [
  ["Blue", "blue"],
  ["Brand Orange", "brandorange"],
  ["Gray", "gray"],
  ["Green", "green"],
  ["Orange", "orange"],
  ["Red", "red"],
  ["Yellow", "yellow"],
];

function tokenNameToCSSVar(name: string): string {
  return "--" + name.replace(/[./]/g, "-");
}

function tokenValueToCSS(value: string): string {
  const v = normalizeTokenValue(value).trim();
  if (v.startsWith("{") && v.endsWith("}")) {
    const refName = v.slice(1, -1).trim();
    return `var(${tokenNameToCSSVar(refName)})`;
  }
  if (v.startsWith("$")) {
    const refName = v.slice(1).trim();
    return `var(${tokenNameToCSSVar(refName)})`;
  }
  return v;
}

/**
 * Gets the semantic group key for a token.
 * Uses the token's dot-notation name (e.g. "color.border.primary" → "Border").
 */
export function getSemanticGroupKey(tokenName: string): string {
  const cssName = tokenNameToCSSVar(tokenName);
  
  // Special handling for Label tokens: split into sub-categories
  const labelPrefix = "--color-label-";
  if (cssName.startsWith(labelPrefix)) {
    const rest = cssName.slice(labelPrefix.length);
    for (const [label, matcher] of LABEL_SUBCATEGORIES) {
      if (matcher(rest)) return label;
    }
    return "Label / Other";
  }
  
  for (const [label, prefix] of SEMANTIC_PREFIX_ORDER) {
    if (label === "Label") continue; // Already handled above
    if (cssName.startsWith(prefix)) return label;
  }
  return "Other Semantic";
}

/**
 * Gets the global family group key for a token.
 * Uses the token's dot-notation name (e.g. "color.global.gray.100" → "Gray").
 */
export function getGlobalGroupKey(tokenName: string): string {
  const cssName = tokenNameToCSSVar(tokenName);
  const rest = cssName.replace("--color-global-", "");

  // Check for transparency sub-families first
  const transparencyMatch = rest.match(/^([a-z]+(?:-[a-z]+)?)-transparency-on-(light|dark)/);
  if (transparencyMatch) {
    const baseFam = transparencyMatch[1];
    const mode = transparencyMatch[2];
    const normalizedBase = baseFam.replace(/-/g, "");
    const parentDisplay = familyKeyToDisplay(normalizedBase);
    const childDisplay = familyKeyToDisplay(`${normalizedBase}-transparency-on-${mode}`);
    return `${parentDisplay} / ${childDisplay}`;
  }

  // Check specific families — use "Parent / Parent" format for tiered sidebar
  if (rest.startsWith("brand-orange") || rest.startsWith("brandorange")) return "Brand Orange / Brand Orange";
  for (const [display, fam] of GLOBAL_FAMILY_ORDER) {
    if (fam !== "brandorange" && rest.startsWith(fam)) return `${display} / ${display}`;
  }
  return "Other Global";
}

function familyKeyToDisplay(key: string): string {
  const displayMap: Record<string, string> = {};
  for (const [display, fam] of GLOBAL_FAMILY_ORDER) {
    displayMap[fam] = display;
  }

  const transpMatch = key.match(/^(.+)-transparency-on-(light|dark)$/);
  if (transpMatch) {
    const baseFam = transpMatch[1];
    const mode = transpMatch[2];
    const baseDisplay = displayMap[baseFam] || baseFam.charAt(0).toUpperCase() + baseFam.slice(1);
    const modeDisplay = mode === "light" ? "On Light" : "On Dark";
    return `${baseDisplay} Transparency ${modeDisplay}`;
  }

  return displayMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

// ─── Stable grouping: preserve original order ───

export interface GroupedTokens {
  groupName: string;
  tokens: ColorToken[];
}

/**
 * Groups tokens while preserving the original JSON order.
 * The first token of each group determines that group's position.
 * All subsequent tokens of the same group are collected under the first one.
 */
function stableGroupTokens(
  tokens: ColorToken[],
  getGroupKey: (tokenName: string) => string
): GroupedTokens[] {
  const groupOrder: string[] = [];
  const groupMap = new Map<string, ColorToken[]>();

  for (const token of tokens) {
    const key = getGroupKey(token.name);
    if (!groupMap.has(key)) {
      groupOrder.push(key);
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(token);
  }

  return groupOrder.map((key) => ({
    groupName: key,
    tokens: groupMap.get(key)!,
  }));
}

export function groupSemanticTokensStable(tokens: ColorToken[]): GroupedTokens[] {
  return stableGroupTokens(tokens, getSemanticGroupKey);
}

/**
 * Extracts the trailing numeric value from a token name for sorting.
 * e.g. "color.global.gray.100" → 100, "color.global.gray.02" → 2
 */
function extractTrailingNumber(tokenName: string): number {
  const match = tokenName.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : Infinity;
}

export function groupGlobalTokensStable(tokens: ColorToken[]): GroupedTokens[] {
  const groups = stableGroupTokens(tokens, getGlobalGroupKey);
  // Sort tokens within each group by their numeric suffix (ascending)
  for (const group of groups) {
    group.tokens.sort((a, b) => extractTrailingNumber(a.name) - extractTrailingNumber(b.name));
  }
  return groups;
}

// ─── CSS VAR Export ───

function formatBlock(title: string, items: Array<{ cssName: string; cssValue: string }>): string {
  const lines: string[] = [];
  if (title) {
    lines.push(`/* ${title} */`);
    lines.push("");
  }
  for (const { cssName, cssValue } of items) {
    lines.push(`\t${cssName}: ${cssValue};`);
  }
  return lines.join("\n");
}

export function buildCSSOutput(
  mode: "light" | "dark",
  semanticTokens: ColorToken[],
  globalTokens: ColorToken[]
): string {
  const modeUpper = mode === "light" ? "LIGHT MODE" : "DARK MODE";

  // Group using stable order
  const semanticGroups = groupSemanticTokensStable(semanticTokens);
  const globalGroups = groupGlobalTokensStable(globalTokens);

  const out: string[] = [];
  out.push(":root {");
  out.push("");
  out.push("/* =========================================");
  out.push(`   SEMANTIC TOKENS FOR ${modeUpper}`);
  out.push("   ========================================= */");
  out.push("");

  for (const group of semanticGroups) {
    const items = group.tokens.map((t) => ({
      cssName: tokenNameToCSSVar(t.name),
      cssValue: tokenValueToCSS(t.value),
    }));
    out.push(formatBlock(group.groupName, items));
    out.push("");
    out.push("");
  }

  out.push("/* =========================");
  out.push("   Global tokens");
  out.push("   ========================= */");
  out.push("");

  for (const group of globalGroups) {
    const items = group.tokens.map((t) => ({
      cssName: tokenNameToCSSVar(t.name),
      cssValue: tokenValueToCSS(t.value),
    }));
    out.push(formatBlock(group.groupName, items));
    out.push("");
    out.push("");
  }

  out.push("}");
  out.push("");
  return out.join("\n");
}

// ─── ZIP Export ───

export async function exportCSSAsZip(
  semanticLight: ColorToken[],
  globalLight: ColorToken[],
  semanticDark: ColorToken[],
  globalDark: ColorToken[]
): Promise<void> {
  const lightCSS = buildCSSOutput("light", semanticLight, globalLight);
  const darkCSS = buildCSSOutput("dark", semanticDark, globalDark);

  const zip = new JSZip();
  zip.file("color-light.css", lightCSS);
  zip.file("color-dark.css", darkCSS);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "color-tokens.zip";
  a.click();
  URL.revokeObjectURL(url);
}