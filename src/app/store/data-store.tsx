import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { loadStateFromServer, loadStateKey, saveStateKey, bulkSaveState } from "./api";
import { isValidStateKey } from "../lib/state-keys";

/**
 * Per-articleKey cap on stored versions. Must match the server-side
 * MAX_VERSIONS_PER_ARTICLE in supabase/functions/make-server-067f252d/index.ts
 * — both sides enforce it so a save started before lazy hydration finishes
 * can't clobber server state with a 1-entry array, and a curl PUT can't
 * grow KV without bound.
 */
const MAX_VERSIONS_PER_ARTICLE = 5;

function capArticleVersions(versions: ArticleVersion[]): ArticleVersion[] {
  const counts = new Map<string, number>();
  const kept: ArticleVersion[] = [];
  for (const v of versions) {
    const next = (counts.get(v.articleKey) ?? 0) + 1;
    if (next > MAX_VERSIONS_PER_ARTICLE) continue;
    counts.set(v.articleKey, next);
    kept.push(v);
  }
  return kept;
}
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { buildIconTagsFromName, enrichAllIconTags, rebuildIconTags } from "./icon-tag-enrichment";
import { chromeIconSeeds } from "./chrome-icon-seeds";

// ---- Types ----
export interface ChangeLogEntry {
  id: string;
  date: string;
  version: string;
  title: string;
  description: string;
}

export interface ColorToken {
  name: string;
  value: string;
  description?: string;
  /**
   * If present, the token aliases another token. Format mirrors
   * `com.figma.aliasData.targetVariableName` (e.g. `color/global/gray/06`).
   * Server-side `colorRowsToFlat` turns this into a `var(--…)` reference so
   * theme overrides (Light/Dark, brand recoloring) cascade correctly.
   */
  aliasOf?: string;
  /** Original Figma variable id, kept for round-tripping. Not consumed yet. */
  figmaVariableId?: string;
  /** Original Figma scope hints (`SHAPE_FILL`, `TEXT_FILL`, etc.). */
  scopes?: string[];
}

export interface ColorTokenGroup {
  // Globals are mode-independent — single source of truth shared by both modes.
  global: ColorToken[];
  semanticLight: ColorToken[];
  semanticDark: ColorToken[];
}

export interface SizeToken {
  name: string;
  value: number;
  /**
   * Slash-separated token path this token aliases. Normalized from either
   * `$extensions.com.figma.aliasData.targetVariableName` (e.g. `size-global/16`)
   * or an in-collection brace reference (`{size.padding-component-lg}` →
   * `size/padding-component-lg`). When present, downstream CSS emits
   * `var(--…)` instead of the resolved numeric value.
   */
  aliasOf?: string;
  description?: string;
  figmaVariableId?: string;
  scopes?: string[];
}

export type SizeTokenMode =
  | "deviceMobile"
  | "deviceTablet"
  | "webMobile"
  | "webTablet"
  | "webDesktop"
  | "webDesktopLarge";

export interface SizeTokenSet {
  global: SizeToken[];
  deviceMobile: SizeToken[];
  deviceTablet: SizeToken[];
  webMobile: SizeToken[];
  webTablet: SizeToken[];
  webDesktop: SizeToken[];
  webDesktopLarge: SizeToken[];
}

/**
 * Breakpoints are a separate Figma collection (mode-independent — the values
 * themselves *define* the modes). Stored in its own slot to keep the size
 * collection focused on per-mode dimensional values.
 */
export interface BreakpointTokenSet {
  tokens: SizeToken[];  // xs / sm / md / lg / xl
}

/**
 * Font tokens. Unlike size tokens, the underlying Figma values mix strings
 * (typeface — "Inter") and numbers (font-size px, font-weight unitless,
 * letter-spacing px). The `scope` is the Figma com.figma.scopes hint
 * (FONT_SIZE / LINE_HEIGHT / FONT_STYLE / FONT_FAMILY / ALL_SCOPES) which
 * drives the unit when emitting CSS.
 */
export interface FontToken {
  name: string;
  value: string | number;
  /**
   * Primary scope hint, kept as-is for back-compat with downstream code that
   * branches on a single value. Prefer `scopes` when multiple hints apply.
   */
  scope?: string;
  /** All Figma scope hints (`["FONT_SIZE", "LINE_HEIGHT"]` etc.). */
  scopes?: string[];
  aliasOf?: string;
  description?: string;
  figmaVariableId?: string;
}

export type FontTokenMode =
  | "deviceMobile"
  | "deviceTablet"
  | "webMobile"
  | "webDesktop";

export interface FontTokenSet {
  deviceMobile: FontToken[];
  deviceTablet: FontToken[];
  webMobile: FontToken[];
  webDesktop: FontToken[];
}

/**
 * Markdown reference docs for the public /color, /size, /typography pages.
 * The repo's `tokens/tokens-*.md` files are the build-time seed; once the CMS
 * Markdown editor writes into KV, the runtime fetch overrides the seed for
 * visitors. Server-side publish also mirrors these to Supabase Storage so
 * AI agents can fetch the canonical version without going through the React
 * SPA.
 */
export interface TokenDocs {
  color: string;
  size: string;
  typography: string;
}

export interface IconItem {
  id: string;
  name: string;
  tags: string[];
  svgContent: string;
  fileName: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Pattern article. Markdown is the canonical source of truth for Agents
 * (served via /patterns/:filename.md). HTML is an optional higher-fidelity
 * rendering, auto-generated when the user edits via the rich-text editor
 * (Phase C+). The browser displays whichever of the two was saved more
 * recently — see PatternDetailPage. Drift is impossible because conversion
 * is one-way (HTML → MD on save) and timestamps decide the winner.
 */
export interface PatternArticle {
  id: string;
  title: string;
  /** HTML rendered from the rich-text editor. Empty string when no HTML version exists yet (MD-uploaded pattern). */
  content: string;
  /** Markdown source. Set directly via MD upload, or auto-generated from `content` on HTML save. Canonical for Agents. */
  markdownContent: string;
  /** ISO date of the last `content` (HTML) save. Empty string if HTML was never saved. */
  htmlUpdatedAt: string;
  /** ISO date of the last `markdownContent` save (direct upload or auto-generation). Empty string if MD was never saved. */
  markdownUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt?: string;
}

export interface EditorAccount {
  id: string;
  username: string;
  password: string;
  role: "admin" | "editor";
  createdAt: string;
}

export interface ArticleVersion {
  id: string;
  articleKey: string;
  content: string;
  timestamp: string;
  author: string;
  label: string;
}

/**
 * Per-slot upload + per-slot publish timestamps for the Token editor UI.
 * Keys are stable strings like `size/global`, `color/light`, `font/webDesktop`,
 * `breakpoint`. Values are ISO timestamps.
 *
 * Why per-slot publishedAt (not a single global timestamp): a Publish-to-
 * Production click pushes ALL slots, but designers want the badge to read
 * "Published at [the time this slot's CURRENT contents went live]" — not
 * "Published at [the most recent Publish click]". If only Semantic Light
 * was re-uploaded and re-published, Global's badge should still show the
 * older date, not today's. `markTokensPublished` only bumps publishedAt
 * for slots whose mtime is newer than their current publishedAt.
 *
 * Legacy data (slot has tokens but no mtime / no publishedAt): the first
 * Publish after Group E shipped seeds publishedAt to "now" so the user
 * has a tracked baseline going forward. Until that first Publish, the
 * badge reads "Published" with no timestamp (we don't lie about a time
 * we don't know).
 */
export interface TokenStatus {
  tokenSlotMtimes: Record<string, string>;
  tokenSlotPublishedAt: Record<string, string>;
}

export interface AppState {
  homeArticle: string;
  changeLogs: ChangeLogEntry[];
  colorTokens: ColorTokenGroup;
  sizeTokens: SizeTokenSet;
  breakpointTokens: BreakpointTokenSet;
  fontTokens: FontTokenSet;
  tokenDocs: TokenDocs;
  tokenStatus: TokenStatus;
  icons: IconItem[];
  patterns: PatternArticle[];
  editors: EditorAccount[];
  iconologyArticle: string;
  isAuthenticated: boolean;
  currentUser: EditorAccount | null;
  authExpiry: number | null;
  articleVersions: ArticleVersion[];
}

interface AppContextType extends AppState {
  setHomeArticle: (html: string) => void;
  addChangeLog: (entry: Omit<ChangeLogEntry, "id">) => void;
  updateChangeLog: (id: string, entry: Partial<ChangeLogEntry>) => void;
  removeChangeLog: (id: string) => void;
  setColorTokens: (tokens: ColorTokenGroup) => void;
  setSizeTokens: (tokens: SizeTokenSet) => void;
  setBreakpointTokens: (tokens: BreakpointTokenSet) => void;
  setFontTokens: (tokens: FontTokenSet) => void;
  /** Called by PublishTokensButton after a successful Publish-to-Production.
   *  Stamps the current time as the "Published" baseline for every slot. */
  markTokensPublished: () => void;
  setTokenDoc: (key: keyof TokenDocs, markdown: string) => void;
  setIconologyArticle: (html: string) => void;
  addIcon: (icon: Omit<IconItem, "id">) => void;
  updateIcon: (id: string, icon: Partial<IconItem>) => void;
  removeIcon: (id: string) => void;
  bulkAddIcons: (icons: Omit<IconItem, "id">[]) => void;
  regenerateAllIconTags: () => { changed: boolean; iconCount: number };
  addPattern: (pattern: Omit<PatternArticle, "id" | "createdAt" | "updatedAt" | "deleted" | "markdownContent" | "markdownUpdatedAt" | "htmlUpdatedAt">) => void;
  updatePattern: (id: string, pattern: Partial<PatternArticle>) => void;
  softDeletePattern: (id: string) => void;
  restorePattern: (id: string) => void;
  permanentDeletePattern: (id: string) => void;
  addUser: (editor: Omit<EditorAccount, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<Pick<EditorAccount, "role" | "password">>) => void;
  removeUser: (id: string) => void;
  login: (username: string, password: string, rememberMe?: boolean) => boolean;
  logout: () => void;
  saveArticleWithVersion: (articleKey: string, content: string, saveFn: (html: string) => void) => void;
  getArticleVersions: (articleKey: string) => ArticleVersion[];
  restoreArticleVersion: (version: ArticleVersion) => void;
  deleteArticleVersion: (versionId: string) => void;
  isLoading: boolean;
  /** Set of state keys with an in-flight or pending server sync. */
  syncingKeys: ReadonlySet<string>;
  /**
   * Save one state key now, awaitable. Cancels any pending debounced sync
   * for the same key, performs an immediate PUT, returns true on HTTP 2xx.
   * Use from explicit save buttons so the UI can show real
   * "Saving…" / "Saved" / "Save failed" feedback.
   */
  saveKeyNow: (key: string, value: any) => Promise<boolean>;
}

const uid = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

function generateRandomPassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  let pw = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = pw.length; i < length; i++) {
    pw.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = pw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}

