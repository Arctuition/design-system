/**
 * Generate `public/icons.json` from the Supabase KV store.
 *
 * Runs in `predev` and `prebuild` so the file is fresh on each dev start
 * and each production build. Fetches the live icon library, transforms it
 * into an AI-friendly manifest, and writes it to `public/icons.json`.
 *
 * On network failure (offline build, paused Supabase project) writes a
 * stub manifest with a `status: "error"` field — the build never fails
 * because of icons, and the file always exists at the expected URL.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Supabase config (read from the same file the React app uses) ──────────

const infoSrc = readFileSync(resolve(ROOT, "utils/supabase/info.tsx"), "utf-8");
const projectId    = infoSrc.match(/projectId\s*=\s*"([^"]+)"/)?.[1];
const publicAnonKey = infoSrc.match(/publicAnonKey\s*=\s*"([^"]+)"/)?.[1];

if (!projectId || !publicAnonKey) {
  console.error("[icons.json] could not parse Supabase config; aborting");
  process.exit(0);
}

// The edge function only exposes GET /state (full bundle). We extract `icons`
// from the response on our side.
const STATE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-067f252d/state`;

// ── Fetch + write ─────────────────────────────────────────────────────────

const outPath = resolve(ROOT, "public/icons.json");
mkdirSync(dirname(outPath), { recursive: true });

function writeStub(reason) {
  const stub = {
    status: "error",
    reason,
    generatedAt: new Date().toISOString(),
    note: "Run `npm run generate:icons` once Supabase is reachable to refresh this file.",
    icons: [],
  };
  writeFileSync(outPath, JSON.stringify(stub, null, 2), "utf-8");
  console.warn(`[icons.json] wrote stub (${reason}) — ${outPath}`);
}

const ac = new AbortController();
const timeout = setTimeout(() => ac.abort(), 10_000);

try {
  const res = await fetch(STATE_URL, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    signal: ac.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) {
    writeStub(`HTTP ${res.status} ${res.statusText}`);
    process.exit(0);
  }

  const body = await res.json();
  // Edge function shape: { data: { icons: [...], ... } }
  const rawIcons = Array.isArray(body?.data?.icons) ? body.data.icons : [];

  const icons = rawIcons.map((i) => ({
    name: i.name,
    fileName: i.fileName,
    tags: Array.isArray(i.tags) ? i.tags : [],
    svgContent: i.svgContent,
  }));

  const manifest = {
    status: "ok",
    generatedAt: new Date().toISOString(),
    count: icons.length,
    note:
      "AI agents: search by tag/name to pick an icon, then drop `svgContent` straight into your component.",
    icons,
  };

  writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(
    `[icons.json] wrote ${icons.length} icons (${(JSON.stringify(manifest).length / 1024).toFixed(1)} KB) — ${outPath}`
  );
} catch (err) {
  clearTimeout(timeout);
  writeStub(String(err?.message ?? err));
}
