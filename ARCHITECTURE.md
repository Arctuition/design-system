# Architecture Map

A high-level map of **where data lives**, **how it flows across runtime
boundaries**, and **where drift can hide**. The point of this document is
not exhaustive documentation — that lives in CLAUDE.md and inline code
comments. The point is to make data-flow shape *visible* so that a PR
author (human or AI) can pattern-match their change against existing
risks before merging.

> **This file is load-bearing.** A CI check warns when load-bearing
> source files change without `ARCHITECTURE.md` (or `CLAUDE.md`) also
> being touched. If your PR changes data flow, update this map in the
> same PR. The PR template asks you to confirm.

---

## How to use this map

### Before opening a substantial PR

1. Find the section closest to what you're changing.
2. Re-read the **Drift risks** callouts — does your change make any of them worse, or invalidate any of the listed guards?
3. Re-read the **Canonical sources** — does your change move the canonical for any artifact?
4. If yes to either: update this map in the same PR and call it out in the PR description.

### When reviewing a PR

1. Open this map next to the diff.
2. If the PR touches a "load-bearing source" file (listed below) but doesn't update the relevant section here, push back unless the author justifies why no doc change is needed.

### Load-bearing source files (CI watches these)

The drift-warning CI check (`.github/workflows/docs-drift-check.yml`) fires when a PR changes any of:

| Path | What it affects |
|---|---|
| `supabase/functions/_shared/state-keys.mjs` | Client/server KV state contract |
| `supabase/functions/_shared/token-generators.mjs` | Build-time + runtime CSS pipeline |
| `supabase/functions/make-server-067f252d/index.ts` | Edge function routes + KV storage |
| `src/app/store/data-store.tsx` | Client app state shape + persistence |
| `src/app/store/api.ts` | Client ↔ server API surface |
| `scripts/generate-llms-txt.mjs` | Prebuild output (llms.txt, bootstrap.css) |
| `src/app/lib/state-keys.ts` | Thin client wrapper for shared contract |

…changes to any of these should normally also touch `CLAUDE.md` and/or `ARCHITECTURE.md`. The check is advisory (warning comment, not blocking) because emergency fixes shouldn't be gated by docs.

---

## 1. Design token pipeline (Figma → bootstrap.css)

```
                  ┌────────────────────────────┐
                  │   Figma Design Library     │  ← authoritative source
                  │   (variables collection)   │
                  └─────────────┬──────────────┘
                                │
                    designer exports JSON
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
   ┌─────────────────┐                  ┌──────────────────┐
   │  tokens/*.json  │                  │  CMS upload UI   │
   │  (committed)    │                  │  /cms/tokens/*   │
   └────────┬────────┘                  └────────┬─────────┘
            │                                    │
            │  prebuild script                   │  client-side parser
            │  flattenColor/Size/Font            │  src/app/components/shared/
            │                                    │  *-token-utils.ts
            ▼                                    ▼
   ┌─────────────────┐                  ┌──────────────────┐
   │ public/tokens/  │                  │   KV state slots │
   │ bootstrap.css   │                  │   colorTokens,   │
   │ (bundled)       │                  │   sizeTokens,    │
   └────────┬────────┘                  │   fontTokens,    │
            │                           │   breakpointToken│
            │  GH Pages deploy          └────────┬─────────┘
            ▼                                    │
   ┌─────────────────┐                  Publish button click
   │ GH Pages-served │                  POST /design-tokens/publish
   │ bootstrap.css   │                  (server flattens KV → CSS)
   │ shim (prod)     │                           │
   └─────────────────┘                           ▼
                                       ┌──────────────────┐
                                       │ Supabase Storage │
                                       │ design-tokens/   │
                                       │ bootstrap.css    │ ← what external
                                       └──────────────────┘   prototypes fetch
```

