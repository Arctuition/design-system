import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE = import.meta.env.DEV
  ? `http://127.0.0.1:54321/functions/v1/make-server-067f252d`
  : `https://${projectId}.supabase.co/functions/v1/make-server-067f252d`;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
});

// Helper to add timeout to fetch requests
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Result of attempting to load state from the server.
 *
 * - `ok`    : the server responded successfully and returned non-empty data.
 * - `empty` : the server responded successfully but has no data yet
 *             (genuine fresh-install signal — safe to seed defaults).
 * - `error` : the request failed (network down, non-OK HTTP, timeout, paused
 *             Supabase project, etc). The caller MUST NOT seed defaults in
 *             this case, because we don't actually know whether the server
 *             is empty — seeding would overwrite real data on next sync
 *             with new uid() rows once the server comes back.
 */
export type LoadStateResult =
  | { status: "ok"; data: Record<string, any> }
  | { status: "empty" }
  | { status: "error"; reason: string };

/** Load full app state from the server. */
export async function loadStateFromServer(): Promise<LoadStateResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE}/state`, { headers: headers() }, 8000);
  } catch (err) {
    return { status: "error", reason: `network: ${(err as Error)?.message ?? "unknown"}` };
  }
  if (!res.ok) {
    return { status: "error", reason: `http ${res.status}` };
  }
  let json: any;
  try {
    json = await res.json();
  } catch (err) {
    return { status: "error", reason: `parse: ${(err as Error)?.message ?? "unknown"}` };
  }
  const data = json?.data;
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return { status: "empty" };
  }
  return { status: "ok", data };
}

/** Save a single state key to the server */
export async function saveStateKey(key: string, value: any): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${BASE}/state/${key}`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ value }),
      },
      5000
    );
    return res.ok;
  } catch (err) {
    // Silently fail - localStorage is the primary storage
    return false;
  }
}

/** Bulk save all state keys to the server */
export async function bulkSaveState(state: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${BASE}/state`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify(state),
      },
      8000
    );
    return res.ok;
  } catch (err) {
    // Silently fail - localStorage is the primary storage
    return false;
  }
}

export type UploadPatternMarkdownResult =
  | { ok: true; pattern: Record<string, any> }
  | { ok: false; error: string };

/**
 * Upload markdown for an existing pattern via the dedicated edge-function
 * endpoint. Bypasses the bulk-state PUT path so only the targeted pattern is
 * touched on the server. The server stamps markdownUpdatedAt and persists
 * atomically; the returned `pattern` reflects what was written.
 */
export async function uploadPatternMarkdown(
  slug: string,
  markdown: string,
): Promise<UploadPatternMarkdownResult> {
  try {
    const res = await fetchWithTimeout(
      `${BASE}/patterns/${encodeURIComponent(slug)}`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ markdownContent: markdown }),
      },
      10000,
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}${body ? `: ${body}` : ""}` };
    }
    const json = await res.json().catch(() => null);
    if (!json || !json.ok || !json.pattern) {
      return { ok: false, error: "Malformed server response" };
    }
    return { ok: true, pattern: json.pattern };
  } catch (err) {
    return { ok: false, error: `network: ${(err as Error)?.message ?? "unknown"}` };
  }
}

export type UploadPatternBundleResult =
  | {
      ok: true;
      pattern: Record<string, any>;
      mdPath: string;
      assetsUploaded: number;
      assets: { path: string; url: string }[];
      orphansRemoved: string[];
    }
  | { ok: false; error: string; missing?: string[] };

/**
 * Upload a pattern bundle (zip with one .md + asset files) to the dedicated
 * edge-function endpoint. The server unpacks the zip, validates that every
 * relative `![](path)` in the MD has a matching file, uploads each asset to
 * Supabase Storage at `pattern-assets/<id>/<relative-path>`, stores the MD
 * in the patterns KV row, and cleans up assets from the previous bundle that
 * aren't in the new one.
 *
 * The MD is stored verbatim — relative image paths are NOT rewritten. The
 * frontend resolves them at render time via `MarkdownRenderer`'s
 * `assetBaseUrl` prop.
 */
export async function uploadPatternBundle(
  slug: string,
  zipBlob: Blob,
): Promise<UploadPatternBundleResult> {
  try {
    const form = new FormData();
    form.append("bundle", zipBlob, "bundle.zip");
    const res = await fetchWithTimeout(
      `${BASE}/patterns/${encodeURIComponent(slug)}/bundle`,
      {
        method: "POST",
        // Don't set Content-Type — the browser sets it (with the boundary)
        // when the body is FormData. Setting it explicitly breaks the upload.
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body: form,
      },
      30000, // bundles can be large; allow more headroom
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null) as
        | { error?: string; missing?: string[] }
        | null;
      return {
        ok: false,
        error: body?.error || `HTTP ${res.status}`,
        missing: body?.missing,
      };
    }
    const json = await res.json().catch(() => null);
    if (!json || !json.ok || !json.pattern) {
      return { ok: false, error: "Malformed server response" };
    }
    return {
      ok: true,
      pattern: json.pattern,
      mdPath: json.mdPath,
      assetsUploaded: json.assetsUploaded ?? 0,
      assets: Array.isArray(json.assets) ? json.assets : [],
      orphansRemoved: Array.isArray(json.orphansRemoved) ? json.orphansRemoved : [],
    };
  } catch (err) {
    return { ok: false, error: `network: ${(err as Error)?.message ?? "unknown"}` };
  }
}