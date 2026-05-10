/**
 * Write each icon's `svgContent` out to `public/icons/<fileName>` so AI
 * agents (and the rest of the web) can fetch a single icon as a 700-byte
 * file instead of pulling the full 530 KB `icons.json` to look up one
 * field.
 *
 * Reads from `public/icons.json` (produced by `generate-icons-json.mjs`)
 * — that file already has the canonical icon list and the SVG bytes, so
 * this script just unpacks them onto disk.
 *
 * Behaviour notes:
 * - No dedup. If two icons share a fileName (a data hygiene issue that
 *   should be fixed at the upload path, not here), last write wins.
 *   The script logs a warning so the collision is visible.
 * - URL-unsafe characters in fileName (e.g. `&`) are replaced with `-`
 *   on disk. The manifest entry's `fileName` is rewritten to match so
 *   agents composing `/icons/${fileName}` always hit a real file.
 *
 * Runs in `predev` and `prebuild` so the directory tracks the manifest.
 */

import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ICONS_JSON = resolve(ROOT, "public/icons.json");
const INDEX_JSON = resolve(ROOT, "public/icons.index.json");
const OUT_DIR    = resolve(ROOT, "public/icons");

// Replace anything outside [a-zA-Z0-9._-] with "-" and collapse runs of "-"
// down to one. Keeps the `.svg` extension intact.
function sanitizeFileName(name) {
  if (!name) return name;
  const replaced = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return replaced.replace(/-+/g, "-");
}

const manifest = JSON.parse(readFileSync(ICONS_JSON, "utf-8"));

if (manifest.status !== "ok" || !Array.isArray(manifest.icons)) {
  console.warn(`[icon-files] icons.json status="${manifest.status}" — skipping export`);
  process.exit(0);
}

// Wipe the output dir so removed icons don't linger as stale files.
if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
let renamed = 0;
const seenFileNames = new Map();
const renames = []; // { original, sanitized }
const collisions = [];

for (const icon of manifest.icons) {
  if (!icon.fileName || !icon.svgContent) continue;
  const original = icon.fileName;
  const sanitized = sanitizeFileName(original);
  if (sanitized !== original) {
    renames.push({ original, sanitized });
    icon.fileName = sanitized;
    renamed++;
  }

  if (seenFileNames.has(sanitized)) {
    collisions.push({
      fileName: sanitized,
      previousIcon: seenFileNames.get(sanitized),
      thisIcon: icon.name,
    });
  }
  seenFileNames.set(sanitized, icon.name);

  writeFileSync(resolve(OUT_DIR, sanitized), icon.svgContent, "utf-8");
  written++;
}

// Re-emit the manifests with any sanitized fileNames so agents fetching
// `/icons/${entry.fileName}` always hit a real file. The slim index has
// the same entries with `svgContent` stripped, so we mirror the rename.
writeFileSync(ICONS_JSON, JSON.stringify(manifest, null, 2), "utf-8");

if (existsSync(INDEX_JSON)) {
  const index = JSON.parse(readFileSync(INDEX_JSON, "utf-8"));
  if (Array.isArray(index.icons)) {
    const renameMap = new Map(renames.map((r) => [r.original, r.sanitized]));
    for (const entry of index.icons) {
      if (renameMap.has(entry.fileName)) {
        entry.fileName = renameMap.get(entry.fileName);
      }
    }
    writeFileSync(INDEX_JSON, JSON.stringify(index, null, 2), "utf-8");
  }
}

console.log(`[icon-files] wrote ${written} svg files to ${OUT_DIR}`);
if (renamed) {
  console.log(`[icon-files] sanitized ${renamed} fileName(s) for URL safety:`);
  renames.slice(0, 5).forEach((r) => console.log(`  ${r.original} → ${r.sanitized}`));
  if (renames.length > 5) console.log(`  …and ${renames.length - 5} more`);
}
if (collisions.length) {
  console.warn(`[icon-files] ⚠️  ${collisions.length} fileName collision(s) (last write wins):`);
  collisions.forEach((c) =>
    console.warn(`  ${c.fileName}: "${c.previousIcon}" overwritten by "${c.thisIcon}"`)
  );
  console.warn(`  ↳ fix at the upload path; this script does not dedupe.`);
}
