/**
 * Re-export of the shared token-generation logic for browser consumers.
 *
 * The canonical implementation lives at
 * supabase/functions/_shared/token-generators.mjs so the edge function
 * (Deno), the Node prebuild script, AND the browser publish flow can all
 * import the exact same code. Co-locating with the edge function avoids
 * out-of-mount issues in the local Supabase Docker setup and the per-function
 * deploy bundling rules — `_shared/` is the standard Supabase convention.
 *
 * Do not add browser-only logic here. New shared helpers go into the
 * canonical .mjs module.
 */

// @ts-ignore — pure JS, no .d.ts (the project has no tsconfig and Vite strips
// TS without type-checking; runtime resolution is what matters).
export * from "../../../supabase/functions/_shared/token-generators.mjs";
