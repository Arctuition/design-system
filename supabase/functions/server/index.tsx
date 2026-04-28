import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

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
    await kv.set(`${PREFIX}${key}`, body.value);
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
        keys.push(`${PREFIX}${k}`);
        values.push(body[k]);
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

Deno.serve(app.fetch);