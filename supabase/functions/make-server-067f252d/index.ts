import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import {
  ensureBucket,
  uploadAsset,
  uploadAtPath,
  listAssetPaths,
  deleteAssets,
  publicUrlFor,
  guessContentType,
} from "./storage.ts";
import {
  ensureDesignTokensBucket,
  uploadDesignTokenArtifact,
} from "./design-tokens-storage.ts";
// @ts-ignore — pure JS module, no .d.ts; Deno bundles it via relative path.
import {
  colorRowsToFlat,
  sizeRowsToFlat,
  fontRowsToFlat,
  extractBreakpointPxFromRows,
  diffFromBase,
  buildBootstrapCss,
  buildBreakpointsJs,
} from "../_shared/token-generators.mjs";
// @ts-ignore — pure JS module, no .d.ts; Deno bundles it via relative path.
import { buildIconManifests } from "../_shared/icon-manifest.mjs";

// HTML→MD converter for Pattern saves. Markdown is the canonical source of
// truth (Agents fetch it via /patterns/:filename.md); when a user edits a
// Pattern via the CMS rich-text editor the resulting HTML is converted to MD
// here so the canonical store stays in sync with what the user just saved.
// Conversion is one-way and lossy on layout (e.g. two-column → single column),
// but lossless on semantic content. See guidelines/modal-dialog-pattern.md
// architecture decision for rationale.
//
// Lazy-loaded so a transient registry / DOM-shim issue with turndown can't
// brick the whole edge function — if the import fails we just keep MD empty
// for HTML-edited patterns. Other endpoints (state read/write, MD GET/POST)
// stay alive regardless.
let turndownPromise: Promise<{ turndown: (html: string) => string } | null> | null = null;

function loadTurndown(): Promise<{ turndown: (html: string) => string } | null> {
  if (turndownPromise) return turndownPromise;
  turndownPromise = (async () => {
    try {
      const td = await import("npm:turndown@7.1.3");
      const gfmMod = await import("npm:turndown-plugin-gfm@1.0.2");
      const TurndownService = (td as any).default ?? td;
      const gfm = (gfmMod as any).gfm ?? (gfmMod as any).default?.gfm;
      const instance = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
        emDelimiter: "_",
        bulletListMarker: "-",
        linkStyle: "inlined",
        hr: "---",
      });
      if (gfm) instance.use(gfm);
      return instance;
    } catch (e) {
      console.error("Failed to load turndown; HTML→MD generation disabled:", e);
      return null;
    }
  })();
  return turndownPromise;
}

async function htmlToMd(html: string): Promise<string> {
  if (!html || !html.trim()) return "";
  const td = await loadTurndown();
  if (!td) return "";
  try {
    return td.turndown(html);
  } catch (e) {
    console.error("turndown call failed; storing empty MD as fallback:", e);
    return "";
  }
}

function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// JSZip lazy-loaded the same way as turndown — first bundle upload pays the
// import cost, subsequent calls reuse the cached module. Keeps cold-start
// fast for read-heavy traffic.
let jszipPromise: Promise<any | null> | null = null;
function loadJSZip(): Promise<any | null> {
  if (jszipPromise) return jszipPromise;
  jszipPromise = (async () => {
    try {
      const mod = await import("npm:jszip@3.10.1");
      return (mod as any).default ?? mod;
    } catch (e) {
      console.error("Failed to load JSZip:", e);
      return null;
    }
  })();
  return jszipPromise;
}

/**
 * Find every relative image reference in a markdown string.
 * Skips absolute URLs (http://, https://, /, data:) and fenced code blocks.
 * Used by the bundle endpoint to validate that every `![](path)` in the MD
 * has a matching file in the zip, before any Storage write happens.
 */
function extractRelativeImageRefs(md: string): string[] {
  const out: string[] = [];
  const lines = md.split("\n");
  let inFence = false;
  // Match Markdown image syntax: ![alt text](path "optional title")
  // Capturing group 1 = the URL portion before any whitespace + title.
  const re = /!\[[^\]]*\]\(\s*([^\s)]+)/g;
  for (const line of lines) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      const url = m[1];
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/") ||
        url.startsWith("data:") ||
        url.startsWith("#")
      ) {
        continue;
      }
      // Decode percent-escapes ("My%20file.png" → "My file.png") so the path
      // can be matched against the literal filename in the zip.
      try {
        out.push(decodeURIComponent(url));
      } catch {
        out.push(url);
      }
    }
  }
  return out;
}

const app = new Hono();

// Enable logger with error handling
app.use("*", logger());

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: false,
  }),
);

// Global error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

// KV key prefix for this app
const PREFIX = "ds:";

// All state keys stored in KV. Imported from a shared module so the client
// and server cannot drift — see ../_shared/state-keys.mjs for the rationale.
// @ts-ignore — pure JS module, no .d.ts; Deno bundles it via relative path.
import { STATE_KEYS } from "../_shared/state-keys.mjs";

// Keys returned by the bulk GET /state. articleVersions is excluded because
// its size is dominated by HTML snapshots of pattern content (~1 MB per
// snapshot once images creep in) and the initial /state load is on the
// critical path of first paint. Clients fetch articleVersions on demand via
// GET /state/articleVersions when the Version sidebar is opened.
const STATE_KEYS_INITIAL = STATE_KEYS.filter((k) => k !== "articleVersions");

