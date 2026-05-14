/**
 * Thin re-export of the server-side STATE_KEYS module so the client can
 * import it without crossing the `/supabase/` path in src/. The actual
 * source of truth lives at
 *   supabase/functions/_shared/state-keys.mjs
 * and is imported by both the edge function (Deno) and the SPA (Vite).
 * Mirrors the pattern used by lib/token-generators.ts.
 */
// @ts-ignore — pure JS, no .d.ts; runtime resolution is what matters.
export * from "../../../supabase/functions/_shared/state-keys.mjs";
