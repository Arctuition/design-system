/**
 * One-time storage migration: OLD Supabase project → NEW Supabase project.
 *
 * Context: the backend was migrated from project `qcqtnrrprgqlckzywnkt` (OLD)
 * to `dnfzdqyiepjzqrigpvzw` (NEW). KV state was copied and the image URLs
 * embedded in pattern content were rewritten to the NEW host — but the
 * Storage *objects* (pattern images, published token artifacts) were never
 * copied, so the NEW project's `pattern-assets` bucket doesn't exist and every
 * pattern image 404s ("Bucket not found"). This script copies them.
 *
 * Design: the OLD project still serves its public objects over HTTP with no
 * auth, so we only need WRITE access to the NEW project. Provide the NEW
 * project's **service-role key** (Storage write requires it; the publishable
 * key can't create buckets or upload). It is read from env, never committed:
 *
 *   NEW_SERVICE_KEY=<new project service_role key> \
 *     node scripts/migrate-storage-buckets.mjs --apply
 *
 * Without --apply it's a DRY RUN: it lists what it would copy and probes the
 * OLD source, but writes nothing.
 *
 * What it copies:
 *   1. pattern-assets/*  — every object referenced by the NEW project's KV
 *      pattern content (the images that are currently broken). This is the
 *      required fix.
 *   2. design-tokens/*   — the published token artifacts (bootstrap.css,
 *      breakpoints.js, tokens-*.md). Secondary: AI agents now read these as
 *      static files on design-system.arcsite.com (egress fix / decision #7),
 *      and the CMS Publish flow re-creates this bucket via
 *      ensureDesignTokensBucket(). Copied only so the NEW project's "currently
 *      published" Storage state matches OLD until the next CMS publish.
 *
 * Idempotent: uploads use x-upsert, so re-running is safe.
 *
 * NOTE: this enumerates only objects *referenced by current KV* (for
 * pattern-assets) plus a fixed design-tokens file list. Orphaned objects (old
 * pattern versions, deleted-pattern leftovers) are NOT copied — they're not
 * referenced anywhere, so they can't display. For a byte-for-byte full bucket
 * mirror instead, use rclone against both projects' S3-compatible endpoints
 * (see the PR / handoff notes).
 */

const OLD_PROJECT = process.env.OLD_PROJECT_ID || "qcqtnrrprgqlckzywnkt";
const NEW_PROJECT = process.env.NEW_PROJECT_ID || "dnfzdqyiepjzqrigpvzw";
const NEW_SERVICE_KEY = process.env.NEW_SERVICE_KEY || "";
const NEW_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_AbBNYAJCE4TWCWux_7WYkA_sSM9CMvY";
const APPLY = process.argv.includes("--apply");

const OLD_BASE = `https://${OLD_PROJECT}.supabase.co`;
const NEW_BASE = `https://${NEW_PROJECT}.supabase.co`;
const NEW_FN = `${NEW_BASE}/functions/v1/make-server-067f252d`;

// Fixed design-tokens artifacts (not discoverable from KV content).
const DESIGN_TOKEN_FILES = [
  "bootstrap.css",
  "breakpoints.js",
  "tokens-color.md",
  "tokens-size-space.md",
  "tokens-typography.md",
];

const MIME = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  webp: "image/webp", svg: "image/svg+xml", css: "text/css",
  js: "application/javascript", md: "text/markdown",
};
const mimeFor = (p) => MIME[p.split(".").pop().toLowerCase()] || "application/octet-stream";

function die(msg) { console.error(`\n❌ ${msg}`); process.exit(1); }

/** Pull current KV state from the NEW project and extract every distinct
 *  storage object path, grouped by bucket. */
async function discoverReferencedObjects() {
  const res = await fetch(`${NEW_FN}/state`, {
    headers: { Authorization: `Bearer ${NEW_PUBLISHABLE_KEY}`, apikey: NEW_PUBLISHABLE_KEY },
  });
  if (!res.ok) die(`GET ${NEW_FN}/state → HTTP ${res.status}. Can't read NEW project KV.`);
  const json = await res.json();
  const blob = JSON.stringify(json);
  // Match .../storage/v1/object/public/<bucket>/<path> for either host.
  const re = /storage\/v1\/object\/public\/([a-z0-9-]+)\/([^"'\\ )]+)/gi;
  const byBucket = {};
  let m;
  while ((m = re.exec(blob))) {
    const [, bucket, path] = m;
    (byBucket[bucket] ??= new Set()).add(decodeURIComponent(path.replace(/\\\//g, "/")));
  }
  return byBucket;
}

async function ensureBucket(bucket) {
  // Idempotent: try create; treat "already exists" as success.
  const res = await fetch(`${NEW_BASE}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NEW_SERVICE_KEY}`, apikey: NEW_SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: bucket, name: bucket, public: true }),
  });
  if (res.ok) { console.log(`  bucket "${bucket}" created`); return; }
  const body = await res.text();
  if (res.status === 409 || /already exists|Duplicate/i.test(body)) {
    console.log(`  bucket "${bucket}" already exists`);
  } else {
    die(`create bucket "${bucket}" → HTTP ${res.status}: ${body}`);
  }
}

async function copyOne(bucket, path) {
  const oldUrl = `${OLD_BASE}/storage/v1/object/public/${bucket}/${path}`;
  const src = await fetch(oldUrl);
  if (!src.ok) return { path, status: `SRC ${src.status}`, ok: false };
  const bytes = Buffer.from(await src.arrayBuffer());
  if (!APPLY) return { path, status: `dry-run (src ${bytes.length}b)`, ok: true };
  const up = await fetch(`${NEW_BASE}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NEW_SERVICE_KEY}`, apikey: NEW_SERVICE_KEY,
      "Content-Type": mimeFor(path), "x-upsert": "true",
    },
    body: bytes,
  });
  return { path, status: up.ok ? `copied ${bytes.length}b` : `DST ${up.status}: ${(await up.text()).slice(0, 120)}`, ok: up.ok };
}

async function main() {
  console.log(`Storage migration  ${OLD_PROJECT} → ${NEW_PROJECT}  [${APPLY ? "APPLY" : "DRY RUN"}]`);
  if (APPLY && !NEW_SERVICE_KEY) die("NEW_SERVICE_KEY env var is required for --apply (new project service-role key).");

  const refs = await discoverReferencedObjects();
  const patternPaths = [...(refs["pattern-assets"] ?? [])].sort();
  console.log(`\npattern-assets: ${patternPaths.length} referenced objects`);
  console.log(`design-tokens:  ${DESIGN_TOKEN_FILES.length} fixed artifacts`);

  if (APPLY) {
    console.log("\nensuring buckets…");
    await ensureBucket("pattern-assets");
    await ensureBucket("design-tokens");
  }

  const jobs = [
    ...patternPaths.map((p) => ["pattern-assets", p]),
    ...DESIGN_TOKEN_FILES.map((p) => ["design-tokens", p]),
  ];

  let ok = 0, bad = 0;
  console.log(`\ncopying ${jobs.length} objects…`);
  for (const [bucket, path] of jobs) {
    const r = await copyOne(bucket, path);
    if (r.ok) ok++; else { bad++; console.log(`  ⚠️ ${bucket}/${path} → ${r.status}`); }
  }
  console.log(`\nDone. ok=${ok}  failed=${bad}  (${APPLY ? "applied" : "dry run — re-run with --apply + NEW_SERVICE_KEY"})`);
  if (bad) process.exit(1);
}

main().catch((e) => die(e.stack || e.message));
