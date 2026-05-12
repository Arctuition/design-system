// Supabase Storage helpers for the design-tokens bucket — the publish target
// for CMS token uploads (Option B). Distinct from pattern-assets because:
//   * different bucket name (separate visibility / lifecycle policy)
//   * flat object layout, no per-pattern partitioning
//   * versioning is intentional (designers may pin to a published date)
//   * short cache TTL on objects so publishes propagate to consumers within ~1m
//
// Mirrors the public API of storage.ts (ensureBucket / uploadAtPath /
// publicUrlFor) but parameterized for this bucket. Keeping them as a separate
// module instead of generalizing storage.ts avoids touching the existing
// pattern-assets code path on the way through.

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const BUCKET = "design-tokens";

const client = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

/**
 * Idempotent bucket creation. Called from /design-tokens/publish so the
 * first publish after a fresh Supabase project provisions the bucket without
 * an out-of-band dashboard click. Bucket is public-read; writes require the
 * service-role key (which only the edge function has).
 */
let bucketEnsured = false;
export async function ensureDesignTokensBucket(): Promise<void> {
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
 * Upload a text artifact to the design-tokens bucket. Returns the public URL.
 * `cacheControl: "60"` keeps fresh-publish latency under a minute for
 * consumers that don't aggressively cache — the canonical bootstrap.css URL
 * is hit on every prototype page load, so a 1-min staleness ceiling matters.
 */
export async function uploadDesignTokenArtifact(
  filename: string,
  body: string | Uint8Array,
  contentType: string,
): Promise<{ publicUrl: string }> {
  const supabase = client();
  const { error } = await supabase.storage.from(BUCKET).upload(filename, body, {
    contentType,
    upsert: true,
    cacheControl: "60",
  });
  if (error) throw new Error(`uploadDesignTokenArtifact(${filename}): ${error.message}`);
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { publicUrl: pub.publicUrl };
}

export const DESIGN_TOKENS_BUCKET = BUCKET;