**Canonical for which audience:**
- Figma library → designers
- KV state slots → CMS preview, public token reference pages (`/color/tokens` etc, after PR #32), AI agents inspecting state
- Supabase Storage `bootstrap.css` → external prototypes, AI agents importing the bootstrap

**Drift risks:**
- Client parsers (TS, `src/app/components/shared/*-token-utils.ts`) and server flatteners (JS, `supabase/functions/_shared/token-generators.mjs`) describe the same transformation. They will drift if not guarded.
- bundled JSON (`tokens/*.json`) and KV can diverge if a designer uploads via CMS but doesn't commit the JSON to repo.
- The prebuild `flattenFont` once had a bug (no scope-hint awareness) while `fontRowsToFlat` was correct — exactly the divergence the byte-identical test catches.

**Guards in place:**
- `scripts/test-bootstrap-byte-identical.mjs` runs both paths against the same JSON and diffs the output. CI gates this on `.github/workflows/test-bootstrap-parity.yml`.
- Public token reference pages (`SizeTokensPage`, `ColorTokensPage`, `ColorSwatchesPage`, `TypographyTokensPage`) now read KV first, fall back to bundled JSON. So a CMS upload immediately shows up in the public pages without a rebuild.

**When you change X, also touch Y:**
- Change `_shared/token-generators.mjs` → re-run `npm run test:bootstrap` locally. CI catches it but local is faster.
- Change a client parser in `src/app/components/shared/*-token-utils.ts` → write or update the mirror in `test-bootstrap-byte-identical.mjs` if the parser shape changed.
- Add a new size mode or font mode → update both the client parser's slot map AND `_shared/token-generators.mjs`'s consumption AND the bundled JSON imports.

---

## 2. Token reference MD docs (a known-drifty subsystem)

**⚠️ Two storage paths exist for the same conceptual document.** This is a known smell.

```
   ┌─────────────────┐          ┌──────────────────────┐
   │ tokens/*.md     │          │  KV `tokenDocs`      │
   │ (repo / seed)   │          │  (canonical)         │
   └────────┬────────┘          └──────────┬───────────┘
            │                              │
            │  prebuild copy               │  CMS publish click
            ▼                              ▼
   ┌─────────────────┐          ┌──────────────────────┐
   │ public/tokens/  │          │ Supabase Storage     │
   │ tokens-*.md     │          │ design-tokens/       │
   │ (GH Pages)      │          │ tokens-*.md          │ ← llms.txt points here
   └─────────────────┘          └──────────────────────┘
```

**Canonical**: KV → Storage. `public/llms.txt` explicitly points AI agents at the Storage URLs. The repo file is a *seed* — relevant on first install before any CMS edits, irrelevant thereafter.

**Drift risks:**
- The repo file and the KV value can hold different content with no error signal. They are NOT round-tripped.
- A PR that edits the repo file alone is silently a no-op for AI agents fetching the canonical URL. (This trap caught a maintainer on 2026-05-14; see the May 14 post-mortem in project memory.)

**Guards in place:**
- CLAUDE.md "Token reference MDs — canonical = KV, NOT repo" section explicitly walks through the right workflow.
- *(Not yet)*: no automated parity check between repo and Storage. If you want one, see follow-up below.

**When you change X, also touch Y:**
- Edit a token MD doc → write to KV via CMS Markdown Editor OR `curl -X PUT .../state/tokenDocs`. Then click Publish (or `curl -X POST .../design-tokens/publish`). Optionally snapshot back into `tokens/*.md` for git history.
- **Never** PR-merge an edit to `tokens/tokens-*.md` and assume the canonical URL updated. It didn't.

**Follow-up worth considering:** CI workflow that fetches the Storage MD on push to main and diffs against `tokens/*.md` in repo; fails if they diverge for more than N commits.

---

## 3. KV state sync (client ↔ edge function)

```
   ┌───────────────────────┐
   │  React app state      │
   │  (data-store.tsx)     │
   └──────────┬────────────┘
              │
              │ setColorTokens(...)  /  setSizeTokens(...)  /  ...
              ▼
   ┌───────────────────────┐
   │  pendingSyncRef       │  (debounced)
   └──────────┬────────────┘
              │
              │ PUT /state/:key  (Authorization: Bearer ANON)
              ▼
   ┌───────────────────────┐
   │  Edge function        │
   │  validates against    │  ← allowlist: STATE_KEYS in
   │  STATE_KEYS allowlist │    supabase/functions/_shared/state-keys.mjs
   └──────────┬────────────┘
              │
              ▼
   ┌───────────────────────┐
   │  KV row (Supabase)    │
   │  ds:<key> = value     │
   └───────────────────────┘
```

**Canonical**: `supabase/functions/_shared/state-keys.mjs` — imported by both edge function and client via `src/app/lib/state-keys.ts`.

**Drift risks:**
- Adding a new state slot on the client without registering it in `STATE_KEYS` → server returns 400, client's existing `.catch()` swallows it, the new slot never persists. (This bit us on 2026-05-14 with `tokenStatus`.)
- Schema renames inside a state slot's payload → reader code (`buildStateFromServer`) must include a migration. Without it, the upgrade silently drops the old shape's data.

**Guards in place:**
- Single source of truth: `STATE_KEYS` lives in the shared `.mjs` module imported by both sides. They can't drift.
- `assertValidStateKey` runs on the client outbound path in `syncToServer`. Any key not in STATE_KEYS produces a visible `toast.error` + console message — turns silent-400 into loud-throw.
- `buildStateFromServer` is the dedicated migration site. Shape changes go through there.

**When you change X, also touch Y:**
- Add a new state slot → append to `STATE_KEYS` in `_shared/state-keys.mjs`. Both sides pick it up; no other change needed.
- Rename a field inside a slot → write the migration in `buildStateFromServer` in the same PR. Comment the migration "// Migration for shape X used before PR #N." Never delete that comment.

---

## 4. Token status badges (per-slot publish tracking)

Group E feature. Stores per-slot upload + publish timestamps to drive
the editor's Empty / Uploaded / Published badge.

**Data shape** (KV slot `tokenStatus`):

```ts
{
  tokenSlotMtimes:     { [slotKey: string]: ISO_timestamp },
  tokenSlotPublishedAt: { [slotKey: string]: ISO_timestamp },
}
```

Slot keys are stable strings: `color/global`, `color/light`, `color/dark`,
`size/global`, `size/webMobile`, …, `breakpoint`, `font/webDesktop`, …

**Display logic** (`computeTokenSlotState`):
- No data → `empty`
- Has data, no recorded mtime AND no publishedAt → `published` (no timestamp shown) — auto-seeded on first load via `buildStateFromServer`
- mtime > publishedAt → `uploaded` (yellow, mtime shown)
- mtime ≤ publishedAt → `published` (green, publishedAt shown)

**Drift risks:**
- Schema rename (we already did one: pre-PR-#37 used `tokensLastPublishedAt: string | null`; post-#37 uses `tokenSlotPublishedAt: Record<string,string>`). Migration in `buildStateFromServer` handles both shapes.
- `markTokensPublished` only bumps publishedAt for slots where `mtime > publishedAt` (or both are missing). If that logic moves to "bump all slots" or "bump only the slot the user just touched", per-slot accuracy breaks.

**Guards in place:**
- Migration code in `buildStateFromServer` reads the old shape and seeds the new shape. Permanent code, do not delete.
- Auto-seed for legacy data (no mtime, no publishedAt) produces a baseline so the badge can show *some* date instead of speculating "uploaded just now".

---

## 5. Deploy topology

Three independent deploy paths. Each artifact has its own pipeline.

| Artifact | Source | Trigger | Workflow |
|---|---|---|---|
| SPA | `src/`, `public/` | push to main | `.github/workflows/deploy.yml` (GH Pages) |
| Edge function | `supabase/functions/**` | push to main | `.github/workflows/deploy-edge-functions.yml` |
| Storage `bootstrap.css` + MD docs | KV state | designer clicks Publish in CMS, or `curl POST /design-tokens/publish` | (no automated trigger; runtime-driven) |

**Drift risks:**
- An edit to the edge function source lands but isn't deployed → prod runs old code. (This happened on 2026-05-14 — fixed by adding `deploy-edge-functions.yml` in PR #30.)
- Storage `bootstrap.css` regeneration relies on a human/AI clicking Publish. If KV state changes but Publish isn't called, Storage stays stale. There's no time-based trigger.
- The CMS UI doesn't show "you have unpublished changes" prominently — the upload card badges (Group E) are the closest signal, but only after a slot has been touched.

**Guards in place:**
- `deploy-edge-functions.yml` auto-deploys on push to main matching `supabase/functions/**`.
- Concurrency group prevents duplicate deploys.
- `Verify deploy` step prints the version number to the workflow log.

---

## 6. Public token reference pages (drift fixed in PR #32)

```
   ┌──────────────────────────────────────┐
   │   useAppData() reads KV at runtime   │
   └────────────────┬─────────────────────┘
                    │
                    │ if KV has Figma-shaped data
                    │ else fall back to bundled JSON
                    ▼
   ┌──────────────────────────────────────┐
   │  SizeTokensPage, ColorTokensPage,    │
   │  ColorSwatchesPage,                  │
   │  TypographyTokensPage                │
   │                                      │
   │  Use looksLikeFigma*Tokens()         │
   │  + get*FromKv() adapters             │
   └──────────────────────────────────────┘
```

**Before PR #32** these pages read bundled JSON only, so a CMS upload didn't reflect on the public pages until a rebuild + deploy.

**Drift risks:** none structurally — `useAppData()` is reactive. But:
- If a new public page is added that consumes tokens, the author must use the `*FromKv` adapter, not directly read bundled JSON.
- `looksLikeFigma*Tokens` is a heuristic. If the data shape evolves (e.g., new naming convention), the heuristic might misclassify and fall back to bundled JSON inappropriately.

**Guards in place:**
- All four current pages are wired up. New pages should follow the pattern.

---

## Appendix: substantial-PR checklist

Before opening a PR that touches a load-bearing source file, run through this:

- [ ] **Canonical sources**: am I changing which file or service is canonical for any artifact?
- [ ] **Adjacent docs**: do `CLAUDE.md`, `ARCHITECTURE.md`, `tokens/tokens-*.md`, or `.claude/decisions.md` have instructions that would become *misleading* (not just *wrong*) after my change? Search for the file/service name in each.
- [ ] **CI gates**: am I bypassing or modifying any existing CI check (byte-identical, edge-function deploy, parity)? If so, can I add a replacement?
- [ ] **Migrations**: am I renaming or reshaping a persisted field? If yes, the migration goes in this PR, not a follow-up.
- [ ] **Deploy topology**: am I adding a new runtime artifact? If yes, it needs its own auto-deploy.
- [ ] **AI-authored only**: the change is over ~500 LOC or touches more than 5 files — re-scan all `.md` files in the project for sentences that might now be stale.

---

## Maintenance

Last meaningful architectural revision: 2026-05-14 (Groups A–F + drift guards).

This file should be revised whenever:
- A new data flow is introduced
- A canonical source moves
- A new shared module or CI gate is added
- A migration shape changes

When updating, keep diagrams readable (ASCII is fine; don't import a binary format). Keep "Drift risks" and "Guards in place" lists honest — list gaps you know about so they don't get forgotten.