// Per-articleKey cap on stored versions. Both client and server enforce this
// so a curl PUT or a buggy client can't grow KV without bound. Older versions
// past the cap are dropped silently — they're not surfaced anywhere in the UI
// once they fall off the list.
const MAX_VERSIONS_PER_ARTICLE = 5;

// HTML keys (string-valued) whose content gets the inline-image stripper
// applied on save. These articles all go through the rich-text editor and
// can accumulate `data:image/...` base64 inline images, which blow up the
// KV row size and the /state payload. The stripper uploads each image to
// Storage and rewrites the src in place.
const HTML_KEY_NAMESPACE: Record<string, string> = {
  homeArticle: "home",
  iconologyArticle: "iconology",
};

// ──────────────────────────────────────────────
// Inline image stripping. Rich-text pastes and the editor's "upload image"
// button both inline images as `data:image/...;base64,...` URLs inside the
// saved HTML. A single saved screenshot easily adds 200 KB+ to the row, and
// version history multiplies that 5× per cap. The stripper extracts every
// data URL, uploads it once to Storage (deduped by content hash), and
// rewrites the HTML to reference the public URL. Runs in every save path:
// pattern PUT, generic /state/:key PUT for HTML article keys, articleVersion
// POST. New saves are clean; legacy rows clean themselves up on next save.
// ──────────────────────────────────────────────

async function sha256Hex(bytes: Uint8Array, len = 12): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(buf))
    .slice(0, Math.ceil(len / 2))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, len);
}

function extFromMime(mimeSuffix: string): { ext: string; contentType: string } {
  const s = mimeSuffix.toLowerCase();
  if (s === "jpeg" || s === "jpg") return { ext: "jpg", contentType: "image/jpeg" };
  if (s === "svg+xml" || s === "svg") return { ext: "svg", contentType: "image/svg+xml" };
  if (s === "png" || s === "gif" || s === "webp" || s === "avif" || s === "bmp") {
    return { ext: s, contentType: `image/${s}` };
  }
  // Unknown — keep as png-ish blob so it still renders if the browser was lenient.
  return { ext: "bin", contentType: "application/octet-stream" };
}