// ---- Default Data ----
const defaultColorTokens: ColorTokenGroup = {
  semanticLight: [
    { name: "--background", value: "rgba(255, 255, 255, 1.00)", description: "Default page background" },
    { name: "--foreground", value: "rgba(38, 38, 38, 1.00)", description: "Default text color" },
    { name: "--primary", value: "rgba(57, 138, 231, 1.00)", description: "Primary interactive color" },
    { name: "--primary-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on primary" },
    { name: "--secondary", value: "rgba(240, 240, 240, 1.00)", description: "Secondary backgrounds" },
    { name: "--secondary-foreground", value: "rgba(0, 0, 0, 0.55)", description: "Text on secondary" },
    { name: "--muted", value: "rgba(230, 230, 230, 1.00)", description: "Muted elements" },
    { name: "--muted-foreground", value: "rgba(0, 0, 0, 0.25)", description: "Text on muted" },
    { name: "--accent", value: "rgba(68, 143, 248, 1.00)", description: "Accent highlights" },
    { name: "--accent-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on accent" },
    { name: "--destructive", value: "rgba(227, 28, 28, 1.00)", description: "Destructive actions" },
    { name: "--destructive-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on destructive" },
    { name: "--border", value: "rgba(217, 217, 217, 1.00)", description: "Default borders" },
    { name: "--input", value: "rgba(255, 255, 255, 1.00)", description: "Input fields" },
    { name: "--ring", value: "rgba(57, 138, 231, 1.00)", description: "Focus rings" },
    { name: "--card", value: "rgba(255, 255, 255, 1.00)", description: "Card backgrounds" },
    { name: "--card-foreground", value: "rgba(0, 0, 0, 0.85)", description: "Text on cards" },
    { name: "--popover", value: "rgba(255, 255, 255, 1.00)", description: "Popover background" },
    { name: "--popover-foreground", value: "rgba(0, 0, 0, 0.85)", description: "Text on popover" },
  ],
  semanticDark: [
    { name: "--background", value: "rgba(38, 38, 38, 1.00)", description: "Default page background" },
    { name: "--foreground", value: "rgba(255, 255, 255, 1.00)", description: "Default text color" },
    { name: "--primary", value: "rgba(68, 143, 248, 1.00)", description: "Primary interactive color" },
    { name: "--primary-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on primary" },
    { name: "--secondary", value: "rgba(60, 60, 60, 1.00)", description: "Secondary backgrounds" },
    { name: "--secondary-foreground", value: "rgba(255, 255, 255, 0.85)", description: "Text on secondary" },
    { name: "--muted", value: "rgba(80, 80, 80, 1.00)", description: "Muted elements" },
    { name: "--muted-foreground", value: "rgba(255, 255, 255, 0.45)", description: "Text on muted" },
    { name: "--accent", value: "rgba(68, 143, 248, 1.00)", description: "Accent highlights" },
    { name: "--accent-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on accent" },
    { name: "--destructive", value: "rgba(227, 28, 28, 1.00)", description: "Destructive actions" },
    { name: "--destructive-foreground", value: "rgba(255, 255, 255, 1.00)", description: "Text on destructive" },
    { name: "--border", value: "rgba(80, 80, 80, 1.00)", description: "Default borders" },
    { name: "--input", value: "rgba(60, 60, 60, 1.00)", description: "Input fields" },
    { name: "--ring", value: "rgba(68, 143, 248, 1.00)", description: "Focus rings" },
    { name: "--card", value: "rgba(38, 38, 38, 1.00)", description: "Card backgrounds" },
    { name: "--card-foreground", value: "rgba(255, 255, 255, 0.85)", description: "Text on cards" },
    { name: "--popover", value: "rgba(38, 38, 38, 1.00)", description: "Popover background" },
    { name: "--popover-foreground", value: "rgba(255, 255, 255, 0.85)", description: "Text on popover" },
  ],
  global: [
    { name: "--color-white", value: "#FFFFFF", description: "Pure white" },
    { name: "--color-black", value: "#000000", description: "Pure black" },
    { name: "--color-gray-50", value: "#F5F5F5", description: "Gray 50" },
    { name: "--color-gray-100", value: "#E6E6E6", description: "Gray 100" },
    { name: "--color-gray-200", value: "#D9D9D9", description: "Gray 200" },
    { name: "--color-gray-300", value: "#BFBFBF", description: "Gray 300" },
    { name: "--color-gray-500", value: "#808080", description: "Gray 500" },
    { name: "--color-gray-700", value: "#505050", description: "Gray 700" },
    { name: "--color-gray-900", value: "#262626", description: "Gray 900" },
    { name: "--color-blue-500", value: "rgba(57, 138, 231, 1.00)", description: "Blue 500" },
    { name: "--color-blue-600", value: "rgba(68, 143, 248, 1.00)", description: "Blue 600" },
    { name: "--color-red-500", value: "rgba(227, 28, 28, 1.00)", description: "Red 500" },
    { name: "--color-green-500", value: "rgba(4, 181, 11, 1.00)", description: "Green 500" },
    { name: "--color-orange-500", value: "rgba(227, 118, 18, 1.00)", description: "Orange 500" },
  ],
};

const defaultSizeTokens: SizeTokenSet = {
  global: [],
  deviceMobile: [],
  deviceTablet: [],
  webMobile: [],
  webTablet: [],
  webDesktop: [],
  webDesktopLarge: [],
};

const defaultBreakpointTokens: BreakpointTokenSet = {
  tokens: [],
};

const defaultFontTokens: FontTokenSet = {
  deviceMobile: [],
  deviceTablet: [],
  webMobile: [],
  webDesktop: [],
};

// Seed the token reference docs from the repo files at build time. Once a
// CMS editor saves into `tokenDocs.<slot>`, the live KV value overrides the
// seed for both the public pages and AI-agent consumers.
import seedColorMd from "../../../tokens/tokens-color.md?raw";
import seedSizeMd from "../../../tokens/tokens-size-space.md?raw";
import seedTypographyMd from "../../../tokens/tokens-typography.md?raw";

const defaultTokenDocs: TokenDocs = {
  color: seedColorMd,
  size: seedSizeMd,
  typography: seedTypographyMd,
};

