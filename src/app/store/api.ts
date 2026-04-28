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