function decodeBase64(b64: string): Uint8Array {
  // atob() on Deno handles standard base64; tolerate accidental whitespace.
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Upload a single `data:image/...;base64,...` URL to Storage at
 *   `_inline/<articleKey>/<contentHash>.<ext>`
 * and return the public URL. Content-addressed so identical images across
 * versions or articles only ever cost one row. Returns null on failure so
 * the caller can leave the data URL in place rather than losing content.
 */
async function uploadInlineImage(
  articleKey: string,
  dataUrl: string,
): Promise<string | null> {
  const m = dataUrl.match(/^data:image\/([a-zA-Z0-9+.\-]+);base64,([\s\S]+)$/);
  if (!m) return null;
  try {
    const bytes = decodeBase64(m[2]);
    if (bytes.length === 0) return null;
    const { ext, contentType } = extFromMime(m[1]);
    const hash = await sha256Hex(bytes, 16);
    await ensureBucket();
    const safeKey = articleKey.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const objectPath = `_inline/${safeKey}/${hash}.${ext}`;
    const { publicUrl } = await uploadAtPath(objectPath, bytes, contentType);
    return publicUrl;
  } catch (e) {
    console.error(`uploadInlineImage(${articleKey}) failed:`, e);
    return null;
  }
}

/**
 * Walk an HTML string for `data:image/...;base64,...` URLs, upload each
 * unique one to Storage, and return HTML with the URLs swapped for their
 * public counterparts. If any single upload fails, that data URL is left
 * untouched in the output (no data loss) but the rest still get rewritten.
 */
async function stripInlineImagesFromHtml(
  html: string,
  articleKey: string,
): Promise<string> {
  if (!html || typeof html !== "string" || !html.includes("data:image/")) {
    return html ?? "";
  }
  // Capture full data URLs. The base64 alphabet is [A-Za-z0-9+/=] but RTE
  // output sometimes wraps very long URLs across attribute boundaries, so
  // we grab greedily up to the closing quote.
  const re = /data:image\/[a-zA-Z0-9+.\-]+;base64,[A-Za-z0-9+/=]+/g;
  const matches = html.match(re);
  if (!matches || matches.length === 0) return html;

  // Dedup before uploading.
  const unique = Array.from(new Set(matches));
  const urlMap = new Map<string, string>();
  for (const dataUrl of unique) {
    const publicUrl = await uploadInlineImage(articleKey, dataUrl);
    if (publicUrl) urlMap.set(dataUrl, publicUrl);
  }
  if (urlMap.size === 0) return html;

  // Replace longest first so we don't accidentally chop a prefix of a longer
  // URL while replacing a shorter one (unique by string, but length-sort is
  // a cheap safety belt).
  const sorted = Array.from(urlMap.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );
  let out = html;
  for (const [dataUrl, publicUrl] of sorted) {
    out = out.split(dataUrl).join(publicUrl);
  }
  return out;
}

/**
 * Drop the oldest entries per articleKey so each key keeps at most
 * `MAX_VERSIONS_PER_ARTICLE`. The input array is expected to be in
 * newest-first order (matches the client's `[newVersion, ...existing]`
 * shape); the output preserves that order, just trimmed.
 */
function capArticleVersions(versions: any[]): any[] {
  if (!Array.isArray(versions)) return versions;
  const counts = new Map<string, number>();
  const kept: any[] = [];
  for (const v of versions) {
    if (!v || typeof v !== "object") continue;
    const key = typeof v.articleKey === "string" ? v.articleKey : "_unknown";
    const next = (counts.get(key) ?? 0) + 1;
    if (next > MAX_VERSIONS_PER_ARTICLE) continue;
    counts.set(key, next);
    kept.push(v);
  }
  return kept;
}

/**
 * Run inline-image stripping over every version's content field, using the
 * version's own articleKey for the namespace. Returns a new array.
 */
async function processArticleVersionsBeforeSave(
  incoming: unknown,
): Promise<unknown> {
  if (!Array.isArray(incoming)) return incoming;
  const capped = capArticleVersions(incoming);
  const out: any[] = [];
  for (const v of capped) {
    if (!v || typeof v !== "object") {
      out.push(v);
      continue;
    }
    const articleKey = typeof v.articleKey === "string" ? v.articleKey : "_unknown";
    const content = typeof v.content === "string" ? v.content : "";
    const stripped = content ? await stripInlineImagesFromHtml(content, articleKey) : "";
    out.push({ ...v, content: stripped });
  }
  return out;
}

/**
 * Strip inline images from a top-level HTML article key (homeArticle,
 * iconologyArticle). No-op for keys not in HTML_KEY_NAMESPACE.
 */
async function processHtmlKeyBeforeSave(
  key: string,
  value: unknown,
): Promise<unknown> {
  const ns = HTML_KEY_NAMESPACE[key];
  if (!ns) return value;
  if (typeof value !== "string") return value;
  return stripInlineImagesFromHtml(value, ns);
}

// ──────────────────────────────────────────────
// Pattern save processing — server-side gate that makes curl PUT and CMS PUT
// functionally equivalent. Diffs incoming patterns against stored ones and
// stamps htmlUpdatedAt / markdownUpdatedAt on the changed side, plus runs
// turndown when HTML changes so MD stays in sync. Client-supplied timestamps
// for changed fields are ignored — the server is authoritative for "when".
// ──────────────────────────────────────────────
async function processPatternsBeforeSave(incoming: unknown): Promise<unknown> {
  if (!Array.isArray(incoming)) return incoming;

  const stored = (await kv.get(`${PREFIX}patterns`)) as unknown[] | null;
  const storedById = new Map<string, any>();
  if (Array.isArray(stored)) {
    for (const p of stored) {
      if (p && typeof p === "object" && typeof (p as any).id === "string") {
        storedById.set((p as any).id, p);
      }
    }
  }

  const today = todayDate();

  // htmlToMd is async (lazy turndown load), so we map sequentially with await.
  // Patterns array is small (<20), so awaiting per-item is fine; the alternative
  // (Promise.all) would invoke turndown in parallel for no real benefit.
  const out: any[] = [];
  for (const raw of incoming) {
    if (!raw || typeof raw !== "object") {
      out.push(raw);
      continue;
    }
    const p = raw as Record<string, any>;
    const id = typeof p.id === "string" ? p.id : null;
    const old = id ? storedById.get(id) : null;

    // Strip inline `data:image/...` URLs out of the HTML *before* any of the
    // diff / turndown work below — turndown sees normal <img src> URLs and
    // emits clean Markdown, and the KV row no longer carries hundreds of KB
    // per pasted screenshot. The articleKey passed to the stripper is the
    // same one the version system uses (`pattern-<id>`), so inline images
    // from a pattern and from its version history share the dedup namespace.
    const namespacedKey = id ? `pattern-${id}` : "pattern-unknown";
    const rawContent = typeof p.content === "string" ? p.content : "";
    const newContent = rawContent
      ? await stripInlineImagesFromHtml(rawContent, namespacedKey)
      : "";
    const newMd = typeof p.markdownContent === "string" ? p.markdownContent : "";

    if (!old) {
      // New pattern. If client sent HTML but no MD, auto-generate MD.
      const md = newMd || (newContent ? await htmlToMd(newContent) : "");
      out.push({
        ...p,
        content: newContent,
        markdownContent: md,
        htmlUpdatedAt: newContent ? today : "",
        markdownUpdatedAt: md ? today : "",
      });
      continue;
    }

    const oldContent = typeof old.content === "string" ? old.content : "";
    const oldMd = typeof old.markdownContent === "string" ? old.markdownContent : "";
    const htmlChanged = newContent !== oldContent;
    const mdChangedDirectly = !htmlChanged && newMd !== oldMd;

    if (htmlChanged) {
      // HTML wins: regenerate MD, bump both timestamps.
      out.push({
        ...p,
        content: newContent,
        markdownContent: await htmlToMd(newContent),
        htmlUpdatedAt: today,
        markdownUpdatedAt: today,
      });
      continue;
    }
    if (mdChangedDirectly) {
      // MD-only change: bump only markdownUpdatedAt.
      out.push({
        ...p,
        markdownContent: newMd,
        markdownUpdatedAt: today,
        htmlUpdatedAt: typeof old.htmlUpdatedAt === "string" ? old.htmlUpdatedAt : "",
      });
      continue;
    }
    // Neither content field changed — preserve stored timestamps regardless of
    // what the client sent for them.
    out.push({
      ...p,
      htmlUpdatedAt: typeof old.htmlUpdatedAt === "string" ? old.htmlUpdatedAt : "",
      markdownUpdatedAt: typeof old.markdownUpdatedAt === "string" ? old.markdownUpdatedAt : "",
    });
  }
  return out;
}

// Health check endpoint
app.get("/make-server-067f252d/health", (c) => {
  return c.json({ status: "ok" });
});

// ──────────────────────────────────────────────
// GET /state — Load critical app state from KV. Excludes articleVersions
// (fetched lazily via GET /state/:key when the Version sidebar opens) so
// the first-paint payload stays small enough to fit under the client's
// 8-second load timeout even when version history is heavy.
// ──────────────────────────────────────────────
app.get("/make-server-067f252d/state", async (c) => {
  try {
    const state: Record<string, any> = {};
    const results = await Promise.allSettled(
      STATE_KEYS_INITIAL.map(async (key) => {
        const value = await kv.get(`${PREFIX}${key}`);
        return { key, value };
      })
    );

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        state[result.value.key] = result.value.value;
      }
    });

    return c.json({ data: state });
  } catch (err) {
    console.error("Error loading state from KV:", err);
    return c.json({ error: `Failed to load state: ${err}` }, 500);
  }
});

