# Key Technical Decisions

## 1. Icon deduplication strategy
**Decision:** Match by `fileName` field; call `updateIcon(id, { svgContent })` for duplicates instead of `addIcon()`

**Why:** `updateIcon` with only `svgContent` leaves `tags`, `name`, and other fields untouched. This was the explicit requirement: renew the SVG, keep original tags. Passing the full icon object would overwrite tags.

**Where:** `src/app/pages/cms/IconEditor.tsx` — `handleSingleUpload` and `handleBulkUpload`

---

## 2. Local vs production API routing
**Decision:** `src/app/store/api.ts` uses `import.meta.env.DEV` to switch the BASE URL

```typescript
const BASE = import.meta.env.DEV
  ? `http://127.0.0.1:54321/functions/v1/make-server-067f252d`
  : `https://${projectId}.supabase.co/functions/v1/make-server-067f252d`;
```

**Why:** Vite sets `import.meta.env.DEV = true` automatically during `npm run dev`. No `.env` files needed, no risk of accidentally toggling to production, zero config for teammates.

**Implication:** The local Supabase stack must be running whenever you use the app in dev mode. The app gracefully falls back to `localStorage` if the backend is unreachable (warning in console: `⚠️ Server has no data, using localStorage`).

---

## 3. Edge function URL naming: `make-server-067f252d` not `server`
**Decision:** Register the local edge function under the name `make-server-067f252d` in `SUPABASE_INTERNAL_FUNCTIONS_CONFIG`, not as `server` (the folder name)

**Why:** The Hono routes inside `supabase/functions/server/index.tsx` are defined as:
```typescript
app.get('/make-server-067f252d/state', ...)
```
In **production**, Kong strips `/functions/v1/` and the function receives `/make-server-067f252d/state`. The function name in production is `make-server-067f252d`.

If we register it locally as `server`, Kong strips `/functions/v1/` and the function receives `/server/make-server-067f252d/state` — the extra `/server` prefix causes all Hono routes to return 404.

By registering as `make-server-067f252d`, the local and production path behavior are identical. No code changes to the function itself are needed.

---

## 4. Why `supabase functions serve` is bypassed
**Problem:** `supabase functions serve` v2.75.0 starts an edge-runtime Docker container but sets `SUPABASE_INTERNAL_FUNCTIONS_CONFIG={}` (empty). No functions are registered, so every request returns "Function not found".

**Root cause confirmed via:** `docker inspect supabase_edge_runtime_Design-System-Website` showing empty functions config and no volume mounts.

**Fix:** Start the container manually with:
- `-v .../supabase/functions:/root/functions` (mounts function files)
- `SUPABASE_INTERNAL_FUNCTIONS_CONFIG` set with the function name and entrypoint path
- `-v /tmp/edge-main/index.ts:/root/index.ts` (the main service router script)
- `--entrypoint edge-runtime ... start --main-service=/root --port=8081`

**When this will be resolved:** Upgrading to Supabase CLI v2.84.2+ should fix `supabase functions serve` and make the manual docker step unnecessary. The brew upgrade failed due to network issues (HTTP/2 errors). To retry: `brew upgrade supabase/tap/supabase`.

---

## 5. Main service script is committed to `.claude/`
**Decision:** `.claude/edge-main-index.ts` is committed to the repo and mounted into the Docker container

**Why (revised):** Originally placed in `/tmp` to avoid cluttering the repo, but `/tmp` is cleared on reboot — the container then fails to start. Committing it to `.claude/` is safer and makes the docker command self-contained after any `git checkout`. The file is prefixed with a comment explaining its purpose so it doesn't confuse future contributors.

**Update path:** If the Supabase CLI is later upgraded and `supabase functions serve` works again, this file and the manual docker step can both be removed.

---

## 6. DB migration is committed; local data is not
**Decision:** `supabase/migrations/20260101000000_create_kv_store.sql` is committed

**Why:** The migration creates the `kv_store_067f252d` table that the edge function reads/writes. It must be versioned so any developer can run `supabase db reset` and get a working local schema. The actual data (icon lists, article content, etc.) lives only in the local Postgres and is never committed.
