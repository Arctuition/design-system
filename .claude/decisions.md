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

---

## 8. Supabase front-end config is env-overridable for Amplify deploys
**Decision:** `utils/supabase/info.tsx` resolves `projectId` / `publicAnonKey`
from Vite env vars with the previous committed values as fallback:

```typescript
export const projectId =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || "dnfzdqyiepjzqrigpvzw"
export const publicAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_…"
```

The per-environment values live in a committed `.env` (the production
**publishable** key `sb_publishable_…` is there). Production deploys via AWS
Amplify; set the same `VITE_SUPABASE_*` names in Amplify's env-var settings to
override at deploy time — Vite gives real host env vars priority over `.env`,
which has priority over the fallback literals.

**Project moved (decision #10):** the canonical Supabase project is now
`dnfzdqyiepjzqrigpvzw` (was `qcqtnrrprgqlckzywnkt`). The fallback literals here
and in `info.tsx` track `.env`. The edge-function deploy target is driven by the
`SUPABASE_PROJECT_REF` GitHub repo variable (default `dnfzdqyiepjzqrigpvzw`), not
a hard-coded ref. Edge runtime code is project-agnostic (it reads
`Deno.env.get("SUPABASE_URL")`), and all front-end URLs interpolate `projectId`,
so switching projects is now an env/`.env` change, not a code edit.

**Why:** Prod moved to AWS Amplify and the key had to be swappable per deploy
without editing source. Publishable/anon keys are public (they ship in the
client bundle), so committing `.env` is consistent with the anon key already
living in committed source — and keeps local dev + CI working with zero setup.

**Drift trap (important):** `scripts/safe-changelog-sync.mjs` and
`scripts/generate-icons-json.mjs` parse `info.tsx` **as text** to get the key.
The match was relaxed from `…=\s*"([^"]+)"` to `…=[^"]*"([^"]+)"` so it reads
the literal out of the new `import.meta.env.X || "literal"` form, and both
scripts now prefer `process.env.VITE_SUPABASE_*` first (so Amplify-injected
vars reach the build scripts too). If you change the shape of those exports in
`info.tsx`, re-check those two regexes.

---

## 9. CMS login moved to Google Workspace (Supabase Auth) — frontend gate only
**Decision:** Replace the homegrown username/password CMS gate (KV `editors`
slot + `AccountManager`) with **Google sign-in via Supabase Auth** (Google
provider), restricted to `@arcsite.com`. It is a **frontend gate only** — the
choice was made explicitly (the alternative was backend enforcement).

**Shape:**
- `utils/supabase/client.ts` — browser Supabase client, used ONLY for auth.
  Data still flows through `src/app/store/api.ts` (raw fetch + public key).
- `utils/supabase/allowlist.ts` — `isAllowedEmail()`; emails/domains from
  `VITE_CMS_ALLOWED_EMAILS` / `VITE_CMS_ALLOWED_DOMAINS`. **Edit access is
  limited to a per-email allowlist** (default `hongyu@arcsite.com,
  haowei@arcsite.com`; no whole-domain by default). Everyone else can VIEW the
  public site (no login) but cannot sign in to the CMS. To re-open to the whole
  Workspace, set `VITE_CMS_ALLOWED_DOMAINS=arcsite.com`.
- `src/app/store/data-store.tsx` — an effect mirrors the Supabase session into
  the existing `isAuthenticated` / `currentUser` fields, so every CMS page's
  `if (!isAuthenticated) <Navigate to="/cms/login">` guard is unchanged. A
  signed-in account outside the allowlist is signed straight back out.
  `login(user,pass)` → `loginWithGoogle()`; `logout()` → `supabase.auth.signOut()`.
- `src/app/pages/cms/LoginPage.tsx` — "Sign in with Google" button.
- `cms/accounts` route + dashboard tile removed; `AccountManager.tsx` orphaned.
- The sidebar footer "CMS Login" link in `AppLayout.tsx` is **visible to
  everyone** — the login entry is not a secret. Hiding it from signed-out users
  was tried and reverted: it's a chicken-and-egg (you can't tell who someone is
  before they log in) that only inconveniences the real maintainers while a
  determined visitor still has the `/cms/login` URL. The **email allowlist is
  the gate**, not button-hiding. Signed-in maintainers see dashboard + sign-out.