// ──────────────────────────────────────────────
// GET /state/:key — Load a single state key. Used by the client to lazy-fetch
// articleVersions on demand, and as a general escape hatch for fetching any
// single key without pulling the full /state payload.
// ──────────────────────────────────────────────
app.get("/make-server-067f252d/state/:key", async (c) => {
  try {
    const key = c.req.param("key");
    if (!STATE_KEYS.includes(key)) {
      return c.json({ error: `Invalid state key: ${key}` }, 400);
    }
    const value = await kv.get(`${PREFIX}${key}`);
    return c.json({ data: value ?? null });
  } catch (err) {
    console.error("Error loading state key from KV:", err);
    return c.json({ error: `Failed to load state: ${err}` }, 500);
  }
});

// ──────────────────────────────────────────────
// PUT /state/:key — Update a single state key
// ──────────────────────────────────────────────
app.put("/make-server-067f252d/state/:key", async (c) => {
  try {
    const key = c.req.param("key");
    if (!STATE_KEYS.includes(key)) {
      return c.json({ error: `Invalid state key: ${key}` }, 400);
    }
    const body = await c.req.json();
    let value = body.value;
    if (key === "patterns") {
      value = await processPatternsBeforeSave(value);
    } else if (key === "articleVersions") {
      value = await processArticleVersionsBeforeSave(value);
    } else if (HTML_KEY_NAMESPACE[key]) {
      value = await processHtmlKeyBeforeSave(key, value);
    }
    await kv.set(`${PREFIX}${key}`, value);
    // A token-slot write is also a publish (best-effort): regenerate the live
    // Storage artifacts so bootstrap.css / the token docs never lag the CMS.
    await maybeAutoPublishTokens([key]);
    return c.json({ ok: true });
  } catch (err) {
    console.error("Error saving state key to KV:", err);
    return c.json({ error: `Failed to save state: ${err}` }, 500);
  }
});

// ──────────────────────────────────────────────
// PUT /state — Bulk save all state keys at once
// ──────────────────────────────────────────────
app.put("/make-server-067f252d/state", async (c) => {
  try {
    const body = await c.req.json();
    const keys: string[] = [];
    const values: any[] = [];
    for (const k of STATE_KEYS) {
      if (body[k] !== undefined) {
        let value = body[k];
        if (k === "patterns") {
          value = await processPatternsBeforeSave(value);
        } else if (k === "articleVersions") {
          value = await processArticleVersionsBeforeSave(value);
        } else if (HTML_KEY_NAMESPACE[k]) {
          value = await processHtmlKeyBeforeSave(k, value);
        }
        keys.push(`${PREFIX}${k}`);
        values.push(value);
      }
    }
    if (keys.length > 0) {
      await kv.mset(keys, values);
    }
    // Auto-publish if any token slot was part of this bulk write (best-effort).
    await maybeAutoPublishTokens(STATE_KEYS.filter((k) => body[k] !== undefined));
    return c.json({ ok: true });
  } catch (err) {
    console.error("Error bulk saving state to KV:", err);
    return c.json({ error: `Failed to bulk save state: ${err}` }, 500);
  }
});

// ──────────────────────────────────────────────
// DELETE /state/:key — Delete a single state key
// ──────────────────────────────────────────────
app.delete("/make-server-067f252d/state/:key", async (c) => {
  try {
    const key = c.req.param("key");
    if (!STATE_KEYS.includes(key)) {
      return c.json({ error: `Invalid state key: ${key}` }, 400);
    }
    await kv.del(`${PREFIX}${key}`);
    return c.json({ ok: true });
  } catch (err) {
    console.error("Error deleting state key from KV:", err);
    return c.json({ error: `Failed to delete state: ${err}` }, 500);
  }
});

