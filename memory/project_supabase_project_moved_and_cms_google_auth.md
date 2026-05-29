---
name: project-supabase-project-moved-and-cms-google-auth
description: Prod Supabase project moved to dnfzdqyiepjzqrigpvzw; CMS auth → Google (frontend-gate only); new project backend not yet provisioned
metadata:
  type: project
---

As of 2026-05-29 (branch `google-workspace-cms-auth`, PR #54), two prod-migration changes are in flight:

**1. Canonical Supabase project moved** `qcqtnrrprgqlckzywnkt` → **`dnfzdqyiepjzqrigpvzw`**.
- Nothing project-specific is hard-coded in shippable code: front-end interpolates `projectId` from `utils/supabase/info.tsx` (← `VITE_SUPABASE_PROJECT_ID` in `.env`/Amplify, fallback literal tracks `.env`); edge runtime reads `Deno.env.get("SUPABASE_URL")`; CI deploy target is the `SUPABASE_PROJECT_REF` GitHub repo variable (default `dnfzdqyiepjzqrigpvzw`). Switching projects = env change, not code edit. See `.claude/decisions.md` #8 + #10.
- Prod publishable key (new format): `sb_publishable_AbBNYAJCE4TWCWux_7WYkA_sSM9CMvY` (public — ships in client bundle, fine in committed `.env`).

**2. CMS login switched username/password → Google Workspace** (Supabase Auth, Google provider). **Edit access limited to a per-email allowlist** — default `hongyu@arcsite.com` + `haowei@arcsite.com` (`VITE_CMS_ALLOWED_EMAILS`; `VITE_CMS_ALLOWED_DOMAINS` empty by default). Everyone else can VIEW the public site (no login) but can't sign into the CMS. The sidebar "CMS Login" entry (`AppLayout.tsx` footer) is visible to everyone — hiding it was tried and reverted (chicken-and-egg: can't know who someone is pre-login; only inconveniences real maintainers while the `/cms/login` URL still exists). The email allowlist is the real gate, not button-hiding. **Frontend gate ONLY** — chosen deliberately. The KV write API still accepts the public key as Bearer, so anyone with it can `curl` a write; the gate only hides the UI. Real protection needs a JWT+domain check on mutating routes in `make-server-067f252d/index.ts`. `AccountManager.tsx` + `editors` KV slot are now dead code. See `.claude/decisions.md` #9.

**⚠️ Blocking gaps before this works in prod (verified empty as of 2026-05-29):**
- New project `dnfzdqyiepjzqrigpvzw` backend is EMPTY: edge function returns 404 (not deployed), no KV table, no data, Google provider OFF.
- Need (user-run, supabase CLI is sandboxed-blocked for the agent): `supabase db push` (KV table) + `supabase functions deploy make-server-067f252d` + enable Google provider + set redirect URLs. Then agent can curl-migrate the 13 STATE_KEYS old→new (edge fn is `verify_jwt=false`). Storage assets (pattern images) still live at old-ref URLs — keep old project alive until migrated.
- GCP OAuth client (`artifacts-gallery-496012`) needs redirect URI `https://dnfzdqyiepjzqrigpvzw.supabase.co/auth/v1/callback` added; the Google **client_secret** goes in Supabase dashboard ONLY, never the repo.
- ChangeLog 1.15.0 is seed-only, not synced to prod (new project has no backend yet).

**Why:** prod deployment moved to AWS Amplify; key/project must be swappable per-deploy without source edits.

**Storage URL situation (verified 2026-05-30):** Two different things, don't conflate.
- CODE that builds storage URLs (`PatternArticleEditor.tsx:3`, `PatternDetailPage.tsx:9` → `STORAGE_BASE = https://${projectId}.supabase.co/storage/v1/object/public/pattern-assets`) is already env-driven (interpolates `projectId`), NOT hardcoded. ✓
- DATA is the real problem: the migrated KV state has **19 ABSOLUTE storage URLs baked into content** still pointing at OLD project `qcqtnrr` — 14 in `patterns` (bucket `pattern-assets`), 1 in `homeArticle` + 1 in `iconologyArticle` (bucket `make-067f252d-icons`). These live inside HTML/markdown blobs; can't "un-hardcode" without either (a) migrating the actual Storage files to new project + rewriting the URLs in data, or (b) refactoring content to store relative paths. So OLD project must stay alive until Storage is migrated.
- `bootstrap.css` / `breakpoints.js` / `tokens-*.md` are ALREADY off Supabase (decision #7): llms.txt points at `${SITE_BASE_URL}/tokens/...` (static site design-system.arcsite.com) and bootstrap.css is fully inlined (no @import). Not affected by the project move.
