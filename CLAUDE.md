# Design System Website — Claude Context

## Project
React + Vite + TypeScript design system CMS. Content is managed through `/src/app/pages/cms/` pages and persisted via a Supabase edge function acting as a key-value store.

## Key files
| Path | Purpose |
|------|---------|
| `src/app/pages/cms/IconEditor.tsx` | Icon upload, deduplication, bulk import |
| `src/app/store/api.ts` | All backend API calls (switches local/prod automatically) |
| `supabase/functions/server/index.tsx` | Hono-based edge function (state CRUD) |
| `supabase/functions/server/kv_store.tsx` | Supabase KV store helper |
| `supabase/migrations/20260101000000_create_kv_store.sql` | Local DB migration |
| `.claude/launch.json` | Dev server config for `preview_start` |

## Active branch work
**Branch `icon-upload-dedup`** (merged to main) added:
- Duplicate icon detection in `handleSingleUpload` and `handleBulkUpload` — re-uploading by filename calls `updateIcon()` (SVG only) instead of `addIcon()`, preserving existing tags
- Bulk import result dialog (Radix UI `Dialog`) showing added vs. updated counts
- Local Supabase routing in `api.ts` (dev → local, prod → cloud)
- KV store migration file

## Local development
**See `.claude/local-dev.md` for the full runbook.**

Quick start (assuming Docker Desktop is running):
```bash
supabase start          # starts local Postgres + Kong on :54321
# then restart edge runtime — see .claude/local-dev.md
npm run dev             # Vite on :5173
```

In dev mode, the app automatically routes API calls to `http://127.0.0.1:54321` instead of production Supabase. No config changes needed.

## Key decisions
**See `.claude/decisions.md` for full rationale.**

- `supabase functions serve` is broken in v2.75.0 — edge runtime must be started via a manual `docker run` command (documented in `.claude/local-dev.md`)
- The edge function is registered locally as `make-server-067f252d` (not `server`) to match the production URL path, so Hono routes work identically in both environments
- `.claude/edge-main-index.ts` is the committed main service router script — mounted into the Docker container at `/root/index.ts`

## Keeping these docs up to date
Say **"sync context"** in any session to trigger an update of these files.
`/project:sync-context` does NOT work — Claude Code resolves slash commands relative to cwd, which is often a worktree, not the project root.

## Worktree cleanup
If you see a "Commit changes" prompt in the Claude Code toolbar, a worktree is still active. Remove it:
```bash
git worktree remove .claude/worktrees/relaxed-meitner --force
```
