// Supabase Storage helpers for pattern assets. The edge function has
// service-role access via SUPABASE_SERVICE_ROLE_KEY, so it can create the
// bucket on first use and manage objects without RLS gymnastics.
//
// Bucket layout (one bucket, partitioned by pattern id):
//
//   pattern-assets/                          ← bucket name
//     ├─ <patternId>/
//     │   ├─ <bundle-file-1>                 ← original relative path from zip
//     │   ├─ images/<bundle-file-2>
//     │   └─ ...
//     └─ <otherPatternId>/...
//
// The bucket is publicly readable so the React app and external Agents can
// fetch assets directly via the canonical Storage URL without going through
// the edge function on the read path.

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const BUCKET = "pattern-assets";

const client = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

/**
 * Idempotent bucket creation. Called at the start of any write endpoint.
 * Ensures the bucket exists and is configured public-read so first-deploy
 * doesn't require an out-of-band Supabase dashboard click.
 */
let bucketEnsured = false;
export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return;
  const supabase = client();
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(`listBuckets failed: ${listErr.message}`);
  if (buckets?.some((b) => b.name === BUCKET)) {
    bucketEnsured = true;
    return;
  }
  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createErr && !/already exists/i.test(createErr.message)) {
    throw new Error(`createBucket failed: ${createErr.message}`);
  }
  bucketEnsured = true;
}

/**
 * Upload a single asset (from a bundle) to the pattern's namespace.
 * `relativePath` is the path inside the zip (e.g. "images/foo.png").
 * Existing assets at the same path are overwritten.
 */
export async function uploadAsset(
  patternId: string,
  relativePath: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = client();
  const objectPath = `${patternId}/${relativePath}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, bytes, {
      contentType,
      upsert: true,
    });
  if (error) throw new Error(`uploadAsset(${objectPath}): ${error.message}`);
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return { publicUrl: pub.publicUrl };
}

/**
 * List every asset path stored under a pattern. Returns the relative paths
 * (without the patternId prefix) so callers can diff against an incoming
 * bundle to find orphans to delete.
 */
export async function listAssetPaths(patternId: string): Promise<string[]> {
  const supabase = client();
  const out: string[] = [];

  // Storage's `list()` is one level only; recurse to walk subdirectories
  // (images/, figures/, etc.).
  async function walk(prefix: string): Promise<void> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 1000 });
    if (error) throw new Error(`list(${prefix}): ${error.message}`);
    for (const entry of data ?? []) {
      const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Storage returns folders as entries with id === null and no metadata.
      const isFolder = entry.id === null;
      if (isFolder) {
        await walk(childPath);
      } else {
        // Strip the patternId prefix so callers see relative paths.
        const stripped = childPath.startsWith(`${patternId}/`)
          ? childPath.slice(patternId.length + 1)
          : childPath;
        out.push(stripped);
      }
    }
  }

  await walk(patternId);
  return out;
}

/**
 * Delete the listed assets (relative paths) for a pattern. Used to clean up
 * orphans on bundle re-upload — files that were in the previous bundle but
 * not in the new one.
 */
export async function deleteAssets(
  patternId: string,
  relativePaths: string[],
): Promise<void> {
  if (relativePaths.length === 0) return;
  const supabase = client();
  const objectPaths = relativePaths.map((p) => `${patternId}/${p}`);
  const { error } = await supabase.storage.from(BUCKET).remove(objectPaths);
  if (error) throw new Error(`deleteAssets: ${error.message}`);
}

/**
 * Build a Storage public URL for a given pattern asset. Used by callers that
 * need to surface URLs in API responses (e.g. for client confirmations).
 */
export function publicUrlFor(patternId: string, relativePath: string): string {
  const supabase = client();
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${patternId}/${relativePath}`);
  return data.publicUrl;
}

export const ASSET_BUCKET = BUCKET;

/**
 * Best-effort content-type guess from a filename. The edge function gets
 * the original filename from the zip entry; browsers don't tell us a MIME
 * type for zip-internal files. Wrong guesses just get re-served with the
 * wrong header — not a security issue since the bucket is read-only public.
 */
export function guessContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "svg": return "image/svg+xml";
    case "avif": return "image/avif";
    case "ico": return "image/x-icon";
    case "md": return "text/markdown; charset=utf-8";
    case "txt": return "text/plain; charset=utf-8";
    case "pdf": return "application/pdf";
    case "json": return "application/json";
    default: return "application/octet-stream";
  }
}