// ──────────────────────────────────────────────
// GET /patterns/:filename — Public read endpoint for AI / LLM consumption.
// Returns the canonical markdown source of a single pattern, with
// Content-Type: text/markdown so Agents can fetch and parse without
// touching the JSON state envelope. Looked up by slug (kebab-cased title)
// or by id. Auth still flows through the outer router (anon key Bearer);
// anon key is public per utils/supabase/info.tsx so Agents can use it.
// ──────────────────────────────────────────────
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

app.get("/make-server-067f252d/patterns/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    if (!filename.endsWith(".md")) {
      return c.json({ error: "Only .md is supported here" }, 400);
    }
    const slug = filename.slice(0, -3);

    const patterns = (await kv.get(`${PREFIX}patterns`)) as any[] | null;
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return c.text("Pattern not found", 404);
    }

    const match = patterns.find(
      (p) =>
        p &&
        !p.deleted &&
        (p.id === slug || slugify(p.title || "") === slug),
    );
    if (!match) {
      return c.text("Pattern not found", 404);
    }

    const md =
      typeof match.markdownContent === "string" ? match.markdownContent : "";
    const body =
      md ||
      `# ${match.title}\n\n_No markdown source uploaded yet for this pattern._\n`;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Error reading pattern markdown:", err);
    return c.text("Server error", 500);
  }
});

// ──────────────────────────────────────────────
// Icons — served LIVE from the `icons` KV slot, the same way patterns serve
// their canonical MD above. No publish/build step: an icon uploaded via the
// CMS is reachable here within the Cache-Control TTL. `llms.txt` points AI
// agents at these URLs (decision #13). The manifests are built by the shared
// `buildIconManifests` so this live output is byte-identical to the static
// public/icons*.json the prebuild script writes for the same KV input.
//
//   GET /icons.index.json   slim search manifest (no SVG bytes)
//   GET /icons.json         full manifest (inline svgContent)
//   GET /icons/:fileName     raw SVG for one icon (~700 B)
//
// Anon-key Bearer (public) flows through the outer router, same as patterns.
// ──────────────────────────────────────────────
async function loadIconManifests() {
  const raw = (await kv.get(`${PREFIX}icons`)) as unknown[] | null;
  return buildIconManifests(Array.isArray(raw) ? raw : []);
}

app.get("/make-server-067f252d/icons.index.json", async (c) => {
  try {
    const { index } = await loadIconManifests();
    return new Response(JSON.stringify(index), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Error building icon index manifest:", err);
    return c.json({ error: "Server error" }, 500);
  }
});

app.get("/make-server-067f252d/icons.json", async (c) => {
  try {
    const { full } = await loadIconManifests();
    return new Response(JSON.stringify(full), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Error building icon manifest:", err);
    return c.json({ error: "Server error" }, 500);
  }
});

app.get("/make-server-067f252d/icons/:fileName", async (c) => {
  try {
    const fileName = c.req.param("fileName");
    const { full } = await loadIconManifests();
    const match = full.icons.find((i: { fileName?: string }) => i.fileName === fileName);
    if (!match || typeof match.svgContent !== "string" || !match.svgContent) {
      return c.text("Icon not found", 404);
    }
    return new Response(match.svgContent, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Error reading icon svg:", err);
    return c.text("Server error", 500);
  }
});

// ──────────────────────────────────────────────
// POST /patterns/:slug — Upload markdown for an existing pattern.
// Body: text/markdown raw, OR application/json with { markdownContent: string }.
// Updates markdownContent + markdownUpdatedAt without touching the HTML side.
// Pattern must already exist (create it first via the standard add flow).
// Looked up by id or kebab-cased title slug, same rules as the GET endpoint.
// ──────────────────────────────────────────────
app.post("/make-server-067f252d/patterns/:slug", async (c) => {
  try {
    const rawSlug = c.req.param("slug");
    const slug = rawSlug.endsWith(".md") ? rawSlug.slice(0, -3) : rawSlug;
    const contentType = c.req.header("content-type") || "";

    let md: string | null = null;
    if (contentType.includes("application/json")) {
      const body = await c.req.json().catch(() => null);
      if (body && typeof body.markdownContent === "string") {
        md = body.markdownContent;
      }
    } else if (contentType.includes("text/markdown") || contentType.includes("text/plain")) {
      md = await c.req.text();
    } else {
      // Try JSON first, then plain text as a last resort.
      const text = await c.req.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.markdownContent === "string") md = parsed.markdownContent;
      } catch {
        md = text;
      }
    }

    if (md === null || typeof md !== "string") {
      return c.json(
        { error: "Body must be raw markdown (Content-Type: text/markdown) or JSON with `markdownContent: string`." },
        400,
      );
    }

    const patterns = (await kv.get(`${PREFIX}patterns`)) as any[] | null;
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return c.json({ error: "Pattern not found" }, 404);
    }

    const matchIdx = patterns.findIndex(
      (p) =>
        p &&
        !p.deleted &&
        (p.id === slug || slugify(p.title || "") === slug),
    );
    if (matchIdx < 0) {
      return c.json({ error: "Pattern not found" }, 404);
    }

    const today = todayDate();
    const updated = {
      ...patterns[matchIdx],
      markdownContent: md,
      markdownUpdatedAt: today,
      updatedAt: today,
    };
    const newPatterns = [...patterns];
    newPatterns[matchIdx] = updated;
    await kv.set(`${PREFIX}patterns`, newPatterns);

    return c.json({ ok: true, pattern: updated });
  } catch (err) {
    console.error("Error uploading pattern markdown:", err);
    return c.json({ error: `Failed: ${err}` }, 500);
  }
});