const defaultChangeLogs: ChangeLogEntry[] = [
  {
    id: uid(),
    date: "2026-05-12",
    version: "1.7.0",
    title: "CMS-driven publish — token uploads go live without a git commit",
    description: `Designers can now ship token changes end-to-end through the CMS. Upload Figma JSON, hit **Publish**, and prototypes that reference \`bootstrap.css\` pick up the new values within ~1 minute — no PR, no merge, no deploy.

**Font tokens — full CMS uploader (was build-time only)**
- New \`/cms/font-editor\` accepts the four \`font\` mode files (\`device-mobile\`, \`device-tablet\`, \`web-mobile\`, \`web-desktop\`) with bulk + individual upload, scope-aware CSS output (FONT_SIZE → \`px\`, FONT_STYLE → unitless, ALL_SCOPES → 2-decimal \`px\`, FONT_FAMILY → raw string), and a grouped preview by Typeface / Font Size / Line Height / Font Weight / Letter Spacing. Adds the matching \`fontTokens\` KV slot.

**Server-side publish**
- New \`POST /design-tokens/publish\` reads every token slot from Supabase KV, regenerates \`bootstrap.css\` + \`breakpoints.js\` (+ the three \`tokens-*.md\` reference docs when present) via the same template the prebuild script uses, and uploads them to a new \`design-tokens\` Storage bucket with \`cache-control: max-age=60\`. Authoritative regen runs server-side — a stale browser tab can't ship outdated values.
- "Publish to Production" button + dialog wired into Color, Size, and Font token editors. Success state shows clickable URLs and byte counts; failure surfaces the server error inline with a Retry.

**Shared token-generation module**
- The flatten / diff / build logic moved out of \`scripts/generate-llms-txt.mjs\` into \`supabase/functions/_shared/token-generators.mjs\` so the Node prebuild, browser CMS, and Deno edge function all run the *exact same code*. \`bootstrap.css\` regenerated on Publish is byte-identical to the one \`npm run build\` produces (verified MD5).

**GitHub Pages \`bootstrap.css\` shim**
- Production builds now emit a 1-line \`@import url("https://…/design-tokens/bootstrap.css")\` shim at \`https://arctuition.github.io/design-system/tokens/bootstrap.css\` — existing prototypes that hardcode that URL keep working unchanged and auto-pick-up CMS publishes. Local dev builds still emit the full inline content for offline use.

**Token reference docs (color/size/typography) move to CMS**
- New \`tokenDocs\` KV slot stores the Markdown source for \`/color\`, \`/size\`, and \`/typography\`. Three Markdown editors in CMS (\`/cms/color-editor/doc\`, \`/cms/size-editor/doc\`, \`/cms/typography-editor\`) — split-pane textarea + live preview, Discard / Save, no version history yet.
- Public pages \`ColorPage\` / \`SizePage\` / \`TypographyPage\` read the live KV value (seed from the bundled repo MD covers first paint).
- Publish mirrors the MDs to Supabase Storage too, so AI agents fetch the canonical version without going through the React SPA.

**\`llms.txt\` slim-down**
- Dropped ~700 lines of inline token blocks; replaced with a single "Token values — fetch live from Supabase" pointer section. File size **52,763 → 13,102 chars** (75% smaller, 39.6 KB). AI agents that only need names + principles read the index and stop; agents that need numeric values follow the URL.`,
  },
  {
    id: uid(),
    date: "2026-05-12",
    version: "1.6.0",
    title: "Size tokens — Web Tablet + Web Desktop Large modes, plus a Breakpoints collection",
    description: `Added two new size modes and broke breakpoints out into their own Figma collection so the size scale and the viewport widths that switch between scales are no longer entangled.

**Two new size modes**
- \`web-tablet\` (browser 768–1199 px) — sits between Web Mobile and Web Desktop. Looser padding and a 12-column grid (matches Device Tablet) without the desktop's 24-column generosity.
- \`web-desktop-large\` (browser ≥ 1400 px) — extends Web Desktop with one extra notch of breathing room at \`lg\` / \`xl\` and a 1440 px content cap for ultrawide monitors.
- All 103 size variables now resolve in 6 modes. Component tokens (button, input, dialog, tag) default to the closest existing mode's value — refine per-mode later if needed.

**New \`breakpoint\` collection**
- 5 tokens: \`breakpoint/xs\` (576), \`sm\` (768), \`md\` (992), \`lg\` (1200), \`xl\` (1400). Bootstrap-style scale; \`sm\` / \`lg\` / \`xl\` are the "hard" breakpoints that trigger size-mode switches, \`xs\` / \`md\` are "soft" breakpoints for layout micro-adjustments inside a mode.
- Each variable carries a description explaining what happens below vs. at-or-above its value.

**Build pipeline — mobile-first CSS**
- \`bootstrap.css\` now emits Web Mobile as the \`:root\` baseline, then three \`@media (min-width: …)\` overrides at 768 / 1200 / 1400 — only the tokens that *differ* are written in each block, so the cascade stays compact.
- New \`public/tokens/breakpoints.js\` exports raw pixel values for matchMedia, Tailwind config, or container queries (CSS variables don't work inside \`@media\` queries).
- Device Mobile / Device Tablet files are kept in \`tokens/size/\` for iOS / Android consumption but deliberately excluded from \`bootstrap.css\`.

**CMS upload**
- \`/cms/size-editor\` now accepts all 7 mode files plus the breakpoint file. Bulk upload tolerates Figma's quirk of exporting the size-global collection mis-named as \`color-global-value.tokens.json\`.`,
  },
  {
    id: uid(),
    date: "2026-05-11",
    version: "1.5.2",
    title: "First-paint fix — lazy versions, inline-image extraction, capped history",
    description: `Initial \`/state\` load went from **13.9 MB / 7+ s TTFB** to **~3.5 MB / ~1 s** by deferring article version history off the critical path, capping it at 5 entries per article, and rewriting inline base64 images to public Storage URLs on save. Safari users (8 s client timeout on the bulk load) stop seeing the "Can't reach the content server" toast on opening the site.

**Lazy article versions**
- Server: \`GET /state\` no longer includes \`articleVersions\`. The slice is fetched on demand via new \`GET /state/:key\`, triggered by opening the Version sidebar or by any save.
- Client: \`ensureArticleVersionsLoaded\` hydrates the slice once per session, with promise-deduped concurrent triggers; saves and deletes always await it so they can't accidentally PUT a 1-entry array that clobbers server history.

**Capped version history**
- Both client and server enforce \`MAX_VERSIONS_PER_ARTICLE = 5\` per \`articleKey\`. A buggy client or curl PUT can't grow KV without bound; oldest entries past the cap are dropped silently.

**Inline-image stripping on save**
- Rich-text pastes and the editor's image-upload button used to inline images as \`data:image/...;base64,...\` directly in the HTML, ballooning patterns to 1+ MB and each version snapshot the same. Existing data: a single Web View pattern carried 1.87 MB of base64 and its 10 versions another 10.4 MB.
- Server-side \`stripInlineImagesFromHtml\` extracts every data URL, uploads it once (SHA-256 dedup) to \`pattern-assets/_inline/<articleKey>/<hash>.<ext>\`, and rewrites the HTML to reference the public URL. Runs in \`processPatternsBeforeSave\`, in PUT \`/state/:key\` for HTML article keys (\`homeArticle\`, \`typographyArticle\`, \`colorArticle\`, \`sizeArticle\`, \`iconologyArticle\`), and in \`processArticleVersionsBeforeSave\` for version snapshots.
- Inline images live under \`_inline/\` (underscore prefix avoids collision with pattern IDs) so the bundle-upload orphan-cleanup pass doesn't sweep them away.
- Legacy rows clean themselves up on next save — no separate migration step.`,
  },
  {
    id: uid(),
    date: "2026-05-11",
    version: "1.5.1",
    title: "Modal Dialogs — Do/Don't pairs, anatomy diagram, refined visuals",
    description: `The Modal Dialogs pattern doc gets a visual overhaul. The page now teaches each anti-pattern as a side-by-side Do/Don't comparison instead of a single "bad example" image, adds a numbered anatomy diagram for the modal structure, and replaces every type example with a tighter, more consistent mockup.

**Side-by-side Do/Don't pairs**
- Six anti-patterns (nested modals × 2, body overflow × 2, generic verbs × 2) now render as two-column tiles using the Design Library \`Image background\` component — green check + bar on the Do side, red error + bar on the Don't side.
- Each pair is wired into the rich-text editor's native two-column layout (\`<div data-rte-cols="2">\`), so the same HTML can be edited in CMS or pasted verbatim across environments. The two-column block collapses to a single column at <640px (existing responsive rule).
- For Markdown fallback the pairs flatten into sequential Do-image / Don't-image references — readable for AI agents and small-screen MD viewers, where two-column isn't possible.

**Modal anatomy diagram**
- New \`images/anatomy.png\` lives at the top of the Anatomy section: a single annotated mockup with 9 numbered callouts (Modal, Header, Title, Close, Body, Footer, Primary / Secondary / Tertiary action). Replaces the previous text-only walkthrough.

**Type example mockups (Alert / Details / Create / Browse / Configure / Preview)**
- All six type illustrations redone at a consistent 800px width, comfortable padding, and corrected proportions (Preview shrunk to 640px modal width so the document doesn't bleed to the stage edge).
- Tightened body content — modals \`HUG\` height instead of carrying empty space.

**Production assets**
- 19 PNG assets uploaded to \`pattern-assets/sfh2uhifu19e12507690/images/\` via the bundle endpoint. Old single-image anti-pattern references (\`anti-X.png\`) replaced by paired \`anti-X-do.png\` + \`anti-X-dont.png\`; orphans cleaned up automatically.`,
  },
  {
    id: uid(),
    date: "2026-05-10",
    version: "1.5.0",
    title: "Pattern docs — markdown-first pipeline with bundle upload",
    description: `Pattern documentation now has a markdown-first content pipeline so AI agents can fetch canonical sources directly, and editors upload patterns as a portable bundle (one \`.md\` + any asset files) instead of juggling rich-text HTML and image hosting separately.

**Public markdown endpoint**
- New \`GET /patterns/:slug.md\` on the edge function returns the canonical markdown source with \`Content-Type: text/markdown\`. Looked up by id or kebab-cased title.
- Designed for AI / LLM crawlers (Claude, GPT) — fetch a pattern's source without parsing the JSON state envelope.

**Bundle upload**
- New \`POST /patterns/:id/bundle\` accepts a multipart zip with one \`.md\` and any number of asset files (images, figures) referenced by relative paths.
- Server unpacks, validates that every \`![](path)\` in the markdown has a matching file (lists ALL missing files in one error), uploads each asset to Supabase Storage at \`pattern-assets/<patternId>/<relative-path>\`, stores the markdown in the patterns row, and cleans up assets from the previous bundle that aren't in the new one.
- The desktop folder layout and the Supabase Storage layout are 1:1 mirrors — the markdown stays portable (relative paths preserved), the deployment knows how to resolve them.
- JSZip lazy-loaded with try/catch fallback (matches turndown — a registry hiccup degrades to a clean error rather than breaking other endpoints).

**Dual-mode CMS pattern editor**
- Editor has a top-bar toggle between **HTML editor** (existing rich text) and **Markdown source** (bundle upload + preview).
- Markdown mode shows an inline error block when a bundle is rejected (e.g. missing image files), a last-upload summary (assets + orphans removed), and a "Copy MD URL" button for handing the canonical source URL to an agent.
- A stale-MD warning appears in HTML mode if the markdown source has been edited more recently than the HTML.

**Server-side processing gate**
- Saves to \`state/patterns\` go through \`processPatternsBeforeSave\` on the edge function: diffs incoming vs stored, stamps \`htmlUpdatedAt\` / \`markdownUpdatedAt\` on the changed side, and runs turndown to auto-generate MD when HTML changes. Works the same whether the save came from CMS, the bundle endpoint, or a \`curl\` PUT — no client-side bypass.

**Display**
- \`MarkdownRenderer\` gains an \`assetBaseUrl\` prop. When set, ReactMarkdown's \`urlTransform\` rewrites relative URLs (\`images/foo.png\`) to \`<assetBaseUrl><relativePath>\`. Absolute URLs, root paths, \`data:\` URIs, and in-page anchors pass through unchanged.
- \`PatternDetailPage\` picks rendering by timestamp: HTML wins when at least as fresh as MD; otherwise renders MD with the pattern's Supabase Storage URL prefix as \`assetBaseUrl\`. Existing HTML-only patterns are unaffected — backfill on load sets \`htmlUpdatedAt\` from each pattern's \`updatedAt\`, and empty \`markdownUpdatedAt\` always loses the comparison.

**Data model**
- \`PatternArticle\` gains \`markdownContent\`, \`htmlUpdatedAt\`, \`markdownUpdatedAt\`. No migration needed; legacy data backfilled on first read.
- New Supabase Storage bucket \`pattern-assets\` (public read), created idempotently by the edge function on first bundle upload.`,
  },
  {
    id: uid(),
    date: "2026-05-10",
    version: "1.4.0",
    title: "AI agent icon search — slim manifest, per-file SVGs, richer tags",
    description: `Three changes that make the icon library easier for AI agents (Claude, Cursor, etc.) to consume, plus a CMS bulk-upload bug fix.

**Slim search manifest**
- \`/icons.index.json\` — same metadata as \`/icons.json\` (name, tags, size) but **no inline SVG bytes**, ~5× smaller (~100 KB vs ~530 KB). Agents use this for the "pick an icon" phase without pulling the whole library into context.

**Per-icon SVG files**
- \`/icons/{fileName}\` — every icon now also serves as a standalone ~700-byte file. After picking via the slim index, an agent (or any consumer) can drop a single icon into a component with \`<img src>\` or a 1-line \`fetch().then(r => r.text())\`.

**Smarter tag matching**
- Expanded the icon tag enrichment dictionary by 45 entries (signature, calibrate, perimeter, wire transfer, screenshot, recycle, integration, …). 115 icons gained richer synonyms (4,703 → 5,276 tags), so queries like "signoff", "math", or "wire payment" now hit the right icon by intent instead of by exact name.

**Size convention documented**
- \`llms.txt\` now spells out that icon size strings are **\`{height}x{width}\`** (height first, *not* the conventional width × height). Same height = same visual bucket; widths within a bucket may vary slightly (e.g. a 16-tall arrow can be 10–12 wide depending on the glyph).

**Fixed: bulk upload could create duplicate icons**
- The Icon Editor's bulk upload had a stale-closure bug where parallel \`FileReader\` callbacks closed over the same \`icons\` snapshot, so two same-named files in one upload would both miss the dedup check and create separate records. Now the batch is deduped at the entry point (last upload wins) and the result dialog surfaces a "Duplicate filenames in batch (collapsed): N" line when it happens.`,
  },
  {
    id: uid(),
    date: "2026-05-10",
    version: "1.3.0",
    title: "Web View pattern — Permission, States, Accessibility",
    description: `Expanded the **Web View** pattern article with the missing top-level sections from the source Figma spec, and filled in the previously-empty Style Variables table.

**New sections**
- **Permission-Gated Interactions** — Location Access, File Upload/Download and Access (with Upload and Download bullet groups), Other Permission Requests
- **States and Error Handling** — Loading State, Slow Network, Skeleton Loader, Offline, Load Failure, Scheduled Outage, Recovery, each with the device-frame illustration from Figma
- **Accessibility** — intro + "detail guide to be added later" placeholder

**Style Variables table**
- 9 rows: Overlay Color, Background, Corner Radius, Shadow / Elevation, Outer Margin, Title Font, Button Size, Button Spacing, Grid System

**Light copy edits**
- "indicate user" → "indicate the cause to the user", "if applies" → "if applicable", "We're doing some works" → "some work", added missing articles ("a deliberate user action"), fixed tense slips on Load Failure intro`,
  },
  {
    id: uid(),
    date: "2026-05-10",
    version: "1.2.2",
    title: "Editor and navigation polish",
    description: `Three small UX fixes across the public site and the article editor.

**Color Swatches preview**
- Swatch thumbnails and hex pills on \`/color/swatches\` were rendering empty/gray because the page referenced a stale \`token.value\` field that had been renamed to \`token.hex\` in a token-utils refactor. Both now read from \`token.hex\`.

**Back links on secondary pages**
- Added \`← Back to <parent>\` links to \`/color/tokens\`, \`/color/swatches\`, \`/typography/tokens\`, and \`/size/tokens\`. Same style as the existing pattern-detail back link.

**Editor — trailing whitespace**
- The article editor (\`RichTextEditor\`) now reserves ~33vh of bottom whitespace inside the contentEditable. Clicking anywhere in the whitespace places the caret at the end of the article (browser-native), and as you type at the end, the caret naturally sits closer to the middle of the viewport instead of glued to the bottom edge.`,
  },
  {
    id: uid(),
    date: "2026-05-10",
    version: "1.2.1",
    title: "Smarter paste in the rich-text editor",
    description: `Pasting in CMS articles now does the right thing without manual reformatting.

**Default behavior matches the destination**
- Plain text from sources like Figma inherits the cursor's current block format — paste at the end of an H2 and the new text stays in that H2.
- HTML and Markdown sources keep their formatting by default.

**Paste as popover**
- For HTML or Markdown pastes, a small popover appears next to the inserted content with **Keep formatting** (default) and **Plain text** (re-applies the destination format).
- Auto-dismisses on outside click, scroll, typing, or after a few seconds.

**Markdown heading shift**
- Markdown headings move up one level on paste (\`##\` → H1, \`###\` → H2, …) so source documents fit this editor's flat heading hierarchy where H1 can repeat per section.

**Bug fix**
- Pasting near a heading no longer leaves a stale H2 underline behind after the heading is split.`,
  },
  {
    id: uid(),
    date: "2026-05-10",
    version: "1.2.0",
    title: "Theme toggle, brand refresh, dark-mode polish",
    description: `The Design System website now applies the latest tokens, brand assets, and library icons end-to-end — and dark mode actually works.

**Theme toggle**
- Top-right dropdown with Light Mode (sun), Dark Mode (moon), Follow Computer Setting (computer)
- Persisted to \`localStorage\`; FOUC-safe inline script in \`index.html\` applies the class before React boots
- "Follow Computer Setting" reacts live to OS-level changes via \`prefers-color-scheme\`

**Dark mode**
- Sidebar, title bar, and footer chrome moved off hardcoded \`bg-white\` / \`bg-[#fafafa]\` onto \`bg-sidebar\` / \`bg-secondary\` tokens
- \`theme.css\` \`.dark\` block now overrides every design-system semantic token (\`--color-label-*\`, \`--color-surface-*\`, \`--color-fill-*\`, \`--color-border-*\`, \`--color-divider-*\`), mirroring \`bootstrap.css\`. Iconology and other token-bound pages are no longer broken in dark mode.

**Library icons in chrome**
- New \`LibraryIcon\` component looks up icons by name from the data store, recolors fills/strokes to \`currentColor\`
- All lucide-react icons removed from \`AppLayout\` and \`ThemeToggle\`
- Tier 1 nav: \`home 24x24\`, \`text 24x24\`, \`color pallette 24x24\`, \`annotation 24x24\`, \`shapes 24x24\`, \`grid 24x24\`
- Footer + utility: \`setting 24x24\`, \`logout 24x24\`, \`lock 24x24\`, \`menu hamburger 24x24\`, \`user circle 16x16\`, \`chevron down 16x16\`, \`check mark 16x16\`
- Chrome icons seeded offline-first via \`chrome-icon-seeds.ts\` so the shell renders even when the live icon backend is unreachable; live data still wins on name match
- LibraryIcon adds a \`lib-icon-size-N\` marker class on its inner \`<svg>\` to opt out of Radix's dropdown-menu \`[&_svg:not([class*='size-'])]:size-4\` rule that was crushing 24px icons to 16px

**Typography**
- Font loader switched from \`Roboto\` → \`Inter\` (weights 400/500/600/800)
- All \`.article-content\` headings + body re-pointed to \`'Inter', sans-serif\`
- Inline \`<code>\` in markdown headings now uses \`0.9em\` (relative) instead of \`var(--text-label)\` (fixed 13px), so a \`font\` chip in an H1 no longer collapses to body size

**Brand**
- Sidebar + title-bar mark uses [\`/logos/glyph-and-text.svg\`](https://arctuition.github.io/design-system/logos/glyph-and-text.svg); dark variant swaps via \`.dark\`
- Favicon set to [\`/logos/glyph.svg\`](https://arctuition.github.io/design-system/logos/glyph.svg) + \`glyph-on-dark.svg\` via \`prefers-color-scheme\`
- Initial loader spinner uses brand orange \`#E3571C\`
- Browser tab title is \`Arctuition Design System\`

**Home**
- Change Log entries collapse by default — only version + date + title show until the user expands

**Generator fix**
- \`scripts/generate-llms-txt.mjs\` now stitches alpha into transparency-token hex codes. Before: \`--color-global-gray-transparency-on-light-85: #000000\` (broken). After: \`#000000D9\`. Affects 167 transparency tokens in [\`/tokens/bootstrap.css\`](https://arctuition.github.io/design-system/tokens/bootstrap.css).`,
  },
  {
    id: uid(),
    date: "2026-05-09",
    version: "1.1.0",
    title: "Color tokens v2 — gold family + caution remap",
    description: `Pulled the latest color tokens from Figma and reworked the CMS upload flow to match the new three-file export.

**Tokens**
- New \`gold\` global color family (10 → 95, plus transparency-on-light / transparency-on-dark variants)
- All \`caution\` semantic tokens (\`label\`, \`fill\`, \`border\`, \`surface\`) re-aliased from \`orange\` → \`gold\`
- The standalone \`orange\` family is preserved in the palette but is no longer wired into any default semantic intent

**CMS**
- Color Tokens Manager: three independent uploads (Global / Semantic — Light / Semantic — Dark) plus a Bulk Upload that auto-routes by filename, mirroring the Size & Space tokens UX
- CSS export now ships three files: \`color-light.css\`, \`color-dark.css\`, \`color-global.css\`
- \`ColorTokenGroup\` data shape collapsed \`globalLight\` + \`globalDark\` into a single \`global\` (mode-independent), with backward-compat migration for legacy payloads
- ChangeLog editor: description field upgraded to a multi-line Markdown textarea — bullets, bold, code spans, and links now render on the home timeline

**Where to look**
- Doc: [/tokens/tokens-color.md](https://arctuition.github.io/design-system/tokens/tokens-color.md)
- Bootstrap: [/tokens/bootstrap.css](https://arctuition.github.io/design-system/tokens/bootstrap.css)`,
  },
  { id: uid(), date: "2026-03-11", version: "1.0.0", title: "Initial Release", description: "Launched the design system with core components including Typography, Color Tokens, Iconology, and Patterns documentation." },
  { id: uid(), date: "2026-03-05", version: "0.9.0", title: "Beta Release", description: "Added semantic and global color token documentation. Introduced dark mode token support." },
  { id: uid(), date: "2026-02-20", version: "0.8.0", title: "Icon Library", description: "Added the icon library with search, download, and tagging capabilities for designers and developers." },
];

