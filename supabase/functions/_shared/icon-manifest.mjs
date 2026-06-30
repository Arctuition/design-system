/**
 * Shared icon-manifest builder — the single source of truth for turning the
 * raw `icons` KV slot into the two consumption-ready manifests.
 *
 * Imported by BOTH runtime boundaries so the live edge output and the
 * build-time static files are byte-for-byte the same for the same KV input
 * (the same parity contract `_shared/token-generators.mjs` gives the token
 * pipeline):
 *
 *   - supabase/functions/make-server-067f252d/index.ts
 *       GET /icons.json, /icons.index.json, /icons/:fileName  (LIVE from KV)
 *   - scripts/generate-icons-json.mjs   → public/icons.json + icons.index.json
 *   - scripts/generate-icon-files.mjs   → public/icons/<fileName>  (sanitizer)
 *
 * `.mjs` (not `.ts`) so Deno (edge) and Node (build scripts) both import it
 * with no transpile step — same reason token-generators is `.mjs`.
 */

// Icon names embed the size as `{height}x{width}` (e.g. `chevron right 16x10`
// = 16px tall, 10px wide). Two icons may share a height bucket but differ in
// width — height is the authoritative grouping dimension. We surface both
// numbers so agents can filter cleanly.
const SIZE_RE = /\b(\d+)x(\d+)\b/;

export function parseIconSize(name) {
  const m = SIZE_RE.exec(name || "");
  if (!m) return { size: null, height: null, width: null };
  return { size: `${m[1]}x${m[2]}`, height: Number(m[1]), width: Number(m[2]) };
}

// Replace anything outside [a-zA-Z0-9._-] with "-" and collapse runs of "-".
// Keeps the `.svg`/extension intact. Applied here (not just in the file-export
// script) so the `fileName` an agent reads from the index always round-trips
// to the live `/icons/{fileName}` route and the on-disk static file alike.
export function sanitizeIconFileName(name) {
  if (!name) return name;
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

const SIZE_FORMAT_NOTE =
  'Icon `size` is encoded as `{height}x{width}` (e.g. "16x10" = 16px tall, 10px wide). Height is the canonical grouping dimension — icons in the same height bucket may have varying widths.';

const FULL_NOTE =
  "AI agents: search the slim index (icons.index.json) to pick an icon, then either read `svgContent` from this manifest or fetch the per-icon file at icons/{fileName}.";

const INDEX_NOTE =
  "Slim search index — no SVG bytes. After picking by name/tag/size, fetch the per-icon SVG at icons/{fileName} (preferred, ~700 B) or read `svgContent` from the full icons.json.";

/**
 * Build the full + slim manifests from the raw KV icons array.
 *
 * @param {Array} rawIcons   value of the `icons` KV slot (array of
 *                           { name, fileName, tags, svgContent, ... })
 * @param {{ generatedAt?: string }} [opts]  ISO timestamp to stamp; the edge
 *                           route passes request time, the build script passes
 *                           build time. Defaults to now.
 * @returns {{ full: object, index: object }}
 *   - full  — `{ status, generatedAt, count, note, sizeFormat, icons }`
 *             with inline `svgContent`.
 *   - index — same shape, `svgContent` stripped from each entry.
 */
export function buildIconManifests(rawIcons, opts = {}) {
  const list = Array.isArray(rawIcons) ? rawIcons : [];
  const icons = list.map((i) => {
    const { size, height, width } = parseIconSize(i.name);
    return {
      name: i.name,
      fileName: sanitizeIconFileName(i.fileName),
      tags: Array.isArray(i.tags) ? i.tags : [],
      size,
      height,
      width,
      svgContent: i.svgContent,
    };
  });

  const generatedAt = opts.generatedAt || new Date().toISOString();

  const full = {
    status: "ok",
    generatedAt,
    count: icons.length,
    note: FULL_NOTE,
    sizeFormat: SIZE_FORMAT_NOTE,
    icons,
  };

  // Drop `svgContent` so agents can scan the whole library without pulling
  // hundreds of KB of inline SVG into context.
  const indexIcons = icons.map(({ svgContent: _omit, ...rest }) => rest);
  const index = {
    status: "ok",
    generatedAt,
    count: indexIcons.length,
    note: INDEX_NOTE,
    sizeFormat: SIZE_FORMAT_NOTE,
    icons: indexIcons,
  };

  return { full, index };
}
