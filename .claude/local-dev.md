# Local Development Runbook

## Prerequisites
- Docker Desktop (installed at `/Applications/Docker.app`) — must be running
- Supabase CLI v2.75.0 (`supabase` in PATH via Homebrew)
- Node.js / npm

## Starting the full local stack

### Step 1 — Start Supabase containers
```bash
supabase start
```
This starts Kong (port 54321), Postgres (port 54322), Auth, Storage, etc.
If it was already running: `supabase status` to verify.

### Step 2 — Start the edge runtime (MANUAL DOCKER STEP)
`supabase functions serve` is broken in v2.75.0 and does NOT register functions.
You must start the edge runtime container manually:

```bash
/Applications/Docker.app/Contents/Resources/bin/docker rm -f supabase_edge_runtime_Design-System-Website 2>/dev/null; \
/Applications/Docker.app/Contents/Resources/bin/docker run -d \
  --name supabase_edge_runtime_Design-System-Website \
  --network supabase_network_Design-System-Website \
  -p 8081:8081 \
  -e SUPABASE_URL=http://kong:8000 \
  -e "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -e "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -e SUPABASE_DB_URL=postgresql://postgres:postgres@db:5432/postgres \
  -e "SUPABASE_INTERNAL_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long" \
  -e SUPABASE_INTERNAL_HOST_PORT=54321 \
  -e 'SUPABASE_INTERNAL_FUNCTIONS_CONFIG={"make-server-067f252d":{"entrypointPath":"root/functions/server/index.tsx","importMapPath":"","verifyJWT":false}}' \
  -v /Users/hongyuduan/Desktop/Arcsite/Design-System-Website/.claude/edge-main-index.ts:/root/index.ts \
  -v /Users/hongyuduan/Desktop/Arcsite/Design-System-Website/supabase/functions:/root/functions \
  --entrypoint edge-runtime \
  public.ecr.aws/supabase/edge-runtime:v1.70.0 \
  start --main-service=/root --port=8081 --policy=per_worker
```

> **Note:** This command mounts `.claude/edge-main-index.ts` (committed to the repo) as the main service router. No setup needed — the file is always present after `git checkout`.

### Step 3 — Verify edge function is up
```bash
curl http://127.0.0.1:54321/functions/v1/make-server-067f252d/health
# Expected: {"status":"ok"}
```
The first request after startup takes ~5s (Deno downloads npm packages). Subsequent requests are fast.

### Step 4 — Apply DB migration (first time only)
```bash
supabase db reset
# Then restart the edge runtime (Step 2) because db reset stops containers
```

### Step 5 — Start Vite
```bash
npm run dev
# App runs at http://localhost:5173
```
In dev mode, `api.ts` automatically routes to `http://127.0.0.1:54321` — no config needed.

---

## About the main service script

`.claude/edge-main-index.ts` is committed to the repo and mounted into the container at `/root/index.ts`. It's a ~140-line Deno TypeScript router that reads `SUPABASE_INTERNAL_FUNCTIONS_CONFIG`, dispatches requests to the correct function worker, and handles JWT verification (disabled locally).

It was written to work around a bug in Supabase CLI v2.75.0 where `supabase functions serve` starts the container with an empty functions config. See `.claude/decisions.md` #4.

---

## Stopping everything
```bash
supabase stop          # stops all Supabase containers
# Docker Desktop automatically stops the edge runtime container with them
```

---

## Ports reference
| Port | Service |
|------|---------|
| 5173 | Vite dev server (React app) |
| 54321 | Kong API gateway (Supabase entry point) |
| 54322 | Postgres directly |
| 54323 | Supabase Studio UI |
| 8081 | Edge runtime container (direct, bypasses Kong) |

---

## Troubleshooting

### "Function not found" from Kong
The edge runtime container is not running or crashed. Re-run Step 2.

### Container exits immediately (exit code 2)
The `docker run` command is missing the `--entrypoint edge-runtime` flag or the CMD args (`start --main-service=/root ...`). Use the exact command above.

### 500 error from the function
Check container logs: `/Applications/Docker.app/Contents/Resources/bin/docker logs supabase_edge_runtime_Design-System-Website`
Common cause: `/root/functions/server/index.tsx` or `kv_store.tsx` has an import error, or the Supabase service role key in the container can't reach the DB.

### `supabase` not found in terminal
Run: `eval "$(/opt/homebrew/bin/brew shellenv)"` to add Homebrew to PATH.

### Docker CLI not found
Use full path: `/Applications/Docker.app/Contents/Resources/bin/docker`
