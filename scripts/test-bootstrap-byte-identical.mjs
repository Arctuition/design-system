#!/usr/bin/env node
/**
 * Byte-identical regression test for bootstrap.css.
 *
 * Two independent code paths produce the published bootstrap.css:
 *
 *   PATH A — Prebuild script. Reads /tokens/*.json directly with
 *            flattenColor / flattenSize / flattenFont and pipes the rows
 *            into buildBootstrapCss. Used at build time to generate the
 *            inlined bootstrap.css that ships with the SPA bundle.
 *
 *   PATH B — CMS round-trip. The Figma JSONs are uploaded through the CMS
 *            (client-side parsers in src/app/components/shared/*.ts), stored
 *            in KV as `{name, value, aliasOf?, ...}` rows, then the
 *            edge function reads KV and calls colorRowsToFlat / sizeRowsToFlat
 *            / fontRowsToFlat to convert back to the buildBootstrapCss
 *            input shape.
 *
 * The two paths MUST produce byte-identical output for the same JSON input.
 * Any drift means a parser is dropping or distorting data on one side. This
 * test simulates both paths and diffs them — run it any time you change a
 * parser or *RowsToFlat helper.
 *
 * Usage:
 *   node scripts/test-bootstrap-byte-identical.mjs
 *
 * Exit codes:
 *   0 — files identical, test passes
 *   1 — diff detected, prints a unified-ish summary
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  flattenColor,
  flattenSize,
  flattenFont,
  extractBreakpointPx,
  diffFromBase,
  buildBootstrapCss,
  colorRowsToFlat,
  sizeRowsToFlat,
  fontRowsToFlat,
  extractBreakpointPxFromRows,
} from "../supabase/functions/_shared/token-generators.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const readJson = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf-8"));

// ── Mirror of the client-side parsers ──────────────────────────────────────
//
// These are byte-for-byte JS ports of the TS parsers under
// src/app/components/shared/. Keep them in sync — if a TS parser changes,
// update the mirror below and rerun this test.

function parseColorTree(obj, prefix = "") {
  const tokens = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;
  const hasValue = obj.hasOwnProperty("value") || obj.hasOwnProperty("$value");
  if (hasValue) {
    const rawValue = obj["$value"] ?? obj["value"];
    const rawType = obj["$type"] ?? obj["type"] ?? "";
    const description = obj["$description"] ?? obj["description"] ?? obj["comment"] ?? "";
    const tokenType = String(rawType).toLowerCase();
    if (!rawType || tokenType === "color" || tokenType === "colour") {
      // Resolve hex from any of the shapes the CMS parser handles.
      let valueStr;
      if (typeof rawValue === "object" && rawValue !== null && typeof rawValue.hex === "string") {
        const hex = rawValue.hex.toUpperCase();
        if (typeof rawValue.alpha === "number" && rawValue.alpha < 1) {
          const a = Math.round(rawValue.alpha * 255).toString(16).toUpperCase().padStart(2, "0");
          valueStr = hex + a;
        } else valueStr = hex;
      } else if (typeof rawValue === "object" && rawValue !== null && Array.isArray(rawValue.components)) {
        const toHex = (c) => Math.round(c * 255).toString(16).toUpperCase().padStart(2, "0");
        const [r, g, b] = rawValue.components;
        valueStr = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        if (typeof rawValue.alpha === "number" && rawValue.alpha < 1) valueStr += toHex(rawValue.alpha);
      } else valueStr = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);

      const ext = obj["$extensions"] ?? {};
      const aliasName = ext?.["com.figma.aliasData"]?.targetVariableName;
      tokens.push({
        name: prefix || "unnamed",
        value: valueStr,
        aliasOf: typeof aliasName === "string" ? aliasName : undefined,
      });
    }
    return tokens;
  }
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$") || key === "type" || key === "description") continue;
    if (typeof val === "object" && val !== null) {
      tokens.push(...parseColorTree(val, prefix ? `${prefix}.${key}` : key));
    }
  }
  return tokens;
}

function flattenSizeAsCms(obj, prefix = "") {
  const tokens = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;
  const hasValue = Object.prototype.hasOwnProperty.call(obj, "$value");
  if (hasValue) {
    const rawValue = obj["$value"];
    const rawType = obj["$type"];
    if (rawType) {
      const t = String(rawType).toLowerCase();
      if (t !== "number" && t !== "dimension") return tokens;
    }
    const ext = obj?.$extensions ?? {};
    const aliasFromExt = ext?.["com.figma.aliasData"]?.targetVariableName;
    if (typeof rawValue === "string") {
      const m = /^\s*\{([^{}]+)\}\s*$/.exec(rawValue);
      if (m) tokens.push({ name: prefix, value: 0, aliasOf: m[1].replace(/\./g, "/") });
      return tokens;
    }
    const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(numericValue)) return tokens;
    tokens.push({
      name: prefix,
      value: numericValue,
      aliasOf: typeof aliasFromExt === "string" ? aliasFromExt : undefined,
    });
    return tokens;
  }
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const childPrefix = prefix ? `${prefix}/${key}` : key;
    if (typeof val === "object" && val !== null) {
      tokens.push(...flattenSizeAsCms(val, childPrefix));
    }
  }
  return tokens;
}

function parseSizeAsCms(data) {
  if (!data || typeof data !== "object") return [];
  if (Object.prototype.hasOwnProperty.call(data, "size")) return flattenSizeAsCms(data.size, "size");
  if (Object.prototype.hasOwnProperty.call(data, "size-global")) return flattenSizeAsCms(data["size-global"], "size-global");
  if (Object.prototype.hasOwnProperty.call(data, "breakpoint")) return flattenSizeAsCms(data.breakpoint, "breakpoint");
  return [];
}

function flattenFontAsCms(obj, prefix = "") {
  const tokens = [];
  if (obj === null || obj === undefined || typeof obj !== "object") return tokens;
  const hasValue = Object.prototype.hasOwnProperty.call(obj, "$value");
  if (hasValue) {
    const rawValue = obj["$value"];
    if (rawValue === undefined || rawValue === null) return tokens;
    const ext = obj?.$extensions ?? {};
    const scopes = Array.isArray(ext?.["com.figma.scopes"])
      ? ext["com.figma.scopes"].filter((s) => typeof s === "string")
      : [];
    const aliasName = ext?.["com.figma.aliasData"]?.targetVariableName;
    let valueOut = typeof rawValue === "number" ? rawValue : String(rawValue);
    let inlineAlias;
    if (typeof rawValue === "string") {
      const m = /^\s*\{([^{}]+)\}\s*$/.exec(rawValue);
      if (m) { inlineAlias = m[1].replace(/\./g, "/"); valueOut = ""; }
    }
    tokens.push({
      name: prefix,
      value: valueOut,
      scope: scopes[0],
      scopes: scopes.length ? scopes : undefined,
      aliasOf: typeof aliasName === "string" ? aliasName : inlineAlias,
    });
    return tokens;
  }
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const childPrefix = prefix ? `${prefix}/${key}` : key;
    if (typeof val === "object" && val !== null) {
      tokens.push(...flattenFontAsCms(val, childPrefix));
    }
  }
  return tokens;
}

function parseFontAsCms(data) {
  if (!data || typeof data !== "object") return [];
  if (Object.prototype.hasOwnProperty.call(data, "font")) return flattenFontAsCms(data.font, "font");
  return [];
}

// ── Path A: prebuild ───────────────────────────────────────────────────────

function buildPrebuild() {
  const globalColor = flattenColor(readJson("tokens/color/color-global-value.tokens.json"));
  const lightTokens = flattenColor(readJson("tokens/color/light.tokens.json"));
  const darkTokens  = flattenColor(readJson("tokens/color/dark.tokens.json"));
  const sizeGlobal  = flattenSize(readJson("tokens/size/size-global-value.tokens.json"));
  const sizeWebMobile       = flattenSize(readJson("tokens/size/web-mobile.tokens.json"));
  const sizeWebTablet       = flattenSize(readJson("tokens/size/web-tablet.tokens.json"));
  const sizeWebDesktop      = flattenSize(readJson("tokens/size/web-desktop.tokens.json"));
  const sizeWebDesktopLarge = flattenSize(readJson("tokens/size/web-desktop-large.tokens.json"));
  const sizeDeviceMobile    = flattenSize(readJson("tokens/size/device-mobile.tokens.json"));
  const sizeDeviceTablet    = flattenSize(readJson("tokens/size/device-tablet.tokens.json"));
  const breakpoints = flattenSize(readJson("tokens/breakpoint/breakpoint.tokens.json"));
  const breakpointPx = extractBreakpointPx(readJson("tokens/breakpoint/breakpoint.tokens.json"));
  const fontDesktop      = flattenFont(readJson("tokens/font/web-desktop.tokens.json"));
  const fontDeviceMobile = flattenFont(readJson("tokens/font/device-mobile.tokens.json"));
  const fontDeviceTablet = flattenFont(readJson("tokens/font/device-tablet.tokens.json"));

  return buildBootstrapCss({
    globalColor,
    lightTokens,
    darkTokens,
    sizeGlobal,
    breakpoints,
    sizeWebMobile,
    sizeTabletDiff:       diffFromBase(sizeWebMobile, sizeWebTablet),
    sizeDesktopDiff:      diffFromBase(sizeWebMobile, sizeWebDesktop),
    sizeDesktopLargeDiff: diffFromBase(sizeWebMobile, sizeWebDesktopLarge),
    fontDesktop,
    breakpointPx,
    sizeDeviceMobileDiff: diffFromBase(sizeWebMobile, sizeDeviceMobile),
    sizeDeviceTabletDiff: diffFromBase(sizeWebMobile, sizeDeviceTablet),
    fontDeviceMobileDiff: diffFromBase(fontDesktop, fontDeviceMobile, "value"),
    fontDeviceTabletDiff: diffFromBase(fontDesktop, fontDeviceTablet, "value"),
  });
}

// ── Path B: CMS round-trip ─────────────────────────────────────────────────

function buildCmsRoundTrip() {
  const colorGlobal = parseColorTree(readJson("tokens/color/color-global-value.tokens.json"));
  const colorLight  = parseColorTree(readJson("tokens/color/light.tokens.json"));
  const colorDark   = parseColorTree(readJson("tokens/color/dark.tokens.json"));

  const sizeGlobalRows = parseSizeAsCms(readJson("tokens/size/size-global-value.tokens.json"));
  const sizeWebMobileRows       = parseSizeAsCms(readJson("tokens/size/web-mobile.tokens.json"));
  const sizeWebTabletRows       = parseSizeAsCms(readJson("tokens/size/web-tablet.tokens.json"));
  const sizeWebDesktopRows      = parseSizeAsCms(readJson("tokens/size/web-desktop.tokens.json"));
  const sizeWebDesktopLargeRows = parseSizeAsCms(readJson("tokens/size/web-desktop-large.tokens.json"));
  const sizeDeviceMobileRows    = parseSizeAsCms(readJson("tokens/size/device-mobile.tokens.json"));
  const sizeDeviceTabletRows    = parseSizeAsCms(readJson("tokens/size/device-tablet.tokens.json"));
  const breakpointRows          = parseSizeAsCms(readJson("tokens/breakpoint/breakpoint.tokens.json"));

  const fontDesktopRows      = parseFontAsCms(readJson("tokens/font/web-desktop.tokens.json"));
  const fontDeviceMobileRows = parseFontAsCms(readJson("tokens/font/device-mobile.tokens.json"));
  const fontDeviceTabletRows = parseFontAsCms(readJson("tokens/font/device-tablet.tokens.json"));

  // Server-side conversion to the buildBootstrapCss input shape.
  const globalColor = colorRowsToFlat(colorGlobal);
  const lightTokens = colorRowsToFlat(colorLight);
  const darkTokens  = colorRowsToFlat(colorDark);
  const sizeGlobal       = sizeRowsToFlat(sizeGlobalRows);
  const sizeWebMobile    = sizeRowsToFlat(sizeWebMobileRows);
  const sizeWebTablet    = sizeRowsToFlat(sizeWebTabletRows);
  const sizeWebDesktop   = sizeRowsToFlat(sizeWebDesktopRows);
  const sizeWebDesktopLg = sizeRowsToFlat(sizeWebDesktopLargeRows);
  const sizeDeviceMobile = sizeRowsToFlat(sizeDeviceMobileRows);
  const sizeDeviceTablet = sizeRowsToFlat(sizeDeviceTabletRows);
  const breakpoints      = sizeRowsToFlat(breakpointRows);
  const fontDesktop      = fontRowsToFlat(fontDesktopRows);
  const fontDeviceMobile = fontRowsToFlat(fontDeviceMobileRows);
  const fontDeviceTablet = fontRowsToFlat(fontDeviceTabletRows);
  const breakpointPx     = extractBreakpointPxFromRows(breakpointRows);

  return buildBootstrapCss({
    globalColor,
    lightTokens,
    darkTokens,
    sizeGlobal,
    breakpoints,
    sizeWebMobile,
    sizeTabletDiff:       diffFromBase(sizeWebMobile, sizeWebTablet),
    sizeDesktopDiff:      diffFromBase(sizeWebMobile, sizeWebDesktop),
    sizeDesktopLargeDiff: diffFromBase(sizeWebMobile, sizeWebDesktopLg),
    fontDesktop,
    breakpointPx,
    sizeDeviceMobileDiff: diffFromBase(sizeWebMobile, sizeDeviceMobile),
    sizeDeviceTabletDiff: diffFromBase(sizeWebMobile, sizeDeviceTablet),
    fontDeviceMobileDiff: diffFromBase(fontDesktop, fontDeviceMobile, "value"),
    fontDeviceTabletDiff: diffFromBase(fontDesktop, fontDeviceTablet, "value"),
  });
}

// ── Compare ────────────────────────────────────────────────────────────────

const a = buildPrebuild();
const b = buildCmsRoundTrip();

if (a === b) {
  console.log(`✓ bootstrap.css byte-identical via both paths (${a.length} chars)`);
  process.exit(0);
}

// Compute a unified line-by-line diff
console.error(`✗ bootstrap.css DIFFERS between prebuild and CMS round-trip`);
console.error(`  prebuild:       ${a.length} chars`);
console.error(`  CMS round-trip: ${b.length} chars`);
const aLines = a.split("\n");
const bLines = b.split("\n");
const maxLines = Math.max(aLines.length, bLines.length);
let diffCount = 0;
let printed = 0;
for (let i = 0; i < maxLines && printed < 30; i++) {
  if (aLines[i] !== bLines[i]) {
    diffCount++;
    if (printed < 30) {
      console.error(`  line ${i + 1}:`);
      console.error(`    - ${aLines[i] ?? "(missing)"}`);
      console.error(`    + ${bLines[i] ?? "(missing)"}`);
      printed++;
    }
  }
}
console.error(`  total differing lines: ${diffCount}`);
process.exit(1);
