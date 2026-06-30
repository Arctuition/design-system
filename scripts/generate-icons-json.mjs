/**
 * Generate `public/icons.json` and `public/icons.index.json` from the
 * Supabase KV store.
 *
 * Two outputs:
 * - `icons.json`        — full manifest, includes inline `svgContent`. Used
 *                         when an agent already knows which icon it wants
 *                         and needs the SVG to drop into a component.
 * - `icons.index.json`  — slim search manifest, no `svgContent`. ~7× smaller.
 *                         Used by agents during the "pick an icon" phase so
 *                         hundreds of KB of SVG bytes don't pollute context.
 *
 * Runs in `predev` and `prebuild` so both files are fresh on each dev start
 * and each production build.
 *
 * On network failure (offline build, paused Supabase project) writes stub
 * manifests with a `status: "error"` field — the build never fails because
 * of icons, and the files always exist at the expected URLs.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Same builder the edge function serves live (decision #13), so the static
// public/icons*.json this script writes is byte-identical to GET /icons*.json
// for the same KV input. Don't reimplement the manifest shape here.
import { buildIconManifests } from "../supabase/functions/_shared/icon-manifest.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Supabase config (read from the same file the React app uses) ──────────

// Prefer the VITE_* env vars (set by AWS Amplify at deploy time, or by a
// local `.env`); otherwise fall back to the committed literals in info.tsx.
// The regex matches both the plain literal form (`projectId = "..."`) and
// the env-fallback form (`projectId = import.meta.env.X || "..."`).
const infoSrc = readFileSync(resolve(ROOT, "utils/supabase/info.tsx"), "utf-8");
const projectId    = process.env.VITE_SUPABASE_PROJECT_ID || infoSrc.match(/projectId\s*=[^"]*"([^"]+)"/)?.[1];
const publicAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || infoSrc.match(/publicAnonKey\s*=[^"]*"([^"]+)"/)?.[1];

if (!projectId || !publicAnonKey) {
  console.error("[icons.json] could not parse Supabase config; aborting");
  process.exit(0);
}

// The edge function only exposes GET /state (full bundle). We extract `icons`
// from the response on our side.
const STATE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-067f252d/state`;

// ── Fetch + write ─────────────────────────────────────────────────────────

const outPath = resolve(ROOT, "public/icons.json");
const indexPath = resolve(ROOT, "public/icons.index.json");
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
  writeFileSync(indexPath, JSON.stringify(stub, null, 2), "utf-8");
  console.warn(`[icons.json] wrote stubs (${reason}) — ${outPath}, ${indexPath}`);
}

// 45s — the /state endpoint can take 10–15s to serve the full ~14 MB
// payload, and we'd rather wait than write a stub manifest that wipes
// the public icons until the next build.
const ac = new AbortController();
const timeout = setTimeout(() => ac.abort(), 45_000);

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

  const { full: manifest, index: indexManifest } = buildIconManifests(rawIcons, {
    generatedAt: new Date().toISOString(),
  });

  writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf-8");
  writeFileSync(indexPath, JSON.stringify(indexManifest, null, 2), "utf-8");
  const fullKb = (JSON.stringify(manifest).length / 1024).toFixed(1);
  const indexKb = (JSON.stringify(indexManifest).length / 1024).toFixed(1);
  console.log(
    `[icons.json] wrote ${manifest.count} icons — full ${fullKb} KB (${outPath}), index ${indexKb} KB (${indexPath})`
  );
} catch (err) {
  clearTimeout(timeout);
  writeStub(String(err?.message ?? err));
}