const defaultIcons: IconItem[] = [
  { id: uid(), name: "Arrow Right", tags: ["arrow", "direction", "navigation", "right", "forward", "next", "proceed", "continue", "chevron", "east", "go"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>', fileName: "arrow-right.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Arrow Left", tags: ["arrow", "direction", "navigation", "left", "back", "previous", "return", "west", "undo", "retreat"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>', fileName: "arrow-left.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Check", tags: ["check", "confirm", "success", "done", "approve", "tick", "complete", "verified", "accept", "yes", "correct"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>', fileName: "check.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Close", tags: ["close", "x", "dismiss", "remove", "delete", "cancel", "cross", "clear", "exit", "discard"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>', fileName: "close.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Search", tags: ["search", "find", "magnify", "lookup", "magnifying glass", "explore", "discover", "query", "filter", "lens"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>', fileName: "search.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Home", tags: ["home", "house", "main", "dashboard", "residence", "start", "landing", "roof", "building", "shelter"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', fileName: "home.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Settings", tags: ["settings", "gear", "config", "preferences", "sun", "brightness", "light", "display", "contrast", "radial", "rays"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>', fileName: "settings.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "User", tags: ["user", "person", "profile", "account", "avatar", "member", "human", "people", "contact", "identity"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', fileName: "user.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Plus", tags: ["plus", "add", "new", "create", "positive", "increase", "expand", "insert", "append", "more"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>', fileName: "plus.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Menu", tags: ["menu", "hamburger", "navigation", "bars", "list", "lines", "drawer", "sidebar", "toggle", "three lines"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>', fileName: "menu.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Star", tags: ["star", "favorite", "rating", "bookmark", "featured", "highlight", "review", "important", "award", "five point"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', fileName: "star.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  { id: uid(), name: "Download", tags: ["download", "save", "export", "file", "arrow down", "receive", "get", "fetch", "install", "transfer"], svgContent: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>', fileName: "download.svg", createdAt: "2026-03-18T12:00:00.000Z" },
  // Chrome icons — required by AppLayout / ThemeToggle. Each gets a fresh
  // `id` here; live data with the same `name` overwrites these once the
  // server fetch resolves, so CMS uploads continue to win.
  ...chromeIconSeeds.map((seed) => ({ id: uid(), ...seed })),
];

// Ensure every chrome-required icon name exists in `icons`. We match on
// lowercase name; if the server already provides one (e.g. an updated upload),
// it stays — only missing names are filled in from the static seed.
function ensureChromeIcons(icons: IconItem[]): IconItem[] {
  const lowerNames = new Set(icons.map((i) => i.name.toLowerCase()));
  const missing = chromeIconSeeds
    .filter((seed) => !lowerNames.has(seed.name.toLowerCase()))
    .map((seed) => ({ id: uid(), ...seed }));
  return missing.length > 0 ? [...icons, ...missing] : icons;
}

const defaultPatterns: PatternArticle[] = [
  {
    id: uid(),
    title: "Web View",
    content: `<h2>Overview</h2><p>The Web View is a container used to display web content within the app interface. It facilitates embedding web-based content within the mobile and tablet application, allowing reuse of existing web modules while maintaining a cohesive in-app experience.</p><h3>When to Use</h3><p>Use a Web View for content that is external to the app's core codebase, for example, user site management page, interactive help guide, or terms and conditions hosted online.</p><h3>Format Variants</h3><p>To accommodate different workflow scopes and user needs, the Web View is presented in three distinct styles:</p><ul><li><strong>Modal Web View:</strong> A web view displayed as a modal overlay on top of the current context.</li><li><strong>Full-Screen Web View (Single-Page):</strong> A full-screen web view for a single, self-contained web page.</li><li><strong>Full-Screen Web View (Multi-Page/Modal):</strong> A full-screen web view that supports multiple pages or an entire module.</li></ul><h2>Anatomy</h2><h3>Modal Web View</h3><p>An overlay container that dims the background and hosts the web view with a header section displaying the task title.</p><h3>Full-Screen Web View</h3><p>A full-screen container that displays a single web page, providing an immersive browsing experience.</p><h2>Recommendations</h2><p>Use a Web View for content that is external to the app's core codebase. Avoid using a Web View for simple confirmations or inputs that can be achieved with native dialogs or controls.</p>`,
    markdownContent: "",
    markdownUpdatedAt: "",
    htmlUpdatedAt: "2026-03-10",
    createdAt: "2026-03-01",
    updatedAt: "2026-03-10",
    deleted: false,
  },
  {
    id: uid(),
    title: "Navigation Patterns",
    content: `<h2>Overview</h2><p>Navigation patterns define how users move through the application. Consistent navigation helps users build a mental model of the app's structure and find content efficiently.</p><h3>Primary Navigation</h3><p>The primary navigation is the main way users move between top-level sections of the application. It is always visible and provides clear indication of the current location.</p><h3>Secondary Navigation</h3><p>Secondary navigation provides access to sub-sections within a primary section. It appears contextually based on the current primary navigation selection.</p><h2>Best Practices</h2><h3>Consistency</h3><p>Maintain consistent navigation patterns throughout the application. Users should always know where they are and how to get back to familiar locations.</p><h3>Hierarchy</h3><p>Organize navigation items in a logical hierarchy that reflects the information architecture of your content.</p>`,
    markdownContent: "",
    markdownUpdatedAt: "",
    htmlUpdatedAt: "2026-03-08",
    createdAt: "2026-02-15",
    updatedAt: "2026-03-08",
    deleted: false,
  },
  {
    id: uid(),
    title: "Form Patterns",
    content: `<h2>Overview</h2><p>Form patterns establish consistent approaches for collecting user input across the application. Well-designed forms reduce cognitive load and help users complete tasks efficiently.</p><h3>Input Fields</h3><p>Standard input fields should follow consistent sizing, spacing, and labeling conventions. Always provide clear labels and helpful placeholder text.</p><h3>Validation</h3><p>Form validation should be immediate and helpful. Display error messages inline with the relevant field and use color coding to indicate the state of validation.</p><h2>Layout Guidelines</h2><h3>Single Column</h3><p>Use single-column layouts for forms that require sequential input. This is the most common and accessible layout pattern.</p><h3>Multi Column</h3><p>Multi-column layouts may be used for related fields that logically group together, such as first name and last name.</p>`,
    markdownContent: "",
    markdownUpdatedAt: "",
    htmlUpdatedAt: "2026-03-05",
    createdAt: "2026-02-10",
    updatedAt: "2026-03-05",
    deleted: false,
  },
];

const defaultEditors: EditorAccount[] = [
  { id: uid(), username: "admin", password: "ArcSite2026$", role: "admin", createdAt: "2026-01-01" },
];

const defaultHomeArticle = `<h1>Design System</h1><p>Welcome to our Design System. This is a living documentation that provides guidelines, components, and patterns for building consistent user experiences across all our products.</p><p>Our design system helps teams work more efficiently by providing reusable components, clear guidelines, and a shared design language. Explore the sections below to learn about typography, color tokens, iconology, and UI patterns.</p><h2>Getting Started</h2><p>Start by exploring our foundational elements - Typography and Color Tokens. These form the building blocks of every component and pattern in the system. Then dive into our Icon Library and Patterns for more complex implementations.</p>`;

const defaultIconologyArticle = `<h1>Iconology</h1><p>Our icon library provides a comprehensive set of icons designed for consistency across all products. Each icon follows strict grid and sizing guidelines to ensure visual harmony.</p><h2>Usage Guidelines</h2><p>Icons should be used at their designed sizes (16px, 20px, or 24px). Always use the provided SVG files to ensure crisp rendering at any resolution. Icons use <code>currentColor</code> for stroke so they automatically inherit the text color of their container.</p>`;

const STORAGE_KEY = "ds-app-state";

function getDefaults(): AppState {
  return {
    homeArticle: defaultHomeArticle,
    changeLogs: defaultChangeLogs,
    colorTokens: defaultColorTokens,
    sizeTokens: defaultSizeTokens,
    breakpointTokens: defaultBreakpointTokens,
    fontTokens: defaultFontTokens,
    tokenDocs: defaultTokenDocs,
    tokenStatus: { tokenSlotMtimes: {}, tokenSlotPublishedAt: {} },
    iconologyArticle: defaultIconologyArticle,
    icons: defaultIcons,
    patterns: defaultPatterns,
    editors: defaultEditors,
    isAuthenticated: false,
    currentUser: null,
    authExpiry: null,
    articleVersions: [],
  };
}

/** Build state from server data, using defaults for missing keys */
function buildStateFromServer(serverData: Record<string, any>): AppState {
  const defaults = getDefaults();

  // Migrate editors that lack a password field
  const rawEditors = Array.isArray(serverData.editors) ? serverData.editors : defaults.editors;
  const editors = rawEditors.map((e: any) => ({
    id: e.id || uid(),
    username: e.username || "unknown",
    password: e.password || (e.username === "admin" ? "ArcSite2026$" : generateRandomPassword()),
    role: e.role || "editor",
    createdAt: e.createdAt || new Date().toISOString().split("T")[0],
  }));

  const ct = serverData.colorTokens || {};
  const st = serverData.sizeTokens || {};

  return {
    homeArticle: serverData.homeArticle ?? defaults.homeArticle,
    changeLogs: Array.isArray(serverData.changeLogs) ? serverData.changeLogs : defaults.changeLogs,
    colorTokens: {
      // Migrate legacy schema: old payloads stored `globalLight` (and a duplicate
      // `globalDark`). Globals are mode-independent, so collapse to a single
      // `global` array — preferring an explicit new-shape `global` if present.
      global: Array.isArray(ct.global)
        ? ct.global
        : Array.isArray(ct.globalLight)
          ? ct.globalLight
          : Array.isArray(ct.globalDark)
            ? ct.globalDark
            : defaults.colorTokens.global,
      semanticLight: ct.semanticLight || defaults.colorTokens.semanticLight,
      semanticDark: ct.semanticDark || defaults.colorTokens.semanticDark,
    },
    sizeTokens: {
      global: Array.isArray(st.global) ? st.global : defaults.sizeTokens.global,
      deviceMobile: Array.isArray(st.deviceMobile) ? st.deviceMobile : defaults.sizeTokens.deviceMobile,
      deviceTablet: Array.isArray(st.deviceTablet) ? st.deviceTablet : defaults.sizeTokens.deviceTablet,
      webMobile: Array.isArray(st.webMobile) ? st.webMobile : defaults.sizeTokens.webMobile,
      webTablet: Array.isArray(st.webTablet) ? st.webTablet : defaults.sizeTokens.webTablet,
      webDesktop: Array.isArray(st.webDesktop) ? st.webDesktop : defaults.sizeTokens.webDesktop,
      webDesktopLarge: Array.isArray(st.webDesktopLarge) ? st.webDesktopLarge : defaults.sizeTokens.webDesktopLarge,
    },
    breakpointTokens: {
      tokens: Array.isArray(serverData.breakpointTokens?.tokens)
        ? serverData.breakpointTokens.tokens
        : defaults.breakpointTokens.tokens,
    },
    fontTokens: {
      deviceMobile: Array.isArray(serverData.fontTokens?.deviceMobile)
        ? serverData.fontTokens.deviceMobile
        : defaults.fontTokens.deviceMobile,
      deviceTablet: Array.isArray(serverData.fontTokens?.deviceTablet)
        ? serverData.fontTokens.deviceTablet
        : defaults.fontTokens.deviceTablet,
      webMobile: Array.isArray(serverData.fontTokens?.webMobile)
        ? serverData.fontTokens.webMobile
        : defaults.fontTokens.webMobile,
      webDesktop: Array.isArray(serverData.fontTokens?.webDesktop)
        ? serverData.fontTokens.webDesktop
        : defaults.fontTokens.webDesktop,
    },
    tokenDocs: {
      color:
        typeof serverData.tokenDocs?.color === "string" && serverData.tokenDocs.color.length > 0
          ? serverData.tokenDocs.color
          : defaults.tokenDocs.color,
      size:
        typeof serverData.tokenDocs?.size === "string" && serverData.tokenDocs.size.length > 0
          ? serverData.tokenDocs.size
          : defaults.tokenDocs.size,
      typography:
        typeof serverData.tokenDocs?.typography === "string" && serverData.tokenDocs.typography.length > 0
          ? serverData.tokenDocs.typography
          : defaults.tokenDocs.typography,
    },
    tokenStatus: (() => {
      const raw = (serverData.tokenStatus && typeof serverData.tokenStatus === "object")
        ? serverData.tokenStatus
        : {};
      const mtimes = typeof raw.tokenSlotMtimes === "object" && raw.tokenSlotMtimes !== null
        ? raw.tokenSlotMtimes as Record<string, string>
        : {};
      const publishedAt = typeof raw.tokenSlotPublishedAt === "object" && raw.tokenSlotPublishedAt !== null
        ? { ...(raw.tokenSlotPublishedAt as Record<string, string>) }
        : {} as Record<string, string>;

      // Auto-seed publishedAt for any populated slot that has no recorded
      // upload OR publish timestamp. Two cases this covers:
      //
      //   1. Legacy data from before Group E shipped — slot has tokens in
      //      KV but no tracked history. Without seeding, the badge reads
      //      "Published" with no date, which the user can't compare
      //      against future uploads.
      //
      //   2. Payloads still carrying the old `tokensLastPublishedAt`
      //      single-string field (pre-PR #37). Use it as the seed value
      //      so we preserve whatever Publish history the user did track.
      //
      // Important: we only seed when both mtime AND publishedAt are
      // missing for a slot. If a slot has an mtime (user uploaded but
      // never published), the badge should correctly read "Uploaded" —
      // seeding publishedAt there would silently downgrade the badge to
      // "Published" and lie about the slot's state.
      const seedValue = typeof raw.tokensLastPublishedAt === "string"
        ? raw.tokensLastPublishedAt
        : new Date().toISOString();
      const maybeSeed = (slotKey: string, hasData: boolean) => {
        if (hasData && !publishedAt[slotKey] && !mtimes[slotKey]) {
          publishedAt[slotKey] = seedValue;
        }
      };
      const ct = serverData.colorTokens || {};
      maybeSeed("color/global", Array.isArray(ct.global) && ct.global.length > 0);
      maybeSeed("color/light",  Array.isArray(ct.semanticLight) && ct.semanticLight.length > 0);
      maybeSeed("color/dark",   Array.isArray(ct.semanticDark) && ct.semanticDark.length > 0);
      const st = serverData.sizeTokens || {};
      for (const k of ["global", "deviceMobile", "deviceTablet", "webMobile", "webTablet", "webDesktop", "webDesktopLarge"]) {
        maybeSeed(`size/${k}`, Array.isArray(st[k]) && st[k].length > 0);
      }
      maybeSeed("breakpoint", Array.isArray(serverData.breakpointTokens?.tokens) && serverData.breakpointTokens.tokens.length > 0);
      const ft = serverData.fontTokens || {};
      for (const k of ["deviceMobile", "deviceTablet", "webMobile", "webDesktop"]) {
        maybeSeed(`font/${k}`, Array.isArray(ft[k]) && ft[k].length > 0);
      }

      return { tokenSlotMtimes: mtimes, tokenSlotPublishedAt: publishedAt };
    })(),
    iconologyArticle: serverData.iconologyArticle ?? defaults.iconologyArticle,
    icons: ensureChromeIcons(
      Array.isArray(serverData.icons)
        ? serverData.icons.map((i: any) => ({
            ...i,
            createdAt: i.createdAt || "2026-03-18T12:00:00.000Z",
            updatedAt: i.updatedAt || i.createdAt || "2026-03-18T12:00:00.000Z",
          }))
        : defaults.icons,
    ),
    patterns: Array.isArray(serverData.patterns)
      ? serverData.patterns.map((p: any) => {
          // Backfill MD-side fields for legacy data persisted before they existed.
          // Legacy patterns were HTML-only, so htmlUpdatedAt mirrors the doc-level
          // updatedAt. Spread `p` last so any field already present on the saved
          // pattern wins over the default.
          const legacyUpdatedAt = typeof p?.updatedAt === "string" ? p.updatedAt : "";
          return {
            markdownContent: "",
            markdownUpdatedAt: "",
            htmlUpdatedAt: legacyUpdatedAt,
            ...p,
          };
        })
      : defaults.patterns,
    editors,
    isAuthenticated: false,
    currentUser: null,
    authExpiry: null,
    articleVersions: Array.isArray(serverData.articleVersions) ? serverData.articleVersions : [],
  };
}

function loadStateFromLocalStorage(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return buildStateFromServer(parsed);
    }
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  return getDefaults();
}

function loadFromLocalStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return buildStateFromServer(parsed);
    }
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }
  return null;
}

function withAutoIconTags(icon: IconItem): IconItem {
  return rebuildIconTags(icon);
}

function withAutoIconTagsForList(icons: IconItem[]): IconItem[] {
  return icons.map(withAutoIconTags);
}

function normalizeIconTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function persistKey(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to persist key to localStorage:", err);
  }
}

function seedDefaults(): void {
  const defaults = getDefaults();
  const toSave: Record<string, any> = {
    homeArticle: defaults.homeArticle,
    changeLogs: defaults.changeLogs,
    colorTokens: defaults.colorTokens,
    sizeTokens: defaults.sizeTokens,
    breakpointTokens: defaults.breakpointTokens,
    fontTokens: defaults.fontTokens,
    tokenDocs: defaults.tokenDocs,
    tokenStatus: defaults.tokenStatus,
    iconologyArticle: defaults.iconologyArticle,
    icons: defaults.icons,
    patterns: defaults.patterns,
    editors: defaults.editors,
    articleVersions: defaults.articleVersions,
  };
  bulkSaveState(toSave).catch((err) => {
    console.error("Failed to seed defaults to server:", err);
  });
}

const AppContext = createContext<AppContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Detect cache hit once so we can render immediately if localStorage has
  // data — server fetch still runs in the background and merges later.
  const cachedLocal = useRef(loadFromLocalStorage()).current;
  const [state, setState] = useState<AppState>(() => {
    const initialState = cachedLocal ?? getDefaults();
    const initialIcons = enrichAllIconTags(initialState.icons) ?? initialState.icons;
    const hydratedInitialState = { ...initialState, icons: initialIcons };
    // Restore auth session from localStorage if available and not expired
    try {
      const authSession = localStorage.getItem('ds-auth-session');
      if (authSession) {
        const { isAuthenticated, currentUser, authExpiry } = JSON.parse(authSession);
        // Check if session has expired
        if (authExpiry && authExpiry < Date.now()) {
          // Session expired, remove it
          localStorage.removeItem('ds-auth-session');
          console.log('🔒 Auth session expired, logged out');
        } else if (isAuthenticated && currentUser) {
          // Session valid, restore it
          return { ...hydratedInitialState, isAuthenticated, currentUser, authExpiry };
        }
      }
    } catch (err) {
      console.error("Failed to restore auth session:", err);
    }
    return hydratedInitialState;
  });
  // Only show the full-screen spinner when there is no cached data to render.
  // With a cache hit, paint immediately and let the server response merge in.
  const [isLoading, setIsLoading] = useState(cachedLocal === null);
  const initializedRef = useRef(false);
  // articleVersions is lazy-loaded — it's excluded from the bulk GET /state
  // because version history can grow to 10+ MB per article (HTML snapshots
  // with inline images), which used to push the initial load past Safari's
  // 8-second client timeout. We hydrate it the first time anything reads or
  // writes a version. The ref tracks load state; the promise dedups
  // concurrent triggers so a rapid save→save before the load resolves still
  // only fires one GET.
  const articleVersionsLoadedRef = useRef(false);
  const articleVersionsLoadPromiseRef = useRef<Promise<void> | null>(null);
  // Track which keys changed for granular server sync
  const pendingSyncRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Public, render-driving copy of the in-flight set so Save buttons can
  // show real "Saving…" status. Mutations to this set go through React
  // state so consumers re-render. The internal pendingSyncRef stays the
  // source of truth for the debounce machinery.
  const [syncingKeys, setSyncingKeys] = useState<ReadonlySet<string>>(() => new Set());
  const markSyncing = useCallback((keys: string[]) => {
    if (keys.length === 0) return;
    setSyncingKeys((prev) => {
      const next = new Set(prev);
      for (const k of keys) next.add(k);
      return next;
    });
  }, []);
  const markDoneSyncing = useCallback((key: string) => {
    setSyncingKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  /**
   * Ensure articleVersions has been pulled from the server before any
   * write that touches it. The bulk GET /state excludes articleVersions so
   * first paint is fast; this hydrates the slice on demand. Idempotent: the
   * first call starts the fetch, every concurrent caller awaits the same
   * promise, and once it resolves the ref short-circuits all future calls.
   *
   * Critical: saveArticleWithVersion and deleteArticleVersion MUST await
   * this before computing the new articleVersions array, otherwise they'd
   * build `[newVersion, ...empty]` from the initial empty slice and PUT
   * that to the server — clobbering all existing history.
   */
  const ensureArticleVersionsLoaded = useCallback((): Promise<void> => {
    if (articleVersionsLoadedRef.current) return Promise.resolve();
    if (articleVersionsLoadPromiseRef.current) return articleVersionsLoadPromiseRef.current;
    const p = (async () => {
      const versions = await loadStateKey<ArticleVersion[]>("articleVersions", []);
      const safe = Array.isArray(versions) ? versions : [];
      setState((prev) => ({ ...prev, articleVersions: safe }));
      articleVersionsLoadedRef.current = true;
    })().catch((err) => {
      console.warn("articleVersions lazy-load failed; treating as empty:", err);
      articleVersionsLoadedRef.current = true; // give up — empty slice is fine
    });
    articleVersionsLoadPromiseRef.current = p;
    return p;
  }, []);

  // On mount: load from server and seed defaults if needed
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      try {
        const result = await loadStateFromServer();

        if (result.status === "ok") {
          const newState = buildStateFromServer(result.data);
          const enriched = enrichAllIconTags(newState.icons);
          const nextIcons = enriched ?? newState.icons;
          setState((prev) => ({
            ...newState,
            icons: nextIcons,
            isAuthenticated: prev.isAuthenticated,
            currentUser: prev.currentUser,
            authExpiry: prev.authExpiry,
            // Server no longer ships articleVersions in the bulk /state
            // response (lazy-loaded to keep first paint fast), so preserve
            // whatever the localStorage hydration already painted. The
            // version sidebar may briefly show stale data; opening it (or
            // saving an article) triggers ensureArticleVersionsLoaded and
            // refreshes from server.
            articleVersions: prev.articleVersions,
          }));
          if (enriched) {
            persistKey("ds:icons", enriched);
            pendingSyncRef.current.add("icons");
            saveStateKey("icons", enriched).catch(() => {
              // Silently fail - localStorage is the primary storage
            });
          }
          // Persist any tokenStatus that buildStateFromServer auto-seeded
          // (legacy data without publishedAt → gets today's date as
          // baseline; pre-PR #37 single-field payloads → migrated to
          // per-slot map). The seed in memory needs to reach KV so it
          // survives reload and shows a stable date instead of drifting
          // on every load.
          const serverPubAt = result.data.tokenStatus?.tokenSlotPublishedAt;
          const loadedPubAt = newState.tokenStatus.tokenSlotPublishedAt;
          const serverKeys = serverPubAt && typeof serverPubAt === "object"
            ? Object.keys(serverPubAt as Record<string, string>).length
            : 0;
          if (Object.keys(loadedPubAt).length !== serverKeys) {
            pendingSyncRef.current.add("tokenStatus");
            saveStateKey("tokenStatus", newState.tokenStatus).catch(() => {
              // Silently fail - localStorage will keep it
            });
          }
          console.log("✅ Loaded state from server");
          setIsLoading(false);
          return;
        }

        if (result.status === "error") {
          // Server unreachable / paused / errored. We do NOT know whether the
          // KV store is empty, so we MUST NOT seed defaults — doing so would
          // generate fresh uid() rows that would later overwrite the real
          // data once the server comes back. Use whatever localStorage has
          // and leave the server alone.
          console.warn(`📡 Server load failed (${result.reason}); using localStorage, not seeding`);
          // Surface the failure in the UI so editors don't accidentally make
          // changes against a stale local snapshot. Common cause: the
          // Supabase project is paused. Persistent (no auto-dismiss).
          toast.error("Can't reach the content server", {
            description: `Showing the last cached copy. Edits won't sync until the server is back. (${result.reason})`,
            duration: Infinity,
            id: "server-offline",
          });
          const localState = loadFromLocalStorage();
          if (localState && Object.keys(localState).length > 0) {
            const enriched = enrichAllIconTags(localState.icons);
            const nextIcons = enriched ?? localState.icons;
            setState((prev) => ({
              ...localState,
              icons: nextIcons,
              isAuthenticated: prev.isAuthenticated,
              currentUser: prev.currentUser,
              authExpiry: prev.authExpiry,
            }));
            // Note: intentionally do NOT push back to the server here — the
            // server is unreachable, and once it returns we want its data to
            // win, not ours.
            console.log("✅ Loaded state from localStorage (server offline)");
          } else {
            console.log("📦 Using in-memory default state (server offline, no localStorage)");
          }
          setIsLoading(false);
          return;
        }

        // result.status === "empty" — confirmed fresh install. Safe to seed.
        console.log("📦 Server confirmed empty; seeding default state");
        seedDefaults();
        setIsLoading(false);
      } catch (err) {
        // Server unavailable - silently fall back to localStorage
        console.log("📡 Server unavailable, using localStorage");
        
        // Fallback to localStorage on error
        try {
          const localState = loadFromLocalStorage();
          if (localState && Object.keys(localState).length > 0) {
            const enriched = enrichAllIconTags(localState.icons);
            const nextIcons = enriched ?? localState.icons;
            setState((prev) => ({
              ...localState,
              icons: nextIcons,
              isAuthenticated: prev.isAuthenticated,
              currentUser: prev.currentUser,
              authExpiry: prev.authExpiry,
            }));
            if (enriched) {
              persistKey("ds:icons", enriched);
              pendingSyncRef.current.add("icons");
              saveStateKey("icons", enriched).catch(() => {
                // Silently fail - localStorage is the primary storage
              });
            }
            console.log("✅ Loaded state from localStorage");
            setIsLoading(false);
            return;
          }
        } catch (localErr) {
          console.warn("Could not load from localStorage:", localErr);
        }
        
        // Final fallback: use defaults already in state
        console.log("📦 Using default state");
        setIsLoading(false);
      }
    })();
  }, []);

  // Flush pending sync on page unload to prevent data loss
  useEffect(() => {
    const flushSync = () => {
      const keys = Array.from(pendingSyncRef.current);
      pendingSyncRef.current.clear();
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (keys.length === 0) return;

      // During unload, use sendBeacon for best-effort delivery
      // This is more reliable than fetch during page unload
      const stateKeyMap: Record<string, any> = {
        homeArticle: state.homeArticle,
        changeLogs: state.changeLogs,
        colorTokens: state.colorTokens,
        sizeTokens: state.sizeTokens,
        breakpointTokens: state.breakpointTokens,
        fontTokens: state.fontTokens,
        tokenDocs: state.tokenDocs,
        tokenStatus: state.tokenStatus,
        iconologyArticle: state.iconologyArticle,
        icons: state.icons,
        patterns: state.patterns,
        editors: state.editors,
        articleVersions: state.articleVersions,
      };
      
      const payload: Record<string, any> = {};
      for (const key of keys) {
        if (stateKeyMap[key] !== undefined) {
          payload[key] = stateKeyMap[key];
        }
      }
      
      if (Object.keys(payload).length > 0) {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-067f252d/state`;
        try {
          // Use sendBeacon for reliable delivery during page unload
          const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
          const headers = {
            type: "application/json",
          };
          // Note: sendBeacon doesn't support custom headers, so we skip Authorization
          // The data is already in localStorage, so this is just a backup sync
          navigator.sendBeacon(url, blob);
        } catch (err) {
          // If sendBeacon fails, data is already in localStorage so it's fine
        }
      }
    };

    window.addEventListener("beforeunload", flushSync);
    return () => window.removeEventListener("beforeunload", flushSync);
  }, [state]);

  // Persist to localStorage on every state change (instant local cache)
  useEffect(() => {
    const { isAuthenticated, currentUser, ...rest } = state;
    const payload = { ...rest, isAuthenticated: false, currentUser: null };

    // Helper: try to save, strip data progressively if quota exceeded
    const trySave = () => {
      // Attempt 1: full state
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return;
      } catch (e1) {
        if (!isQuotaError(e1)) { console.error("localStorage save failed:", e1); return; }
      }

      // Attempt 2: drop articleVersions (can grow large)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, articleVersions: [] }));
        console.warn("localStorage: dropped articleVersions to fit quota.");
        return;
      } catch (e2) {
        if (!isQuotaError(e2)) { console.error("localStorage save failed:", e2); return; }
      }

      // Attempt 3: drop articleVersions + strip SVG content from icons (keep metadata only)
      try {
        const lightIcons = (payload.icons || []).map(
          ({ id, name, tags, fileName, createdAt, updatedAt }: any) =>
            ({ id, name, tags, fileName, createdAt, updatedAt, svgContent: "" })
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...payload, articleVersions: [], icons: lightIcons }));
        console.warn("localStorage: stripped icon SVG content to fit quota.");
        return;
      } catch (e3) {
        if (!isQuotaError(e3)) { console.error("localStorage save failed:", e3); return; }
      }

      // Attempt 4: save minimal state (auth/user data only, rely on server for the rest)
      try {
        const minimal = {
          homeArticle: "",
          changeLogs: [],
          colorTokens: payload.colorTokens,
          sizeTokens: payload.sizeTokens,
          breakpointTokens: payload.breakpointTokens,
          fontTokens: payload.fontTokens,
          tokenDocs: payload.tokenDocs,
          iconologyArticle: "",
          icons: [],
          patterns: [],
          editors: payload.editors,
          articleVersions: [],
          isAuthenticated: false,
          currentUser: null,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
        console.warn("localStorage: saved minimal state only (quota exceeded). Server sync will restore full data.");
      } catch (e4) {
        // All attempts failed — clear to prevent stale/corrupt data
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        console.error("localStorage: completely full, cleared cache. Server sync is the source of truth.", e4);
      }
    };

    trySave();
  }, [state]);

  // Debounced sync of changed keys to server
  const syncToServer = useCallback(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const keys = Array.from(pendingSyncRef.current);
      pendingSyncRef.current.clear();
      if (keys.length === 0) return;

      // Defense layer (added after the tokenStatus 400-swallow bug):
      // any key not in the shared STATE_KEYS allowlist would be silently
      // rejected by the edge function with HTTP 400. Surface that loudly
      // here so the next maintainer who adds a state slot without
      // registering it gets an immediate, visible error instead of a
      // mystery "my data isn't persisting" symptom.
      const invalidKeys = keys.filter((k) => !isValidStateKey(k));
      if (invalidKeys.length > 0) {
        const msg = `State sync skipped: unknown key(s) ${invalidKeys.join(", ")}. ` +
          `Add to supabase/functions/_shared/state-keys.mjs before syncing.`;
        console.error(msg);
        toast.error(msg);
        // Drop invalid keys; sync only the valid ones below.
        for (const k of invalidKeys) {
          const idx = keys.indexOf(k);
          if (idx >= 0) keys.splice(idx, 1);
        }
        if (keys.length === 0) return;
      }

      // Read current state for the pending keys
      setState((currentState) => {
        const stateKeyMap: Record<string, any> = {
          homeArticle: currentState.homeArticle,
          changeLogs: currentState.changeLogs,
          colorTokens: currentState.colorTokens,
          sizeTokens: currentState.sizeTokens,
          breakpointTokens: currentState.breakpointTokens,
          fontTokens: currentState.fontTokens,
          tokenDocs: currentState.tokenDocs,
          tokenStatus: currentState.tokenStatus,
          iconologyArticle: currentState.iconologyArticle,
          icons: currentState.icons,
          patterns: currentState.patterns,
          editors: currentState.editors,
          articleVersions: currentState.articleVersions,
        };

        // Save each changed key. Surface failures via a per-key sticky
        // toast so the editor knows the change only lives in localStorage —
        // refreshing while the toast is up will overwrite the unsaved
        // change with whatever the server still has.
        for (const key of keys) {
          if (stateKeyMap[key] !== undefined) {
            const value = stateKeyMap[key];
            saveStateKey(key, value)
              .then((ok) => {
                markDoneSyncing(key);
                if (ok) {
                  // Server accepted — clear any prior failure toast for
                  // this key, and clear the global "server unreachable"
                  // toast since the server is clearly reachable now.
                  toast.dismiss(`save-failed-${key}`);
                  toast.dismiss("server-offline");
                } else {
                  toast.error("Couldn't save to the server", {
                    description: `Field "${key}" is only stored locally. Re-save once the server is reachable — refreshing now will lose this change.`,
                    duration: Infinity,
                    id: `save-failed-${key}`,
                  });
                }
              })
              .catch((err) => {
                markDoneSyncing(key);
                toast.error("Couldn't save to the server", {
                  description: `Field "${key}" is only stored locally (${(err as Error)?.message ?? "network error"}). Re-save once the server is reachable — refreshing now will lose this change.`,
                  duration: Infinity,
                  id: `save-failed-${key}`,
                });
              });
          } else {
            // Defensive: nothing to send for this key, but the public
            // syncing-keys set needs to be cleared so any awaiting UI
            // doesn't get stuck on "Saving…".
            markDoneSyncing(key);
          }
        }
        return currentState; // no state change
      });
    }, 500); // debounce 500ms
  }, [markDoneSyncing]);

  const update = useCallback((partial: Partial<AppState>, ...changedKeys: string[]) => {
    setState((prev) => ({ ...prev, ...partial }));
    for (const k of changedKeys) {
      pendingSyncRef.current.add(k);
    }
    markSyncing(changedKeys);
    syncToServer();
  }, [syncToServer, markSyncing]);

  /**
   * Save one key now, awaitable. Bypasses the 500 ms debounce so the Save
   * button can show real "Saving…" → "Saved" / "Save failed" status, and
   * cancels any debounced sync for the same key so we don't double-PUT.
   */
  const saveKeyNow = useCallback(
    async (key: string, value: any): Promise<boolean> => {
      // Don't let a pending debounced sync also fire for this key.
      pendingSyncRef.current.delete(key);
      markSyncing([key]);
      let ok = false;
      try {
        ok = await saveStateKey(key, value);
      } catch {
        ok = false;
      }
      markDoneSyncing(key);
      if (ok) {
        toast.dismiss(`save-failed-${key}`);
        toast.dismiss("server-offline");
      } else {
        toast.error("Couldn't save to the server", {
          description: `Field "${key}" is only stored locally. Try again once the connection is back — refreshing now will lose this change.`,
          duration: Infinity,
          id: `save-failed-${key}`,
        });
      }
      return ok;
    },
    [markSyncing, markDoneSyncing]
  );

  const ctx: AppContextType = {
    ...state,
    isLoading,
    syncingKeys,
    saveKeyNow,
    setHomeArticle: (html) => update({ homeArticle: html }, "homeArticle"),
    addChangeLog: (entry) =>
      update({ changeLogs: [{ ...entry, id: uid() }, ...state.changeLogs] }, "changeLogs"),
    updateChangeLog: (id, entry) =>
      update({ changeLogs: state.changeLogs.map((c) => (c.id === id ? { ...c, ...entry } : c)) }, "changeLogs"),
    removeChangeLog: (id) =>
      update({ changeLogs: state.changeLogs.filter((c) => c.id !== id) }, "changeLogs"),
    setColorTokens: (tokens) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const next = {
          global: tokens.global || [],
          semanticLight: tokens.semanticLight || [],
          semanticDark: tokens.semanticDark || [],
        };
        // Stamp mtime only for slots whose array reference actually changed —
        // a no-op setColorTokens (rare, but possible during sync) shouldn't
        // turn a "Published" badge back into "Uploaded".
        const updates: Record<string, string> = {};
        if (prev.colorTokens.global !== next.global) updates["color/global"] = now;
        if (prev.colorTokens.semanticLight !== next.semanticLight) updates["color/light"] = now;
        if (prev.colorTokens.semanticDark !== next.semanticDark) updates["color/dark"] = now;
        return {
          ...prev,
          colorTokens: next,
          tokenStatus: {
            ...prev.tokenStatus,
            tokenSlotMtimes: { ...prev.tokenStatus.tokenSlotMtimes, ...updates },
          },
        };
      });
      pendingSyncRef.current.add("colorTokens");
      pendingSyncRef.current.add("tokenStatus");
      syncToServer();
    },
    setSizeTokens: (tokens) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const next = {
          global: tokens.global || [],
          deviceMobile: tokens.deviceMobile || [],
          deviceTablet: tokens.deviceTablet || [],
          webMobile: tokens.webMobile || [],
          webTablet: tokens.webTablet || [],
          webDesktop: tokens.webDesktop || [],
          webDesktopLarge: tokens.webDesktopLarge || [],
        };
        const updates: Record<string, string> = {};
        for (const key of ["global", "deviceMobile", "deviceTablet", "webMobile", "webTablet", "webDesktop", "webDesktopLarge"] as const) {
          if (prev.sizeTokens[key] !== next[key]) updates[`size/${key}`] = now;
        }
        return {
          ...prev,
          sizeTokens: next,
          tokenStatus: {
            ...prev.tokenStatus,
            tokenSlotMtimes: { ...prev.tokenStatus.tokenSlotMtimes, ...updates },
          },
        };
      });
      pendingSyncRef.current.add("sizeTokens");
      pendingSyncRef.current.add("tokenStatus");
      syncToServer();
    },
    setBreakpointTokens: (tokens) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const next = tokens.tokens || [];
        const changed = prev.breakpointTokens.tokens !== next;
        return {
          ...prev,
          breakpointTokens: { tokens: next },
          tokenStatus: changed ? {
            ...prev.tokenStatus,
            tokenSlotMtimes: { ...prev.tokenStatus.tokenSlotMtimes, breakpoint: now },
          } : prev.tokenStatus,
        };
      });
      pendingSyncRef.current.add("breakpointTokens");
      pendingSyncRef.current.add("tokenStatus");
      syncToServer();
    },
    setFontTokens: (tokens) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const next = {
          deviceMobile: tokens.deviceMobile || [],
          deviceTablet: tokens.deviceTablet || [],
          webMobile: tokens.webMobile || [],
          webDesktop: tokens.webDesktop || [],
        };
        const updates: Record<string, string> = {};
        for (const key of ["deviceMobile", "deviceTablet", "webMobile", "webDesktop"] as const) {
          if (prev.fontTokens[key] !== next[key]) updates[`font/${key}`] = now;
        }
        return {
          ...prev,
          fontTokens: next,
          tokenStatus: {
            ...prev.tokenStatus,
            tokenSlotMtimes: { ...prev.tokenStatus.tokenSlotMtimes, ...updates },
          },
        };
      });
      pendingSyncRef.current.add("fontTokens");
      pendingSyncRef.current.add("tokenStatus");
      syncToServer();
    },
    markTokensPublished: () => {
      const now = new Date().toISOString();
      setState((prev) => {
        const mtimes = prev.tokenStatus.tokenSlotMtimes;
        const prevPubAts = prev.tokenStatus.tokenSlotPublishedAt;
        const nextPubAts: Record<string, string> = { ...prevPubAts };

        // Enumerate every slot that currently has data. A Publish click
        // pushes the entire KV state to bootstrap.css, so every populated
        // slot is now live — but we only bump `publishedAt` for slots
        // whose content has actually changed since they were last
        // published. Unchanged slots keep their older publishedAt so the
        // badge truthfully reports "this slot's contents went live on X",
        // not "the most recent Publish click was on Y".
        const populatedSlots: string[] = [];
        if (prev.colorTokens.global.length > 0)        populatedSlots.push("color/global");
        if (prev.colorTokens.semanticLight.length > 0) populatedSlots.push("color/light");
        if (prev.colorTokens.semanticDark.length > 0)  populatedSlots.push("color/dark");
        for (const k of ["global", "deviceMobile", "deviceTablet", "webMobile", "webTablet", "webDesktop", "webDesktopLarge"] as const) {
          if (prev.sizeTokens[k].length > 0) populatedSlots.push(`size/${k}`);
        }
        if (prev.breakpointTokens.tokens.length > 0) populatedSlots.push("breakpoint");
        for (const k of ["deviceMobile", "deviceTablet", "webMobile", "webDesktop"] as const) {
          if (prev.fontTokens[k].length > 0) populatedSlots.push(`font/${k}`);
        }

        for (const slot of populatedSlots) {
          const mt = mtimes[slot];
          const pa = prevPubAts[slot];
          // Bump publishedAt when:
          //   - the slot has been re-uploaded since its last publish (mt > pa),
          //   - OR it's the first Publish observing this slot (no pa yet) —
          //     this seeds a baseline for legacy data that was already in KV
          //     before Group E shipped, so the user has a tracked timestamp
          //     to compare against on the next upload cycle.
          // Otherwise (slot unchanged), leave publishedAt alone.
          if ((mt && (!pa || mt > pa)) || (!mt && !pa)) {
            nextPubAts[slot] = now;
          }
        }

        return {
          ...prev,
          tokenStatus: { ...prev.tokenStatus, tokenSlotPublishedAt: nextPubAts },
        };
      });
      pendingSyncRef.current.add("tokenStatus");
      syncToServer();
    },
    setTokenDoc: (key, markdown) => {
      setState((prev) => ({
        ...prev,
        tokenDocs: { ...prev.tokenDocs, [key]: markdown },
      }));
      pendingSyncRef.current.add("tokenDocs");
      syncToServer();
    },
    setIconologyArticle: (html) => update({ iconologyArticle: html }, "iconologyArticle"),
    addIcon: (icon) => {
      const now = new Date().toISOString();
      const nextIcon = withAutoIconTags({
        ...icon,
        id: uid(),
        createdAt: icon.createdAt || now,
        updatedAt: icon.updatedAt || now,
      });
      setState((prev) => ({ ...prev, icons: [...prev.icons, nextIcon] }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    updateIcon: (id, icon) => {
      setState((prev) => ({
        ...prev,
        icons: prev.icons.map((i) => {
          if (i.id !== id) return i;
          const nextIcon = {
            ...i,
            ...icon,
            updatedAt: new Date().toISOString(),
          };
          if (icon.tags !== undefined) {
            const normalizedTags = normalizeIconTags(icon.tags);
            return {
              ...nextIcon,
              tags: normalizedTags.length > 0 ? normalizedTags : buildIconTagsFromName(nextIcon.name),
            };
          }
          return icon.name !== undefined ? withAutoIconTags(nextIcon) : nextIcon;
        }),
      }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    removeIcon: (id) => {
      setState((prev) => ({ ...prev, icons: prev.icons.filter((i) => i.id !== id) }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    bulkAddIcons: (icons) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        icons: [
          ...prev.icons,
          ...withAutoIconTagsForList(
            icons.map((icon) => ({
              ...icon,
              id: uid(),
              createdAt: icon.createdAt || now,
              updatedAt: icon.updatedAt || now,
            }))
          ),
        ],
      }));
      pendingSyncRef.current.add("icons");
      syncToServer();
    },
    regenerateAllIconTags: () => {
      const enriched = enrichAllIconTags(state.icons);
      if (!enriched) return { changed: false, iconCount: state.icons.length };
      persistKey("ds:icons", enriched);
      update({ icons: enriched }, "icons");
      return { changed: true, iconCount: enriched.length };
    },
    addPattern: (pattern) => {
      // Existing addPattern callers create via the HTML editor (only authoring
      // flow today), so the new pattern's HTML side is fresh and the MD side is
      // empty. Phase C's MD-upload flow will set the timestamps the other way.
      const today = new Date().toISOString().split("T")[0];
      update({
        patterns: [
          ...state.patterns,
          {
            ...pattern,
            id: uid(),
            createdAt: today,
            updatedAt: today,
            deleted: false,
            markdownContent: "",
            markdownUpdatedAt: "",
            htmlUpdatedAt: today,
          },
        ],
      }, "patterns");
    },
    updatePattern: (id, pattern) =>
      update({
        patterns: state.patterns.map((p) =>
          p.id === id ? { ...p, ...pattern, updatedAt: new Date().toISOString().split("T")[0] } : p
        ),
      }, "patterns"),
    softDeletePattern: (id) =>
      update({
        patterns: state.patterns.map((p) =>
          p.id === id ? { ...p, deleted: true, deletedAt: new Date().toISOString().split("T")[0] } : p
        ),
      }, "patterns"),
    restorePattern: (id) =>
      update({
        patterns: state.patterns.map((p) =>
          p.id === id ? { ...p, deleted: false, deletedAt: undefined } : p
        ),
      }, "patterns"),
    permanentDeletePattern: (id) =>
      update({ patterns: state.patterns.filter((p) => p.id !== id) }, "patterns"),
    addUser: (editor) =>
      update({ editors: [...state.editors, { ...editor, id: uid(), createdAt: new Date().toISOString().split("T")[0] }] }, "editors"),
    updateUser: (id, updates) =>
      update({
        editors: state.editors.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      }, "editors"),
    removeUser: (id) =>
      update({ editors: state.editors.filter((e) => e.id !== id) }, "editors"),
    login: (username: string, password: string, rememberMe?: boolean) => {
      const user = state.editors.find((e) => e.username === username && e.password === password);
      if (user) {
        const expiry = rememberMe ? Date.now() + (7 * 24 * 60 * 60 * 1000) : null; // 7 days in milliseconds
        setState((prev) => ({ ...prev, isAuthenticated: true, currentUser: user, authExpiry: expiry }));
        // Persist auth state to localStorage for session persistence
        try {
          localStorage.setItem('ds-auth-session', JSON.stringify({ 
            isAuthenticated: true, 
            currentUser: user,
            authExpiry: expiry
          }));
        } catch (err) {
          console.error("Failed to persist auth session:", err);
        }
        return true;
      }
      return false;
    },
    logout: () => {
      update({ isAuthenticated: false, currentUser: null, authExpiry: null });
      // Clear persisted auth session
      try {
        localStorage.removeItem('ds-auth-session');
      } catch (err) {
        console.error("Failed to clear auth session:", err);
      }
    },

    // Versioning
    saveArticleWithVersion: (articleKey: string, content: string, saveFn: (html: string) => void) => {
      // Fire-and-forget: callers don't await this today, and the saveFn
      // (which writes the *new* content) runs synchronously below so the
      // editor's "Saved" toast still snaps. The version creation itself is
      // gated on the lazy load — see ensureArticleVersionsLoaded for why.
      const versionWritePromise = (async () => {
        await ensureArticleVersionsLoaded();
        setState((prev) => {
          const currentContentMap: Record<string, string> = {
            home: prev.homeArticle,
            iconology: prev.iconologyArticle,
          };
          let currentContent = currentContentMap[articleKey];
          if (!currentContent && articleKey.startsWith("pattern-")) {
            const patternId = articleKey.replace("pattern-", "");
            const pattern = prev.patterns.find((p) => p.id === patternId);
            if (pattern) currentContent = pattern.content;
          }
          if (!currentContent || currentContent === content) {
            return prev; // nothing to snapshot
          }
          const existingForKey = (prev.articleVersions || []).filter(
            (v) => v.articleKey === articleKey,
          );
          const versionNum = existingForKey.length + 1;
          const newVersion: ArticleVersion = {
            id: uid(),
            articleKey,
            content: currentContent,
            timestamp: new Date().toISOString(),
            author: prev.currentUser?.username || "admin",
            label: `Version ${versionNum}`,
          };
          const merged = [newVersion, ...(prev.articleVersions || [])];
          return { ...prev, articleVersions: capArticleVersions(merged) };
        });
        // Mirror the change to the server through the existing per-key
        // sync machinery. pendingSyncRef + syncToServer pulls the latest
        // state at flush time, so the version array PUT'd is the post-cap
        // one we just committed above.
        pendingSyncRef.current.add("articleVersions");
        markSyncing(["articleVersions"]);
        syncToServer();
      })();
      // Don't block saveFn on the version write — they're independent. Log
      // any unexpected failure for debugging but don't surface to the UI
      // (the main content save has its own error path).
      versionWritePromise.catch((err) => {
        console.error("Failed to record article version:", err);
      });
      saveFn(content);
    },
    getArticleVersions: (articleKey: string) => {
      // Trigger lazy hydration if a version sidebar opens before any save
      // has fired. Fire-and-forget — the component re-renders when state
      // updates. Idempotent; safe to call from every render.
      if (!articleVersionsLoadedRef.current) {
        ensureArticleVersionsLoaded().catch(() => {});
      }
      return (state.articleVersions || []).filter((v) => v.articleKey === articleKey);
    },
    restoreArticleVersion: (_version: ArticleVersion) => {
      // This is handled by ArticleEditorPage setting draft state
    },
    deleteArticleVersion: (versionId: string) => {
      // Same hydration discipline as saveArticleWithVersion: we MUST have
      // the full server-side slice before computing the filtered array,
      // otherwise the PUT writes an empty list back and wipes history.
      (async () => {
        await ensureArticleVersionsLoaded();
        setState((prev) => ({
          ...prev,
          articleVersions: prev.articleVersions.filter((v) => v.id !== versionId),
        }));
        pendingSyncRef.current.add("articleVersions");
        markSyncing(["articleVersions"]);
        syncToServer();
      })().catch((err) => {
        console.error("Failed to delete article version:", err);
      });
    },
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    // Return a safe loading stub so HMR / error-boundary renders don't crash
    return {
      isLoading: true,
      syncingKeys: new Set<string>() as ReadonlySet<string>,
      saveKeyNow: async () => false,
      homeArticle: "",
      changeLogs: [],
      colorTokens: { global: [], semanticLight: [], semanticDark: [] },
      sizeTokens: { global: [], deviceMobile: [], deviceTablet: [], webMobile: [], webTablet: [], webDesktop: [], webDesktopLarge: [] },
      breakpointTokens: { tokens: [] },
      fontTokens: { deviceMobile: [], deviceTablet: [], webMobile: [], webDesktop: [] },
      tokenDocs: { color: "", size: "", typography: "" },
      tokenStatus: { tokenSlotMtimes: {}, tokenSlotPublishedAt: {} },
      iconologyArticle: "",
      icons: [],
      patternsArticle: "",
      patterns: [],
      trashedPatterns: [],
      users: [],
      setHomeArticle: () => {},
      addChangeLog: () => {},
      updateChangeLog: () => {},
      removeChangeLog: () => {},
      setColorTokens: () => {},
      setSizeTokens: () => {},
      setBreakpointTokens: () => {},
      setFontTokens: () => {},
      markTokensPublished: () => {},
      setTokenDoc: () => {},
      setIconologyArticle: () => {},
      addIcon: () => {},
      updateIcon: () => {},
      removeIcon: () => {},
      bulkAddIcons: () => {},
      regenerateAllIconTags: () => ({ changed: false, iconCount: 0 }),
      setPatternsArticle: () => {},
      addPattern: () => {},
      updatePattern: () => {},
      softDeletePattern: () => {},
      restorePattern: () => {},
      permanentDeletePattern: () => {},
      addUser: () => {},
      updateUser: () => {},
      removeUser: () => {},
    } as unknown as AppContextType;
  }
  return ctx;
}

function isQuotaError(e: any): boolean {
  if (!(e instanceof DOMException)) return false;
  // code 22 = QUOTA_EXCEEDED_ERR (standard)
  // name checks cover Safari/Firefox variants
  return (
    e.code === 22 ||
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}