// ──────────────────────────────────────────────
// POST /patterns/:slug/bundle — Upload a zip bundle (markdown + assets) for
// a pattern. The zip mirrors the editor's local folder 1:1: one .md file at
// the root + any number of asset files (images, figures) in arbitrary
// subdirectories. The MD references assets by relative paths; we don't
// rewrite them — Storage layout mirrors the bundle structure, and the
// browser-side renderer uses the pattern's asset base URL to resolve them.
//
// Body: multipart/form-data, field "bundle" = the zip blob.
// Pattern must exist already (create via the standard CMS Add flow first).
// ──────────────────────────────────────────────
app.post("/make-server-067f252d/patterns/:slug/bundle", async (c) => {
  try {
    const rawSlug = c.req.param("slug");
    const slug = rawSlug.endsWith(".zip") ? rawSlug.slice(0, -4) : rawSlug;

    // 1. Look up the pattern. Must exist.
    const patterns = (await kv.get(`${PREFIX}patterns`)) as any[] | null;
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return c.json({ error: "Pattern not found" }, 404);
    }
    const matchIdx = patterns.findIndex(
      (p) => p && !p.deleted && (p.id === slug || slugify(p.title || "") === slug),
    );
    if (matchIdx < 0) {
      return c.json({ error: "Pattern not found" }, 404);
    }
    const patternId = patterns[matchIdx].id as string;

    // 2. Parse the multipart body. Hono exposes Web FormData natively.
    const form = await c.req.formData().catch(() => null);
    const file = form?.get("bundle");
    if (!file || !(file instanceof File)) {
      return c.json(
        { error: "Multipart body missing required `bundle` (zip) field." },
        400,
      );
    }
    const arrayBuffer = await file.arrayBuffer();

    // 3. Unzip.
    const JSZip = await loadJSZip();
    if (!JSZip) {
      return c.json({ error: "Server-side zip parser unavailable" }, 503);
    }
    let zip: any;
    try {
      zip = await new JSZip().loadAsync(arrayBuffer);
    } catch (e) {
      return c.json({ error: `Could not parse zip: ${(e as Error).message}` }, 400);
    }

    // 4. Walk entries; collect files, find the .md.
    type Entry = { path: string; bytes: Uint8Array };
    const entries: Entry[] = [];
    const mdEntries: Entry[] = [];
    for (const [path, entry] of Object.entries<any>(zip.files)) {
      if (entry.dir) continue;
      // Skip macOS / OS resource files that sneak into zips.
      const base = path.split("/").pop() ?? "";
      if (
        base.startsWith(".") ||
        path.startsWith("__MACOSX/") ||
        path.includes("/.")
      ) {
        continue;
      }
      const bytes: Uint8Array = await entry.async("uint8array");
      const e: Entry = { path, bytes };
      entries.push(e);
      if (path.toLowerCase().endsWith(".md")) mdEntries.push(e);
    }

    if (mdEntries.length === 0) {
      return c.json(
        { error: "Bundle is missing a .md file at any path." },
        400,
      );
    }
    if (mdEntries.length > 1) {
      return c.json(
        {
          error: "Bundle has multiple .md files; expected exactly one.",
          found: mdEntries.map((e) => e.path),
        },
        400,
      );
    }

    // 5. Decode the markdown and collect asset paths relative to the MD's
    // own directory. Bundles often have the MD at the root + images/ next to
    // it; if the MD is in a subdir (e.g. "modal-dialog/foo.md") we treat that
    // subdir as the base for everything.
    const mdEntry = mdEntries[0];
    const mdText = new TextDecoder("utf-8").decode(mdEntry.bytes);
    const mdDir = mdEntry.path.includes("/")
      ? mdEntry.path.slice(0, mdEntry.path.lastIndexOf("/") + 1)
      : "";

    // Map of relative-to-MD paths → entry, used for both validation and upload.
    const assetsByRelPath = new Map<string, Entry>();
    for (const e of entries) {
      if (e.path === mdEntry.path) continue;
      // If MD lives in a subdir, include only assets under the same prefix
      // and store them stripped (so "modal-dialog/images/foo.png" becomes
      // "images/foo.png" — matches what the MD references).
      if (mdDir && !e.path.startsWith(mdDir)) continue;
      const rel = mdDir ? e.path.slice(mdDir.length) : e.path;
      assetsByRelPath.set(rel, e);
    }

    // 6. Validate: every relative ![](...) ref in the MD must exist in the
    // bundle. List ALL missing refs in one error so the user can fix the
    // bundle in one go.
    const refs = extractRelativeImageRefs(mdText);
    const missing = refs.filter((ref) => !assetsByRelPath.has(ref));
    if (missing.length > 0) {
      return c.json(
        {
          error: "Markdown references files that aren't in the bundle.",
          missing,
          tip: "Add the missing files to the zip, or fix the paths in the markdown.",
        },
        400,
      );
    }

    // 7. Upload assets (each to its bundle-relative path under <patternId>/).
    await ensureBucket();
    const uploaded: { path: string; url: string }[] = [];
    for (const [relPath, entry] of assetsByRelPath) {
      const { publicUrl } = await uploadAsset(
        patternId,
        relPath,
        entry.bytes,
        guessContentType(relPath),
      );
      uploaded.push({ path: relPath, url: publicUrl });
    }

    // 8. Clean up orphans — assets that were in the previous bundle for this
    // pattern but aren't in the new one.
    const existing = await listAssetPaths(patternId).catch(() => [] as string[]);
    const newPaths = new Set(assetsByRelPath.keys());
    const orphans = existing.filter((p) => !newPaths.has(p));
    if (orphans.length > 0) {
      try {
        await deleteAssets(patternId, orphans);
      } catch (e) {
        console.error("Orphan cleanup failed (non-fatal):", e);
      }
    }

    // 9. Update the pattern's markdownContent in KV. Re-use the same shape
    // the direct-MD-upload endpoint produces.
    const today = todayDate();
    const updated = {
      ...patterns[matchIdx],
      markdownContent: mdText,
      markdownUpdatedAt: today,
      updatedAt: today,
    };
    const newPatterns = [...patterns];
    newPatterns[matchIdx] = updated;
    await kv.set(`${PREFIX}patterns`, newPatterns);

    return c.json({
      ok: true,
      pattern: updated,
      mdPath: mdEntry.path,
      assetsUploaded: uploaded.length,
      assets: uploaded,
      orphansRemoved: orphans,
    });
  } catch (err) {
    console.error("Error processing bundle upload:", err);
    return c.json({ error: `Bundle upload failed: ${(err as Error).message}` }, 500);
  }
});

