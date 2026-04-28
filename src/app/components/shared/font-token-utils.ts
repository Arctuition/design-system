import JSZip from "jszip";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ParsedFontToken {
  cssVar: string;  // e.g. --font-size-body-medium
  value: string;   // e.g. 14px  or  400  or  Inter
  scope: string;   // Figma scope: FONT_SIZE, LINE_HEIGHT, FONT_STYLE, FONT_FAMILY, ALL_SCOPES
}

export type FontMode = "web-desktop" | "web-mobile" | "device-tablet" | "device-mobile";

export const FONT_MODES: { key: FontMode; label: string }[] = [
  { key: "web-desktop",   label: "Web Desktop" },
  { key: "web-mobile",    label: "Web Mobile" },
  { key: "device-tablet", label: "Device Tablet" },
  { key: "device-mobile", label: "Device Mobile" },
];

// ── JSON imports ───────────────────────────────────────────────────────────

import webDesktopJson   from "../../../../tokens/font/web-desktop.tokens.json";
import webMobileJson    from "../../../../tokens/font/web-mobile.tokens.json";
import deviceTabletJson from "../../../../tokens/font/device-tablet.tokens.json";
import deviceMobileJson from "../../../../tokens/font/device-mobile.tokens.json";

const JSON_BY_MODE: Record<FontMode, Record<string, any>> = {
  "web-desktop":   webDesktopJson   as Record<string, any>,
  "web-mobile":    webMobileJson    as Record<string, any>,
  "device-tablet": deviceTabletJson as Record<string, any>,
  "device-mobile": deviceMobileJson as Record<string, any>,
};

// ── Figma scope → unit logic ───────────────────────────────────────────────

function formatValue(raw: any, scopes: string[]): string {
  const num = typeof raw === "number" ? raw : parseFloat(raw);

  if (scopes.includes("FONT_SIZE") || scopes.includes("LINE_HEIGHT")) {
    return `${num}px`;
  }
  if (scopes.includes("FONT_STYLE")) {
    // font-weight: no unit
    return String(num);
  }
  if (scopes.includes("ALL_SCOPES")) {
    // letter-spacing — keep as px with 2 decimal places
    return `${parseFloat(num.toFixed(2))}px`;
  }
  // string values (font family)
  return String(raw);
}

// ── Flatten nested Figma font JSON → ParsedFontToken[] ────────────────────

function flattenFontTokens(
  obj: Record<string, any>,
  prefix = ""
): ParsedFontToken[] {
  const items: ParsedFontToken[] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;

    const path = prefix ? `${prefix}-${key}` : key;

    if (val && typeof val === "object" && "$value" in val) {
      const scopes: string[] =
        (val as any).$extensions?.["com.figma.scopes"] ?? [];
      const raw = (val as any).$value;
      const formatted = formatValue(raw, scopes);

      items.push({
        cssVar: `--${path}`,
        value: formatted,
        scope: scopes[0] ?? "UNKNOWN",
      });
    } else if (val && typeof val === "object") {
      items.push(...flattenFontTokens(val as Record<string, any>, path));
    }
  }

  return items;
}

// ── Public accessors ───────────────────────────────────────────────────────

export function getFontTokens(mode: FontMode): ParsedFontToken[] {
  return flattenFontTokens(JSON_BY_MODE[mode]);
}

// ── Group by category (second segment: size, font-weight, typeface, letter-spacing) ──

export function groupFontTokens(
  tokens: ParsedFontToken[]
): { groupName: string; tokens: ParsedFontToken[] }[] {
  const map = new Map<string, ParsedFontToken[]>();

  for (const token of tokens) {
    // --font-size-body-medium → size
    // --font-font-weight-regular → font-weight
    // --font-typeface-text → typeface
    // --font-letter-spacing-title-large → letter-spacing
    const parts = token.cssVar.replace("--font-", "").split("-");
    let group = parts[0];

    // "font-weight" is split into ["font", "weight", ...]
    if (parts[0] === "font" && parts[1] === "weight") group = "font-weight";

    const label =
      group === "size"           ? "Font Size" :
      group === "font-weight"    ? "Font Weight" :
      group === "typeface"       ? "Typeface" :
      group === "letter-spacing" ? "Letter Spacing" :
      group.charAt(0).toUpperCase() + group.slice(1);

    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(token);
  }

  return Array.from(map.entries()).map(([groupName, tokens]) => ({
    groupName,
    tokens,
  }));
}

// ── CSS generation ─────────────────────────────────────────────────────────

function tokensToCss(tokens: ParsedFontToken[], selector = ":root"): string {
  const lines = tokens.map((t) => `  ${t.cssVar}: ${t.value};`);
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

// ── Export as ZIP (4 files, one per mode) ─────────────────────────────────

export async function exportFontCSSAsZip(): Promise<void> {
  const zip = new JSZip();

  for (const { key, label } of FONT_MODES) {
    const tokens = getFontTokens(key);
    const filename = `font-${key}.css`;
    const selector = `:root`;
    zip.file(filename, tokensToCss(tokens, selector));
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "font-tokens.zip";
  a.click();
  URL.revokeObjectURL(url);
}
