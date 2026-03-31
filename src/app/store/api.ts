import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-067f252d`;

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

/** Load full app state from the server */
export async function loadStateFromServer(): Promise<Record<string, any> | null> {
  try {
    const res = await fetchWithTimeout(`${BASE}/state`, { headers: headers() }, 8000);
    if (!res.ok) {
      return null;
    }
    const json = await res.json();
    return json.data ?? null;
  } catch (err) {
    // Silently fail and use localStorage fallback
    return null;
  }
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