// ──────────────────────────────────────────────
// Design-token artifact regeneration (shared)
// ──────────────────────────────────────────────
// Token KV slots whose change should trigger an automatic re-publish. Keeps the
// live Storage artifacts (bootstrap.css / breakpoints.js / tokens-*.md) in
// lock-step with the CMS — a Save is also a Publish, so there's no "uploaded
// the token JSON but forgot to Publish → stale CSS" gap. The manual
// POST /design-tokens/publish endpoint still works as a force-refresh.
const TOKEN_PUBLISH_KEYS = new Set([
  "colorTokens",
  "sizeTokens",
  "breakpointTokens",
  "fontTokens",
  "tokenDocs",
]);

type RegenResult =
  | { ok: true; urls: Record<string, string>; bytes: Record<string, number> }
  | { ok: false; reason: string };

// Regenerate bootstrap.css + breakpoints.js + the tokens-*.md mirror from the
// current KV token slots and upload them to the design-tokens Storage bucket.
// Byte-identical to the prebuild script for the same logical input. Shared by
// the explicit publish endpoint and the auto-publish-on-save hook. Returns
// `{ ok:false, reason }` (rather than throwing) when required slots are absent,
// so an auto-publish against a not-yet-seeded store is a quiet no-op.
async function regenerateDesignTokenArtifacts(): Promise<RegenResult> {
  await ensureDesignTokensBucket();

  // 1. Fetch every token slot from KV in parallel.
  const [colorTokens, sizeTokens, fontTokens, breakpointTokens, tokenDocs] = await Promise.all([
    kv.get(`${PREFIX}colorTokens`),
    kv.get(`${PREFIX}sizeTokens`),
    kv.get(`${PREFIX}fontTokens`),
    kv.get(`${PREFIX}breakpointTokens`),
    kv.get(`${PREFIX}tokenDocs`),
  ]);

  if (!colorTokens || !sizeTokens || !breakpointTokens) {
    return { ok: false, reason: "Missing token data in KV (color / size / breakpoint slots)" };
  }

  // 2. Flatten each client-normalized slot into the {cssVar, displayValue}
  //    shape the bootstrap.css template expects. Font slot is optional —
  //    if absent we publish bootstrap.css without the typography block.
  const globalColor = colorRowsToFlat(colorTokens.global);
  const lightTokens = colorRowsToFlat(colorTokens.semanticLight);
  const darkTokens  = colorRowsToFlat(colorTokens.semanticDark);

  const sizeGlobal          = sizeRowsToFlat(sizeTokens.global);
  const sizeWebMobile       = sizeRowsToFlat(sizeTokens.webMobile);
  const sizeWebTablet       = sizeRowsToFlat(sizeTokens.webTablet);
  const sizeWebDesktop      = sizeRowsToFlat(sizeTokens.webDesktop);
  const sizeWebDesktopLarge = sizeRowsToFlat(sizeTokens.webDesktopLarge);
  const sizeDeviceMobile    = sizeRowsToFlat(sizeTokens.deviceMobile);
  const sizeDeviceTablet    = sizeRowsToFlat(sizeTokens.deviceTablet);

  const breakpoints   = sizeRowsToFlat(breakpointTokens.tokens);
  const breakpointPx  = extractBreakpointPxFromRows(breakpointTokens.tokens);

  // Typography: prefer web-desktop slot, fall back to web-mobile if the
  // designer only uploaded one mode. Build script only emits desktop — we
  // mirror that here. Future: emit per-mode @media blocks too.
  const fontDesktop = fontRowsToFlat(
    fontTokens?.webDesktop?.length ? fontTokens.webDesktop : fontTokens?.webMobile ?? []
  );
  const fontDeviceMobile = fontRowsToFlat(fontTokens?.deviceMobile ?? []);
  const fontDeviceTablet = fontRowsToFlat(fontTokens?.deviceTablet ?? []);

  // 3. Build the diff blocks (only tokens that differ from the :root base).
  //    Web modes diff vs web-mobile; device modes diff vs web-mobile (size)
  //    and web-desktop (font) — those are the values currently emitted at
  //    :root for their respective collections.
  const sizeTabletDiff       = diffFromBase(sizeWebMobile, sizeWebTablet);
  const sizeDesktopDiff      = diffFromBase(sizeWebMobile, sizeWebDesktop);
  const sizeDesktopLargeDiff = diffFromBase(sizeWebMobile, sizeWebDesktopLarge);
  const sizeDeviceMobileDiff = diffFromBase(sizeWebMobile, sizeDeviceMobile);
  const sizeDeviceTabletDiff = diffFromBase(sizeWebMobile, sizeDeviceTablet);
  const fontDeviceMobileDiff = diffFromBase(fontDesktop, fontDeviceMobile, "value");
  const fontDeviceTabletDiff = diffFromBase(fontDesktop, fontDeviceTablet, "value");

  // 4. Render both artifacts via the shared template — byte-identical to
  //    the prebuild script for the same logical input.
  const bootstrapCss = buildBootstrapCss({
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
    sizeDeviceMobileDiff,
    sizeDeviceTabletDiff,
    fontDeviceMobileDiff,
    fontDeviceTabletDiff,
  });
  const breakpointsJs = buildBreakpointsJs(breakpointPx);

  // 5. Upload bootstrap.css + breakpoints.js to the design-tokens bucket.
  //    Also mirror the Markdown reference docs (color / size / typography)
  //    if the CMS has populated them — AI agents fetch these directly from
  //    Storage to bypass the React SPA. Missing slots are silently skipped
  //    (publish stays partially successful).
  const md: Record<string, string> = {
    "tokens-color.md": tokenDocs?.color || "",
    "tokens-size-space.md": tokenDocs?.size || "",
    "tokens-typography.md": tokenDocs?.typography || "",
  };

  const uploads: Promise<{ key: string; publicUrl: string; bytes: number } | null>[] = [
    uploadDesignTokenArtifact("bootstrap.css", bootstrapCss, "text/css; charset=utf-8")
      .then((r) => ({ key: "bootstrap", publicUrl: r.publicUrl, bytes: bootstrapCss.length })),
    uploadDesignTokenArtifact("breakpoints.js", breakpointsJs, "application/javascript; charset=utf-8")
      .then((r) => ({ key: "breakpoints", publicUrl: r.publicUrl, bytes: breakpointsJs.length })),
  ];
  for (const [filename, body] of Object.entries(md)) {
    if (!body) continue;
    const key = filename.replace(/\.md$/, "");
    uploads.push(
      uploadDesignTokenArtifact(filename, body, "text/markdown; charset=utf-8")
        .then((r) => ({ key, publicUrl: r.publicUrl, bytes: body.length })),
    );
  }
  const results = await Promise.all(uploads);

  const urls: Record<string, string> = {};
  const bytes: Record<string, number> = {};
  for (const r of results) {
    if (!r) continue;
    urls[r.key] = r.publicUrl;
    bytes[r.key] = r.bytes;
  }

  return { ok: true, urls, bytes };
}