**Why frontend-only:** quickest path that matches the existing gate (which was
also client-side). The KV write API was already open to anyone holding the
public anon/publishable key, so this changes nothing about API exposure.

**⚠️ Trade-off / drift trap:** a determined user with the public key can still
`curl` a write — the gate hides the UI, it doesn't protect the data. To make it
real, add a token check on mutating routes in `make-server-067f252d/index.ts`
(verify the user's Supabase JWT + email domain) AND move scripted writers
(`safe-changelog-sync.mjs`, token-doc curl) onto an automation token. Not done.

**Setup (NOT in the repo — the Google client secret must never be committed):**
1. GCP OAuth client → Authorized redirect URI:
   `https://<project>.supabase.co/auth/v1/callback`.
2. Supabase dashboard → Authentication → Providers → Google: enable, paste
   Client ID + Client Secret.
3. Supabase dashboard → Authentication → URL Configuration: Site URL +
   `http://localhost:5173/**` and the prod origin in the redirect allowlist.

**Note:** the Supabase project + publishable key now come from `.env`
(decision #8), so this targets whatever project `VITE_SUPABASE_PROJECT_ID`
points at. The Google provider must be configured on that same project.

---

## 10. Canonical Supabase project moved to `dnfzdqyiepjzqrigpvzw`
**Decision:** The production Supabase project is now `dnfzdqyiepjzqrigpvzw`
(was `qcqtnrrprgqlckzywnkt`). Nothing about the project is hard-coded in
shippable code:

- **Front-end** — every Supabase URL interpolates `projectId` from
  `utils/supabase/info.tsx`, which reads `VITE_SUPABASE_PROJECT_ID` (`.env` /
  Amplify) with a fallback literal that tracks `.env`.
- **Edge runtime** (`kv_store.ts`, `storage.ts`, `design-tokens-storage.ts`) —
  project-agnostic already; reads `Deno.env.get("SUPABASE_URL")`, which Supabase
  injects per deployed project. No change needed to switch projects.
- **CI deploy** (`.github/workflows/deploy-edge-functions.yml`) — target is the
  `SUPABASE_PROJECT_REF` GitHub **repo variable** (default
  `dnfzdqyiepjzqrigpvzw`), so the deploy project is config, not a code edit.

So switching projects again = change `.env` / Amplify var / the repo variable.
The only remaining literals are fallbacks (info.tsx, decisions #8 example) +
doc references, all marked as tracking `.env`.

**Migration cost (one-time, per move):** the new project starts empty —
`supabase db push` (KV table) + `supabase functions deploy` + copy the 13
`STATE_KEYS` from the old project's KV + re-upload Storage assets (pattern
images live at absolute `<old-ref>.supabase.co` URLs until re-published). Keep
the old project alive until Storage is migrated. The Google auth provider must
be configured on the new project (decision #9).

---

## 7. AI-agent token artifacts are self-contained static files, not Supabase Storage

**Decision:** `llms.txt` points AI agents at `bootstrap.css`, `breakpoints.js`,
and the three `tokens-*.md` on the static site (`${SITE_BASE_URL}/tokens/…`),
and `scripts/generate-llms-txt.mjs` emits a **fully-inlined** `bootstrap.css`
in every build mode (no `@import` shim). `buildBootstrapShim` was removed from
`_shared/token-generators.mjs` (no remaining caller).

**Why:** The move to `design-system.arcsite.com` (ChangeLog 1.13.0) swapped the
*page* URLs but left the token-doc / `bootstrap.css` URLs pointing at
`*.supabase.co` storage, and `bootstrap.css` was a shim that `@import`ed
Supabase at render time. A teammate behind an org network-egress allowlist
(which trusts `*.arcsite.com` but not the multi-tenant `*.supabase.co`) still
couldn't load tokens. Serving every agent-facing artifact self-contained from
our own domain removes the third-party dependency entirely.

**Trade-off (interim):** Token-doc / bootstrap edits now reach AI agents on the
next site deploy, not instantly — the Supabase live-publish path was already
unreachable behind the egress allowlist anyway. The instant-publish path
returns with the backend migration to AWS (CMS/KV/Storage), at which point the
`${SITE_BASE_URL}` token URLs can repoint to the AWS publish target.

**Agent-facing canonical moved:** the static `tokens-*.md` are mirrored at
prebuild from **repo `tokens/*.md`**, so a CMS (KV) token-doc edit no longer
reaches agents until repo `tokens/*.md` is re-synced and the site redeploys.
See the §3d / drift-risk notes in `ARCHITECTURE.md` and the
"Token reference MDs" banner in `CLAUDE.md`. (Repo and KV were byte-identical
as of 2026-05-27.)

> **Partly superseded by #11:** the prebuild now reads token state (and the
> token MDs) from **live KV**, not repo files. So a CMS edit *does* reach agents
> on the next deploy — repo `tokens/*` is only an offline fallback now. The
> static-not-Supabase serving decision from #7 still stands.

---

## 11. Build reads token state from live KV; CMS Publish triggers a rebuild

**Decision:** The prebuild (`scripts/generate-llms-txt.mjs`) fetches the token
state from Supabase KV (`GET /state`) and generates `bootstrap.css` /
`breakpoints.js` / `tokens-*.md` from it via the shared
`buildArtifactsFromKvState` helper in `_shared/token-generators.mjs`. Committed
`tokens/*.json` + `tokens/*.md` are now an **offline fallback** only (used when
Supabase is unreachable at build time, or when forced with `BUILD_FROM_REPO=1`;
the byte-identical parity test also stays on the repo path). The CMS
"Publish to Production" endpoint (`POST /design-tokens/publish`) additionally
POSTs to an Amplify incoming build webhook (`AMPLIFY_BUILD_HOOK_URL`, an edge
secret) to trigger that rebuild.

**Why:** After #7 made the served artifacts static (built from repo files),
token edits made via the CMS no longer reached the site without a hand-edit of
`tokens/*.json` + a PR — and they silently drifted: when this was built, live
KV already had **6 tokens the repo JSON was missing** (`color-fill-*-tertiary`
×5 + `size-comp-button-padding-horizontal-xl`), so the live site was serving
stale CSS. Reading from KV makes KV the single source of truth again and a
designer's Publish reaches the public site on the next deploy — **without
reintroducing the egress problem #7 fixed**, because the artifacts are still
self-contained static files served from `design-system.arcsite.com` (the build,
running in Amplify CI, is not behind the org egress allowlist, so it can read
Supabase freely). This is the egress-clean alternative to reverting #7 and
serving CSS live from Supabase Storage (which would re-break agents behind the
allowlist).

**Trade-off:** A token change goes live on the next build (~1–2 min) rather
than instantly. Acceptable; the instant path required serving from Supabase,
which is what #7 had to stop doing.

**External config required (not in the repo):**
1. AWS Amplify → App settings → Build settings → **Incoming webhooks** → create
   a build hook → copy its URL.
2. Supabase → Edge Functions → `make-server-067f252d` → Secrets → set
   `AMPLIFY_BUILD_HOOK_URL` to that URL. Until set, Publish still works (writes
   Storage + KV) but does not auto-rebuild — `rebuild.triggered` is `false` in
   the response.

**Keep in sync:** the reconstruction lives once in `buildArtifactsFromKvState`.
If you change token KV shapes or the bootstrap template, re-run
`npm run test:bootstrap`. Optionally re-sync repo `tokens/*` from KV
periodically so the offline fallback doesn't drift far.
