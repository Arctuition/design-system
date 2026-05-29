/**
 * Safe ChangeLog sync — prod Supabase ← repo seed.
 *
 * Background — why this exists:
 *
 *   The /state/changeLogs endpoint has asymmetric request/response shapes:
 *     GET  /state/changeLogs  →  {"data":  [...]}
 *     PUT  /state/changeLogs  ←  {"value": [...]}
 *
 *   In May 2026 an agent (Claude) read prod with `d.get('value', [])`,
 *   saw an empty list, assumed prod was empty, and PUT only the new
 *   1.6.0 entry. That replaced 13 entries with 1, wiping prior history.
 *   This script makes that class of mistake impossible:
 *
 *     1. Reads `data` (correct key) and prints the count + top entries.
 *     2. Merges with seed; refuses any PUT whose merged length is less
 *        than what's currently on prod.
 *     3. Always prints a dry-run preview before applying.
 *
 * Usage:
 *
 *   node scripts/safe-changelog-sync.mjs            # dry-run — prints diff
 *   node scripts/safe-changelog-sync.mjs --apply    # PUT to prod
 *
 * When to run:
 *
 *   Whenever a PR adds an entry to `defaultChangeLogs` in
 *   src/app/store/data-store.tsx — run this after merging so prod
 *   picks up the new entry.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

// Pull project id + anon key — these are the public front-end values, fine
// to read at build time. Prefer the VITE_* env vars (set by AWS Amplify at
// deploy time, or by a local `.env`); otherwise fall back to the committed
// literals in info.tsx. The regex matches both the plain literal form
// (`projectId = "..."`) and the env-fallback form
// (`projectId = import.meta.env.X || "..."`).
const INFO_SRC = readFileSync(resolve(ROOT, "utils/supabase/info.tsx"), "utf-8");
const PROJECT_ID =
  process.env.VITE_SUPABASE_PROJECT_ID ||
  INFO_SRC.match(/projectId\s*=[^"]*"([^"]+)"/)?.[1];
const ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  INFO_SRC.match(/publicAnonKey\s*=[^"]*"([^"]+)"/)?.[1];
if (!PROJECT_ID || !ANON) {
  throw new Error("Could not read projectId / publicAnonKey from utils/supabase/info.tsx");
}
const BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-067f252d`;

// ── Read prod ─────────────────────────────────────────────────────────────
async function getProd() {
  const res = await fetch(`${BASE}/state/changeLogs`, {
    headers: { Authorization: `Bearer ${ANON}` },
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status} ${res.statusText}`);
  const body = await res.json();
  // ⚠️ Response shape: {"data": [...]} — NOT "value". Asymmetric with PUT.
  if (!("data" in body)) {
    throw new Error(`Unexpected GET response: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body.data ?? [];
}

// ── Parse seed from data-store.tsx ────────────────────────────────────────
function getSeed() {
  const src = readFileSync(resolve(ROOT, "src/app/store/data-store.tsx"), "utf-8");
  const m = src.match(/const defaultChangeLogs: ChangeLogEntry\[\] = (\[)/);
  if (!m) throw new Error("defaultChangeLogs declaration not found");
  const start = m.index + m[0].length - 1;
  const after = src.slice(start);
  const endRel = after.search(/^\];$/m);
  if (endRel === -1) throw new Error("end of defaultChangeLogs not found");
  const arrayLiteral = after.slice(0, endRel + 1);

  // The seed uses uid() to generate IDs. Stub it for the eval below.
  function uid() {
    return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  }
  return new Function("uid", `return ${arrayLiteral}`)(uid);
}

// ── Merge ─────────────────────────────────────────────────────────────────
function merge(prod, seed) {
  // Match by `version`. Keep prod's ID for entries that already exist
  // (so the public list doesn't get re-keyed in React); add new seed
  // entries; keep prod-only entries (e.g. one-off prod hotfixes that
  // never went through the seed).
  const prodByVersion = new Map(prod.map((e) => [e.version, e]));
  const newFromSeed = seed.filter((e) => !prodByVersion.has(e.version));
  const updatedFromSeed = seed
    .filter((e) => prodByVersion.has(e.version))
    .map((s) => ({ ...s, id: prodByVersion.get(s.version).id }));
  const seedVersions = new Set(seed.map((e) => e.version));
  const prodOnly = prod.filter((e) => !seedVersions.has(e.version));

  const all = [...newFromSeed, ...updatedFromSeed, ...prodOnly];
  all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return all;
}

// ── Main ─────────────────────────────────────────────────────────────────
const [prod, seed] = await Promise.all([getProd(), Promise.resolve(getSeed())]);
console.log(`Prod: ${prod.length} entries.  Seed: ${seed.length} entries.`);

const merged = merge(prod, seed);
console.log(`Merged: ${merged.length} entries.\n`);

// Safety check — refuse to shrink the prod list.
if (merged.length < prod.length) {
  console.error(
    `❌ Refusing to PUT: merged (${merged.length}) < prod (${prod.length}). ` +
    `This would delete entries from prod. Inspect manually.`
  );
  process.exit(1);
}

console.log("Preview (top 5):");
for (const e of merged.slice(0, 5)) {
  console.log(`  ${e.version}  ${e.date}  ${(e.title ?? "").slice(0, 60)}`);
}
if (merged.length > prod.length) {
  const added = merged
    .slice(0, merged.length - prod.length)
    .map((e) => e.version);
  console.log(`\n➕ Will add: ${added.join(", ")}`);
}

if (!APPLY) {
  console.log("\n(Dry-run. Re-run with --apply to PUT.)");
  process.exit(0);
}

// PUT — body uses "value", NOT "data" (asymmetric with GET above).
const res = await fetch(`${BASE}/state/changeLogs`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ value: merged }),
});
const body = await res.json();
if (!res.ok || !body.ok) {
  console.error(`❌ PUT failed: ${res.status}`, body);
  process.exit(1);
}
console.log(`\n✅ Synced. ${merged.length} entries now on prod.`);