// Best-effort auto-publish after a token KV write. NEVER throws — KV is the
// source of truth, so if regeneration fails the save still stands and a manual
// POST /design-tokens/publish can recover. Awaited (not fire-and-forget) so the
// edge runtime doesn't tear down before the Storage upload completes.
async function maybeAutoPublishTokens(changedKeys: string[]): Promise<void> {
  if (!changedKeys.some((k) => TOKEN_PUBLISH_KEYS.has(k))) return;
  try {
    const res = await regenerateDesignTokenArtifacts();
    if (!res.ok) console.warn("Auto-publish skipped after token save:", res.reason);
  } catch (err) {
    console.error("Auto-publish after token save failed (KV write still persisted):", err);
  }
}

// ──────────────────────────────────────────────
// POST /design-tokens/publish — Regenerate bootstrap.css + breakpoints.js
// from the current KV token slots and upload them to the design-tokens
// Storage bucket. Runs server-side so a stale browser can't ship outdated
// token values. Note: token saves now auto-publish (see maybeAutoPublishTokens),
// so this endpoint is mainly a manual force-refresh.
//
// Returns `{ urls: { bootstrap, breakpoints } }` on success.
// ──────────────────────────────────────────────
app.post("/make-server-067f252d/design-tokens/publish", async (c) => {
  try {
    const res = await regenerateDesignTokenArtifacts();
    if (!res.ok) {
      return c.json(
        { error: `${res.reason} — upload color / size / breakpoint slots before publishing.` },
        400,
      );
    }
    return c.json({
      ok: true,
      urls: res.urls,
      bytes: res.bytes,
      publishedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error publishing design tokens:", err);
    return c.json({ error: `Publish failed: ${(err as Error).message}` }, 500);
  }
});

Deno.serve(app.fetch);