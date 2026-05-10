import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";

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

// All state keys stored in KV. MUST stay in sync with the keys the client
// reads/writes in src/app/store/data-store.tsx — any key missing here causes
// PUT /state/:key to return HTTP 400, which the client silently swallowed
// before this fix.
const STATE_KEYS = [
  "homeArticle",
  "changeLogs",
  "typographyArticle",
  "colorTokens",
  "sizeTokens",
  "colorArticle",
  "sizeArticle",
  "iconologyArticle",
  "icons",
  "patterns",
  "editors",
  "articleVersions",
];

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

    const newContent = typeof p.content === "string" ? p.content : "";
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
// GET /state — Load entire app state from KV
// ──────────────────────────────────────────────
app.get("/make-server-067f252d/state", async (c) => {
  try {
    const state: Record<string, any> = {};
    // Fetch each key individually to guarantee correct key-value mapping
    const results = await Promise.allSettled(
      STATE_KEYS.map(async (key) => {
        const value = await kv.get(`${PREFIX}${key}`);
        return { key, value };
      })
    );
    
    // Process results even if some failed
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
    }
    await kv.set(`${PREFIX}${key}`, value);
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
        }
        keys.push(`${PREFIX}${k}`);
        values.push(value);
      }
    }
    if (keys.length > 0) {
      await kv.mset(keys, values);
    }
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

Deno.serve(app.fetch);