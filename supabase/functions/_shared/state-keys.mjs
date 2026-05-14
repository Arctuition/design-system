/**
 * Single source of truth for the set of KV state keys persisted across
 * client + edge-function boundary. Imported by:
 *
 *   - supabase/functions/make-server-067f252d/index.ts (validates PUTs)
 *   - src/app/store/data-store.tsx (validates outbound syncs)
 *
 * Why this exists: prior to its introduction, a new state slot
 * (`tokenStatus`) was added on the client but never registered on the
 * server allowlist. Every PUT returned HTTP 400 and the client silently
 * swallowed the failure. The badges that depended on it appeared to
 * work in a single tab session (localStorage held the state) but were
 * lost on every reload — a confusing bug that took several iterations
 * to track down.
 *
 * If you add a new state key:
 *   1. Add it to STATE_KEYS below.
 *   2. Use it on the client via `assertValidStateKey` before any
 *      `pendingSyncRef.current.add(key)` call.
 *   3. CI's bootstrap-parity workflow does NOT catch this — there is
 *      currently no end-to-end test for state-key round-trip. The
 *      `assertValidStateKey` helper is the runtime guard.
 */

export const STATE_KEYS = [
  "homeArticle",
  "changeLogs",
  "colorTokens",
  "sizeTokens",
  "breakpointTokens",
  "fontTokens",
  "tokenDocs",
  "tokenStatus",
  "iconologyArticle",
  "icons",
  "patterns",
  "editors",
  "articleVersions",
];

const STATE_KEYS_SET = new Set(STATE_KEYS);

export function isValidStateKey(key) {
  return STATE_KEYS_SET.has(key);
}

/**
 * Throw a clear error if `key` is not in the allowlist. Use this on the
 * client right before queuing a sync — that turns the silent-400 bug
 * into a loud client-side error during development, with a precise
 * pointer to the fix (add the key to STATE_KEYS).
 */
export function assertValidStateKey(key) {
  if (!STATE_KEYS_SET.has(key)) {
    throw new Error(
      `Invalid state key "${key}". ` +
      `Add it to supabase/functions/_shared/state-keys.mjs STATE_KEYS first. ` +
      `Known keys: ${STATE_KEYS.join(", ")}.`
    );
  }
}
