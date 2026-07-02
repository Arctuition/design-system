# Architecture — Data Flow Map

> Source of truth for how the design system CMS, Supabase, and the public consumers (static site at `design-system.arcsite.com`, AI agents, dev team) fit together. **Update this file whenever the data-write or data-read flow changes.** The PR template, the docs-drift CI check, and CLAUDE.md all point here.
>
> (This map lives at the repo top level for discoverability. It was previously `.claude/cms-architecture.md`; that path was retired and consolidated here on 2026-05-27 — there is now exactly one architecture map.)

## How to use this doc

### Before opening a substantial PR

1. Find the section closest to what you're changing (start with **§5 Master diagram** or the **§Drift risks** table below).
2. Read the **Drift risks** callouts — does your change make any of them worse, or invalidate a listed guard?
3. Check the **Canonical sources** in §6 — does your change move the canonical for any artifact?
4. If yes to either: update this file in the same PR.

### When reviewing a PR

Open this doc next to the diff. If the PR touches a **load-bearing source file** (see table below) but doesn't update this doc, push back unless the author justifies why no doc change is needed. The CI drift check posts an advisory warning for the same reason.

## Status of this document

The architecture described here is **deployed and live** (Option B shipped as PR #26 on 2026-05-12). All `(proposed)` / `NEW` markers from the pre-deploy era have been updated to reflect current reality. The May 14 2026 token-doc drift bug surfaced several follow-up guards (PRs #29–#43) — see the **§Drift risks and guards** section.

For the historical pre-Option-B framing, `git log --follow ARCHITECTURE.md` will show the predeploy revisions (the file was renamed from `.claude/cms-architecture.md` on 2026-05-27).

## Load-bearing source files (CI watches these)

The docs-drift CI check (`.github/workflows/docs-drift-check.yml`) posts an advisory warning when a PR changes any of these files without also touching `ARCHITECTURE.md` or `CLAUDE.md`:

| Path | What it affects |
|---|---|
| `supabase/functions/_shared/state-keys.mjs` | Client/server KV state contract |
| `supabase/functions/_shared/token-generators.mjs` | Build-time + runtime CSS pipeline |
| `supabase/functions/_shared/icon-manifest.mjs` | Build-time + runtime icon manifest pipeline (parity contract) |
| `supabase/functions/make-server-067f252d/index.ts` | Edge function routes + KV storage |
| `src/app/store/data-store.tsx` | Client app state shape + persistence |
| `src/app/store/api.ts` | Client ↔ server API surface |
| `src/app/lib/state-keys.ts` | Thin client wrapper for shared contract |
| `scripts/generate-llms-txt.mjs` | Prebuild output (llms.txt, bootstrap.css) |

Keep this table in sync with the `paths:` filter in the CI workflow. The check is advisory (warning comment, not blocking) because emergency fixes shouldn't be gated by docs.

## Drift risks and guards

The table summarises known places where data can silently diverge between code paths. Each row links to the section describing the flow in detail. The **§May 14 2026 post-mortem** in project memory documents the original incidents.

| Risk | Where | Guard |
|---|---|---|
| Client parser ↔ server flatten drift produces different `bootstrap.css` | §3a token pipeline | `scripts/test-bootstrap-byte-identical.mjs` runs both paths on every PR via `.github/workflows/test-bootstrap-parity.yml` |
| Edge function source updated but not deployed | §5 deploy topology | `.github/workflows/deploy-edge-functions.yml` auto-deploys on `supabase/functions/**` push to main |
| Client adds a new KV slot without registering on server → silent 400 → swallowed | §3 KV state sync | `supabase/functions/_shared/state-keys.mjs` is the single source; `assertValidStateKey` runs on client outbound |
| Schema rename inside a slot payload drops old-shape data on upgrade | §3 KV state sync | Migration code lives in `buildStateFromServer`; never delete a migration branch |
| Repo `tokens/*.md` and canonical KV `tokenDocs` diverge silently | §3d token reference MD docs | Mostly mooted by #12 — agents fetch the **live Supabase Storage** copy (regenerated from KV on any CMS token save — decision #14 — or a manual Publish), not the repo files. Repo `tokens/*.md` only feed dev/offline + the static back-compat mirrors. Residual: those static `design-system.arcsite.com/tokens/*.md` mirrors can lag KV; agents are told to use the Storage URLs. |
| Bundled `tokens/*.json` and KV diverge | §3a token pipeline | Public token pages prefer KV via `useAppData()` since PR #32; the bundled JSON is fallback only |
| Meta-docs (this file, CLAUDE.md) go stale after architecture changes | this whole document | `.github/workflows/docs-drift-check.yml` advisory comment; PR template architectural-impact checklist; CLAUDE.md substantial-PR rule |
| `NaNpx` / `undefined` values leak into published CSS | §3a token pipeline | `sizeRowsToFlat` filters non-finite values; byte-identical CI test would catch any reintroduction |
| Multi-scope font tokens emit wrong CSS unit | §3a token pipeline | `flattenFont` and `fontRowsToFlat` both read full `com.figma.scopes` array (regression fix PR #36) |
| In-repo `public/icons/` snapshot drifts from Supabase when designer uploads via CMS | §3e icon pipeline | Mostly mooted by #13 — agents read the **live edge routes** (`GET /icons*.json`, `/icons/:fileName`), regenerated from KV per request. `public/icons*` stay gitignored (PR #50) and regenerated each build; they only back the rarely-hit static `design-system.arcsite.com/icons*` URLs now. |
| Live edge icon manifest ↔ static `public/icons*.json` diverge | §3e icon pipeline | Both build manifests through the shared `_shared/icon-manifest.mjs` (`buildIconManifests`), so they're byte-identical for the same KV input — the same shared-module guard as the token pipeline. |
| CMS "login" is a **frontend gate only** — the public write API stays open | §CMS authentication | None. Documented trade-off (decision #9). Add an edge-function token check on mutating routes for real protection. |

## Substantial-PR checklist

For any PR over ~500 LOC or touching a load-bearing source file:

- [ ] **Canonical sources**: am I changing which file or service is canonical for any artifact?
- [ ] **Adjacent docs**: do `CLAUDE.md`, this file, `tokens/tokens-*.md`, or `.claude/decisions.md` have instructions that would become *misleading* (not just *wrong*) after my change? Search for the file/service name in each.
- [ ] **CI gates**: am I bypassing or modifying any existing CI check (byte-identical, edge-function deploy, parity, drift)? If so, can I add a replacement?
- [ ] **Migrations**: am I renaming or reshaping a persisted field? If yes, the migration goes in this PR, not a follow-up. Comment it `// Migration: shape X used before PR #N.`
- [ ] **Deploy topology**: am I adding a new runtime artifact? If yes, it needs its own auto-deploy.
- [ ] **AI-authored only**: when AI authors a substantial PR, the prompt should include: *"Before opening the PR, re-read this file and CLAUDE.md and check whether any instructions would become misleading."*

## CMS authentication (frontend gate)

The CMS pages under `/cms/*` are gated by a Google Workspace sign-in (Supabase
Auth, Google provider). It is a **frontend gate only**: it hides the CMS UI from
non-`@arcsite.com` users but does **not** protect the edge-function write API,
which still accepts the public anon/publishable key as Bearer. Anyone with that
public key can still `curl` a write. Real protection would mean verifying the
user's identity in `make-server-067f252d/index.ts` on mutating routes — see
[decision #9](.claude/decisions.md) for the trade-off.

Flow:

- `utils/supabase/client.ts` — browser Supabase client (auth only; data still
  flows through `src/app/store/api.ts`). Always targets the cloud project.
- `utils/supabase/allowlist.ts` — `isAllowedEmail()`; allowed domains/emails
  from `VITE_CMS_ALLOWED_DOMAINS` / `VITE_CMS_ALLOWED_EMAILS` (default
  `arcsite.com`).
- `src/app/store/data-store.tsx` — an effect mirrors the Supabase session into
  the existing `isAuthenticated` / `currentUser` fields; non-allowed accounts
  are signed straight back out. `loginWithGoogle()` starts the redirect;
  `logout()` calls `supabase.auth.signOut()`.
- `src/app/pages/cms/LoginPage.tsx` — "Sign in with Google" button.
- Every CMS page keeps its `if (!isAuthenticated) <Navigate to="/cms/login">`
  guard unchanged.

Provider config (Supabase dashboard + Google Cloud OAuth client) lives outside
the repo — the Google client secret is never committed. The retired
username/password machinery (`editors` KV slot, `addUser` etc.,
`AccountManager.tsx`) is now dead code: `AccountManager` is unrouted, and the
slot/helpers remain only to avoid a wider refactor.

## Article model — MD-canonical for token docs + iconology

The `/size`, `/color`, `/typography`, and `/iconology` pages render Markdown reference docs, not HTML articles. There is no HTML version. This is intentional:

- The content (prose + tables + code) round-trips losslessly through Markdown — there's no layout an HTML editor would express that MD can't.
- AI agents fetch the same source the public website renders. One file, one canonical version.
- Editing is via direct MD upload by an agent, or via the MD editor in the CMS ([MarkdownEditorPage.tsx](src/app/components/shared/MarkdownEditorPage.tsx), bound to `tokenDocs` slots by [TokenDocEditors.tsx](src/app/pages/cms/TokenDocEditors.tsx)).

All four MD docs live in the `tokenDocs` KV slot (`{ color, size, typography, iconology }`), seeded at build from `tokens/*.md?raw`, and auto-published to Supabase Storage on save (color/size/typography → `tokens-*.md`; iconology → `iconology.md`). `/iconology` renders `tokenDocs.iconology` and links to the icon **library** browser at `/iconology/library` (the searchable grid, a separate page — same doc-page-plus-entry-points shape as `/color` → `/color/tokens` + `/color/swatches`).

The HTML article pattern (rich-text WYSIWYG → HTML stored in KV → rendered on the public site) **does** still apply to:

- `homeArticle` — rendered on `/` via [HomePage.tsx](src/app/pages/HomePage.tsx)
- Pattern guides — each pattern has both HTML and MD versions (see §3c)

The HTML slots that used to exist for `sizeArticle` / `colorArticle` / `typographyArticle` were removed in the post-PR-1 cleanup; `iconologyArticle` was removed when `/iconology` moved to MD (this change). Don't re-introduce any of them.

---

## 1. Who writes what

| Actor | What they write | Via |
|---|---|---|
| Designer | Token JSON files — color, size, font, breakpoint | CMS bulk / individual upload at `/cms/<editor>` |
| Editor | Article HTML — home, iconology only | CMS rich-text editor |
| Editor | Token reference MD — `tokens-color.md`, `tokens-size-space.md`, `tokens-typography.md` | **CMS Markdown editor → KV → Publish → Storage** (canonical). Repo file is a seed, not authoritative — see §3d. |
| Editor | Pattern article — HTML body + auto-generated MD + image assets | CMS pattern editor + bundle endpoint |
| Agent | Token JSON, article MD, pattern MD/assets | Supabase REST API (`PUT /state/:key`, `POST /patterns/:slug/bundle`) |

## 2. Where data lives in Supabase

```
┌─────────────────────────────────────────────────────────────────────┐
│                          SUPABASE PROJECT                           │
│                                                                     │
│  KV  (/state/:key)  — edit-friendly raw JSON / HTML / MD strings    │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ TOKENS                                                    │      │
│  │  colorTokens          { global, semanticLight, ... }      │      │
│  │  sizeTokens           { global, webMobile, webTablet, … } │      │
│  │  fontTokens           { webMobile, webDesktop, ... }      │      │
│  │  breakpointTokens     { tokens: [{xs:576}, ...] }         │      │
│  │  tokenDocs        { color, size, typography, iconology }  │      │
│  │                    (MD; iconology added this change)      │      │
│  │  tokenStatus          per-slot mtime + publishedAt        │      │
│  │                                                           │      │
│  │ ARTICLES (HTML, rendered on public pages)                 │      │
│  │  homeArticle          HTML  (rendered on /)               │      │
│  │                                                           │      │
│  │ REFERENCE DOCS (MD) — canonical = KV (see §3d)            │      │
│  │  tokenDocs.color      (rendered on /color)                │      │
│  │  tokenDocs.size       (rendered on /size)                 │      │
│  │  tokenDocs.typography (rendered on /typography)           │      │
│  │  tokenDocs.iconology  (rendered on /iconology)            │      │
│  │                                                           │      │
│  │ PATTERN GUIDES (HTML + MD pair per pattern)               │      │
│  │  patterns             [{ id, title,                       │      │
│  │                         content: HTML,                    │      │
│  │                         markdownContent: MD,              │      │
│  │                         htmlUpdatedAt,                    │      │
│  │                         markdownUpdatedAt }, ...]         │      │
│  │                                                           │      │
│  │ OTHER                                                     │      │
│  │  icons, changeLogs, editors, articleVersions              │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                     │
│  Storage (/storage/v1/object/public/) — generated, public read      │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ pattern-assets/                                           │      │
│  │   <slug>/<filename>.png                                   │      │
│  │   _inline/<articleKey>/<sha256>.<ext>                     │      │
│  │                                                           │      │
│  │ design-tokens/    (LIVE — canonical for agents, see #12)  │      │
│  │   bootstrap.css                                           │      │
│  │   breakpoints.js                                          │      │
│  │   size-tokens.zip                                         │      │
│  │   color-tokens.zip                                        │      │
│  │   font-tokens.zip                                         │      │
│  │   tokens-color.md                                         │      │
│  │   tokens-size-space.md                                    │      │
│  │   tokens-typography.md                                    │      │
│  └───────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

**Rule of thumb**: edit-friendly stays in KV, consumption-ready lives in Storage.

---

## 3. Writing data

### 3a. Token JSON — designer upload

```
   ┌──────────┐   8 JSON files       ┌────────────────────┐
   │ Designer │ ───────────────────► │   CMS upload UI    │
   └──────────┘                      │  /cms/size-editor  │
                                     │  /cms/color-editor │
                                     │  /cms/font-editor  │
                                     └─────────┬──────────┘
                                               │
                                  parse + validate JSON
                                  (shape check, alias preserved)
                                               │
                                               ▼
                            ┌──────────────────────────────┐
                            │ Supabase KV /state/:key      │
                            │   sizeTokens                 │
                            │   colorTokens                │
                            │   fontTokens                 │
                            │   breakpointTokens           │
                            └──────────────┬───────────────┘
                                           │
                  auto on any token save · or click [Publish to Production]
                                           │
                                           ▼
                ┌──────────────────────────────────────────────┐
                │ Edge function: POST /design-tokens/publish   │
                │ Reads KV state, calls the same pure          │
                │ flatten*() / *RowsToFlat() functions that    │
                │ scripts/generate-llms-txt.mjs uses, emits:   │
                │   • bootstrap.css                            │
                │   • breakpoints.js                           │
                │   • tokens-*.md (mirrored from KV tokenDocs) │
                │ Byte-identical parity verified in CI.        │
                └──────────────────────┬───────────────────────┘
                                       │ PUT each as a Storage object
                                       ▼
                       ┌────────────────────────────────────┐
                       │ Supabase Storage /design-tokens/   │
                       │ Stable public URLs — canonical for │
                       │ external prototypes + AI agents    │
                       └────────────────────────────────────┘
```

> **Current model — `.claude/decisions.md` #12 (2026-05-29), which reverses #7.**
> The token artifacts are served **live from Supabase Storage**: the CMS
> `POST /design-tokens/publish` regenerates `bootstrap.css` / `breakpoints.js` /
> `tokens-*.md` in Storage from KV on every Publish **and automatically after any
> token-slot KV write** (decision #14 — `maybeAutoPublishTokens` in the edge
> function), and `llms.txt` points AI agents straight at those Storage URLs — so
> a token edit (CMS Save *or* `PUT /state/*`) reaches agents + prototypes within
> seconds, no rebuild and no separate Publish click. The manual Publish endpoint
> remains as a force-refresh. The diagram above is now accurate again
> (Storage = canonical for agents). **Egress trade-off:** consumers behind an
> allowlist that excludes `*.supabase.co` won't load tokens (accepted; see #12).

**`bootstrap.css` is produced two ways, both from the same KV → `buildBootstrapCss`:**
1. **CMS publish** (canonical for consumers) — `POST /design-tokens/publish` reads KV, regenerates `bootstrap.css` + `breakpoints.js` + `tokens-*.md`, writes them to Supabase Storage. This is what `llms.txt` points agents at and what the `bootstrap.css` shim forwards to. Triggered **automatically on any token-slot save** (`PUT /state/{colorTokens,sizeTokens,breakpointTokens,fontTokens,tokenDocs}` → `maybeAutoPublishTokens`, decision #14, best-effort) as well as by the manual Publish button.
2. **Prebuild** (`scripts/generate-llms-txt.mjs`) — in **production** emits a 1-line `@import` shim at `design-system.arcsite.com/tokens/bootstrap.css` forwarding to the Storage copy (stable-URL back-compat); in **dev** emits the full inlined stylesheet from repo `tokens/*.json` for offline work. The byte-identical parity test pins the inlined path against the CMS round-trip.

Both paths share the same flatten + buildBootstrapCss functions in `supabase/functions/_shared/token-generators.mjs`. CI (`test-bootstrap-parity.yml`) diffs the two outputs byte-by-byte and fails the PR if they disagree. This was the cure for the May 14 2026 `flattenFont` scope bug.

### 3b. Article HTML — editor in CMS

Two write paths converge on the same KV row.

```
   PATH A — human edits in the CMS rich-text editor
   ─────────────────────────────────────────────────

   ┌──────────┐   types in WYSIWYG    ┌────────────────────┐
   │  Editor  │ ───────────────────► │ CMS rich-text editor│
   └──────────┘                      └──────────┬──────────┘
                                                │ on save
                                                ▼
                                     PUT /state/homeArticle
                                     PUT /state/iconologyArticle


   PATH B — agent writes directly via API
   ─────────────────────────────────────────────────

   ┌──────────┐                       ┌────────────────────────┐
   │  Agent   │ ──curl PUT JSON──►   │ Edge func /state/:key  │
   └──────────┘                       └──────────┬─────────────┘
                                                 │
                                                 ▼
                                  Supabase KV (same row as Path A)
```

On save, the edge function does two side-effects:
- Strips inline base64 images out of the HTML, uploads them once (SHA-256 dedup) to `pattern-assets/_inline/<articleKey>/<hash>.<ext>`, and rewrites the HTML to reference the public URL.
- Snapshots the previous version into `articleVersions` (capped at 5 per key).

### 3c. Pattern articles — HTML + MD + assets

Patterns are the only thing in the CMS with **both** an HTML rendering and a canonical MD version. Plus per-pattern image assets.

```
   PATH A — human edits in the CMS pattern editor (HTML-first)
   ────────────────────────────────────────────────────────────────

   ┌──────────┐   types in WYSIWYG    ┌──────────────────────┐
   │  Editor  │ ───────────────────► │ CMS pattern editor   │
   └──────────┘                      │ /cms/patterns/:id    │
                                     └──────────┬───────────┘
                                                │ on save
                                                ▼
                                     HTML → MD conversion (Turndown)
                                                │
                                                ▼
                            PUT /state/patterns
                            ┌──────────────────────────────────┐
                            │ Supabase KV                      │
                            │ patterns[i].content        (HTML)│
                            │ patterns[i].markdownContent (MD) │
                            │ patterns[i].htmlUpdatedAt        │
                            │ patterns[i].markdownUpdatedAt    │
                            └──────────────────────────────────┘
                                                │
                              same inline-image stripping as 3b:
                              base64 → pattern-assets/_inline/...


   PATH B — agent uploads a bundle (MD-first, with assets)
   ────────────────────────────────────────────────────────────────

   ┌──────────┐                     ┌───────────────────────────────┐
   │  Agent   │ ─multipart zip────►│ POST /patterns/:slug/bundle   │
   │  or      │  (1 .md + N imgs)   │ Edge function:                │
   │  Editor  │                     │  • parses zip                 │
   └──────────┘                     │  • validates every ![](path)  │
                                     │    has a matching file       │
                                     │  • uploads each asset to     │
                                     │    pattern-assets/<slug>/... │
                                     │  • stores MD in              │
                                     │    patterns[i].markdownContent│
                                     │  • cleans up orphan assets   │
                                     │    from the previous bundle  │
                                     └──────────────┬───────────────┘
                                                    │
                            ┌───────────────────────┴────────────────────┐
                            ▼                                            ▼
            ┌──────────────────────────┐         ┌──────────────────────────────┐
            │ Supabase KV              │         │ Supabase Storage             │
            │ patterns[i].md updated   │         │ /pattern-assets/<slug>/      │
            │ (HTML left as-is from    │         │   img1.png                   │
            │  Path A — drift OK,      │         │   img2.png                   │
            │  timestamps say which is │         │   _inline/<key>/<sha>.png    │
            │  newer)                  │         │                              │
            └──────────────────────────┘         └──────────────────────────────┘
```

**Drift protocol**: HTML and MD versions can disagree if Paths A and B both write. The browser picks whichever has the more recent timestamp (`htmlUpdatedAt` vs `markdownUpdatedAt`) when rendering. AI agents always fetch the MD via `GET /patterns/:slug.md`, so they see the canonical version regardless of which path edited it last.

### 3d. Token reference docs — MD-canonical (no HTML twin)

The `/color`, `/size`, `/typography` pages render Markdown files, not an HTML article from KV. There is no `colorArticle` / `sizeArticle` / `typographyArticle` slot — those were removed in the post-PR-1 cleanup as dead code.

```
   TODAY (build-time, repo-canonical)
   ───────────────────────────────────

   ┌──────────┐                          tokens/tokens-color.md
   │  Author  │ ─── edits MD in repo ─►  tokens/tokens-size-space.md
   └──────────┘   (or via PR)            tokens/tokens-typography.md
                                                  │
                                                  │ build-time import
                                                  │ via `?raw` in Vite
                                                  ▼
                              ┌──────────────────────────────┐
                              │ Public page renders content  │
                              │ via <MarkdownRenderer/>      │
                              │   /color  /size  /typography │
                              └──────────────────────────────┘


   OPTION B (CMS-driven, live)
   ───────────────────────────────────

   ┌──────────┐   edits MD  ┌─────────────────────────┐
   │  Editor  │ ──────────► │ CMS Markdown editor     │
   └──────────┘             └────────────┬────────────┘
                                         │
   ┌──────────┐    PUT MD                │
   │  Agent   │ ─────────────────────────┤
   └──────────┘                          │
                                         ▼
                          ┌──────────────────────────────────┐
                          │ Supabase KV                      │
                          │   tokens-color.md         (MD)   │
                          │   tokens-size-space.md    (MD)   │
                          │   tokens-typography.md    (MD)   │
                          └──────────────┬───────────────────┘
                                         │ on publish, mirrored to:
                                         ▼
                          ┌──────────────────────────────────┐
                          │ Supabase Storage /design-tokens/ │
                          │   tokens-*.md  (canonical URL    │
                          │                 for agents +     │
                          │                 public page)     │
                          └──────────────────────────────────┘
```

**Why MD-only and not HTML-twin like patterns**: the content (prose + tables + code) is Markdown-native and round-trips losslessly. There's no design-heavy layout an HTML editor would express that MD can't. Storing an HTML duplicate would be carrying a derived format with no information gain — drift risk for free.

### 3e. Icons — KV-canonical, served live from the edge function

Icons are **served live to agents from the edge function** (decision #13),
reading the `icons` KV slot on demand — the same model patterns use for their
`.md`. They are *also* materialized into many small static files at build time,
which now serve only as offline/back-compat copies.

```
   LIVE PATH (canonical for AI agents — decision #13)
   ────────────────────────────────────────────────────

  ┌──────────┐  upload via /cms/icon-editor   ┌──────────────────────────┐
  │ Designer │ ─────────────────────────────► │ Supabase KV  state.icons │
  └──────────┘   addIcon / updateIcon → KV    └────────────┬─────────────┘
                 (no publish step; /iconology              │
                  already renders this live)               │ kv.get on each request
                                                            ▼
                              ┌──────────────────────────────────────────┐
                              │ Edge fn make-server-067f252d:            │
                              │   GET /icons.index.json   (slim manifest)│
                              │   GET /icons.json         (full + SVG)   │
                              │   GET /icons/:fileName    (one raw SVG)  │
                              │ Built via shared buildIconManifests();   │
                              │ Cache-Control: public, max-age=60.       │
                              └──────────────────────┬───────────────────┘
                                                     │ llms.txt points agents here
                                                     ▼
                                     reachable within ~60s of upload,
                                     no rebuild, no publish click


   BUILD-TIME SNAPSHOT (offline + back-compat for design-system.arcsite.com/icons*)
   ────────────────────────────────────────────────────────────────────────────────

```
  ┌──────────┐  upload via /cms/icon-editor   ┌──────────────────────────┐
  │ Designer │ ─────────────────────────────► │ Supabase KV              │
  └──────────┘                                │   state.icons[]          │
                                              │   (name, tags, svgBytes) │
                                              └────────────┬─────────────┘
                                                           │
                            predev / prebuild              │ HTTPS fetch
                            ◄──────────────────────────────┘
                            │
                            ▼
            scripts/generate-icons-json.mjs
            │
            ├─► public/icons.json         (full, with embedded SVG bytes)
            └─► public/icons.index.json   (slim search manifest, no bytes)
                            │
                            ▼
            scripts/generate-icon-files.mjs
            │
            ├─► wipes public/icons/    (rmSync — removes deleted icons)
            └─► writes public/icons/<fileName>.svg   (one file per icon)

            ▼
            vite build → dist/  → GH Pages
```

**Shared builder (parity contract):** both the live edge routes and the
build-time `scripts/generate-icons-json.mjs` construct their manifests through
`supabase/functions/_shared/icon-manifest.mjs` (`buildIconManifests` +
`sanitizeIconFileName`), so the live JSON is byte-identical to the static
`public/icons*.json` for the same KV input — the same shared-module pattern
`_shared/token-generators.mjs` gives the token pipeline. `generate-icon-files.mjs`
imports the same `sanitizeIconFileName`, so there is exactly one sanitizer.

**`public/icons/`, `public/icons.json`, `public/icons.index.json` are gitignored** as of PR #50 — they're pure build artifacts regenerated from Supabase on every `npm run dev` and every `npm run build` (which runs in CI before deploy). Don't try to edit them by hand or commit a snapshot — the next `predev` will wipe `public/icons/` (see `rmSync` in `generate-icon-files.mjs`) and any edit will be lost. **Since decision #13 these static files are only a back-compat/offline snapshot** — agents read the live edge URLs, which `llms.txt` points at.

**Offline behavior**: if Supabase is unreachable when the build script runs, both JSONs are written as stub manifests (`status: "error"`) and individual SVG files aren't generated. The vite build doesn't fail — the *static* icons are simply missing on the deployed site for that build. (The live edge routes are unaffected — they read KV at request time.) Production fixes itself on the next successful build.

**Drift risk** (resolved): before PR #50, the in-repo snapshot of `public/icons/` could drift whenever a designer uploaded a new icon via the CMS and nobody manually re-committed the regenerated bundle. PR #50 gitignored them; decision #13 then made the **agent-facing copy live from KV**, so the static-snapshot lag no longer affects agents at all (only the rarely-hit stable `design-system.arcsite.com/icons*` URLs, which are back-compat). This is the icon analogue of the token-MD drift row — agents fetch the live source, not the materialized snapshot.

**Doc vs. library (route split):** the icon *data* above is unchanged, but the `/iconology` route now renders the **naming/sizing spec** (Markdown, `tokenDocs.iconology`), and the searchable **icon browser grid** moved to `/iconology/library`. `llms.txt` reflects this: the "Visual browser" link is now `/iconology/library`, and it also links the spec at `<Storage>/iconology.md`. The machine endpoints (`/icons.index.json`, `/icons.json`, `/icons/:fileName`) are untouched — the split is UI-only and does not affect agent icon retrieval. **Size-suffix convention (agent-facing contract):** icon names are `{height}x{width}` (height-first); this is documented identically in `iconology.md` and in the `llms.txt` Icons section — keep the two in step.

---

## 4. Reading data

### 4a. AI agent — via the arcsite-ds-apply skill

```
                          Skill instruction:
                          "Fetch llms.txt to start"
                                      │
                                      ▼
                ┌─────────────────────────────────────────┐
                │ https://design-system.arcsite.com/      │
                │                           llms.txt      │  ← Amplify,
                │                                         │     stable URL
                │ ## Bootstrap                            │
                │   <link href="…arcsite.com/.../         │
                │           bootstrap.css">               │  ← 1-line shim
                │                                         │     forwards to
                │ ## Token values (live)                  │     Supabase Storage
                │ - Tokens CSS:  https://<sb>/…/          │
                │              bootstrap.css              │  ← agent fetches if
                │ - Breakpoints: https://<sb>/…/          │     it needs values
                │              breakpoints.js             │
                │                                         │
                │ ## Documentation                        │
                │ - /tokens/tokens-color.md               │  ← from Storage (live)
                │ - /tokens/tokens-size-space.md          │
                │ - /tokens/tokens-typography.md          │
                │                                         │
                │ ## Patterns                             │
                │ - /patterns/<slug>.md                   │  ← from edge function
                │ - /patterns/<slug>.md                   │     /patterns/:slug.md
                │                                         │     which reads from
                │ ## Design principles                    │     KV.markdownContent
                │ ...static text inside llms.txt...       │
                │                                         │
                │ ## Icons (live)                         │
                │ - Edge /icons.index.json   (pick)       │  ← from edge function
                │ - Edge /icons/{fileName}   (one SVG)    │     reads KV.icons live
                │ - Edge /icons.json         (full)       │     (decision #13)
                │                                         │
                │ ## logos / skills                       │
                │ ...stable URLs to GH Pages assets...    │
                └─────────────────────┬───────────────────┘
                                      │ agent follows URLs as needed
                                      ▼
        ┌─────────────────────────────────────────────────────────────┐
        │ Supabase                                                    │
        │                                                             │
        │ Storage /design-tokens/   ◄── token CSS, JS, MD docs        │
        │ Storage /pattern-assets/  ◄── pattern images (in MD ![]() ) │
        │ Edge /patterns/:slug.md   ◄── canonical pattern MD          │
        │ Edge /icons*.json,        ◄── icon manifests + per-icon SVG │
        │      /icons/:fileName          built live from KV.icons     │
        └─────────────────────────────────────────────────────────────┘
```

Key property: `llms.txt` is the **index**. Token values are NOT duplicated inline. Agents that only need names + principles read `llms.txt` and stop; agents that need numeric values follow the URLs.

### 4b. Dev team — three download patterns

```
   PATTERN A — "give me the latest" (stable URL, always fresh)
   ─────────────────────────────────────────────────────────────
   Dev's CI / build script:

      curl -O https://<projectId>.supabase.co/storage/v1/object/public/
                 design-tokens/bootstrap.css

   ──► fetches whatever the CMS most recently published.
       No pin, always latest. URL never changes.


   PATTERN B — "give me a one-shot zip" (existing flow, unchanged)
   ─────────────────────────────────────────────────────────────
   Designer in CMS:

      [Export CSS VAR (.zip)]   ◄── existing button, still works

   ──► generates the zip client-side, browser downloads it.
       Designer drags it into Slack / email to the dev team.
       (The publish flow also writes a similar artifact to Storage,
        so devs can curl it directly via Pattern A — choose either.)


   PATTERN C — "give me a specific version" (Supabase versioning)
   ─────────────────────────────────────────────────────────────
   Enable Supabase Storage bucket versioning. Each PUT keeps
   prior versions. Devs can pin to a published date for
   reproducibility. Not enabled by default — switch on per bucket.
```

### 4c. Public website — `design-system.arcsite.com`

```
   Browser navigates to /size or /color or /patterns/<slug>
                                      │
                                      ▼
   ┌──────────────────────────────────────────────────────────────┐
   │ React SPA (loaded from AWS Amplify)                          │
   │                                                              │
   │ DataProvider boots:                                          │
   │   1. Reads cached state from localStorage (instant paint)    │
   │   2. Fetches GET /state from Supabase edge function          │
   │   3. Merges server data, re-renders                          │
   │                                                              │
   │ Token JSON imports at build time still happen for the        │
   │ /size/tokens page (read from tokens/size/*.json in repo).    │
   │ These are the seed copies — kept aligned via the CMS         │
   │ Export button's zip download, periodically committed.        │
   └──────────────────────────────────────────────────────────────┘
```

The public website is a third reader. In **production builds**, `public/tokens/bootstrap.css` is a 1-line `@import` shim forwarding to Supabase Storage — so the file content tracks whatever the CMS most recently published. In **dev builds**, it's the inlined version generated by `scripts/generate-llms-txt.mjs` from `tokens/*.json` (so local dev works without a network round-trip). The public token reference pages (`/color/tokens`, `/size/tokens`, etc.) read KV directly via `useAppData()` since PR #32, falling back to bundled JSON only when KV is empty or carries the placeholder seed.

---

## 5. Master diagram

```
                ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                │  Designer   │  │   Editor    │  │   Agent     │
                │  (uploads   │  │ (rich-text  │  │  (writes    │
                │   JSON)     │  │  HTML, MD,  │  │ via REST)   │
                │             │  │  bundles)   │  │             │
                └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
                       │                │                │
                       └────────────────┼────────────────┘
                                        │
                                        ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                       SUPABASE                               │
        │                                                              │
        │  KV /state/:key   (raw, edit-friendly)                       │
        │  ┌──────────────────────────────────────────────────┐        │
        │  │ Tokens:    sizeTokens / colorTokens /            │        │
        │  │            fontTokens / breakpointTokens         │        │
        │  │ Status:    tokenStatus (mtime + publishedAt)     │        │
        │  │ Articles:  homeArticle / iconologyArticle (HTML) │        │
        │  │ Token MD:  tokenDocs.{color,size,typography}     │        │
        │  │ Patterns:  patterns[] — each has HTML + MD       │        │
        │  │ Other:     icons / changeLogs / editors          │        │
        │  └─────────────────────┬────────────────────────────┘        │
        │                        │ on Publish click /                  │
        │                        │ on bundle upload                    │
        │                        ▼                                     │
        │  Storage  (generated, read-only, stable URLs)                │
        │  ┌──────────────────────────────────────────────────┐        │
        │  │ design-tokens/   bootstrap.css                   │        │
        │  │                  breakpoints.js                  │        │
        │  │                  {size,color,font}-tokens.zip    │        │
        │  │                  tokens-*.md                     │        │
        │  │                                                  │        │
        │  │ pattern-assets/  <slug>/*.png / *.jpg / *.svg    │        │
        │  │                  _inline/<key>/<sha>.<ext>       │        │
        │  └──────────────────────────────────────────────────┘        │
        └────────────────────────┬─────────────────────────────────────┘
                                 │
        ┌────────────────────────┼─────────────────────────────────────┐
        │                        │                                     │
        ▼                        ▼                                     ▼
 ┌──────────────┐         ┌──────────────┐                  ┌──────────────────┐
 │  AI agents   │         │  Dev team    │                  │  Public website  │
 │              │         │              │                  │   (GH Pages)     │
 │ Fetch        │         │ curl URL,    │                  │                  │
 │ llms.txt     │         │ or download  │                  │ React SPA reads  │
 │ (GH Pages)   │         │ zip from CMS │                  │ Supabase KV at   │
 │ → follow     │         │              │                  │ runtime;         │
 │   URLs to    │         │              │                  │ bootstrap.css    │
 │   Supabase   │         │              │                  │ @imports from    │
 │              │         │              │                  │ Supabase Storage │
 └──────────────┘         └──────────────┘                  └──────────────────┘

 GH Pages hosts only: llms.txt + a 1-line bootstrap.css shim + index.html + JS bundle.
 Everything that changes when a designer publishes lives in Supabase.
```

---

## 6. Reference table — where every artifact lives

| Artifact | Write location | Read location | Format | Who reads it |
|---|---|---|---|---|
| Color tokens (raw) | Supabase KV `colorTokens` | CMS preview | JSON | Designer in CMS |
| Size tokens (raw) | Supabase KV `sizeTokens` | CMS preview | JSON | Designer in CMS |
| Font tokens (raw) | Supabase KV `fontTokens` | CMS preview | JSON | Designer in CMS |
| Breakpoint tokens (raw) | Supabase KV `breakpointTokens` | CMS preview | JSON | Designer in CMS |
| bootstrap.css (generated) | Storage `/design-tokens/bootstrap.css` | Stable URL | CSS | Prototypes, dev team, AI agents |
| breakpoints.js (generated) | Storage `/design-tokens/breakpoints.js` | Stable URL | ES module | JS consumers, Tailwind config |
| Token zips (generated) | Storage `/design-tokens/*-tokens.zip` + on-demand client download | Stable URL or CMS button | ZIP | Dev team (handoff) |
| Home article | Supabase KV `homeArticle` | Public website at runtime | HTML | Visitors to `/` |
| Reference docs (color/size/typography/iconology) | **Canonical:** Supabase KV `tokenDocs` → Storage mirror on save (auto-publish, decision #14). Repo `tokens/tokens-*.md` + `tokens/iconology.md` are seeds only. | `llms.txt` points to Storage URLs (canonical for AI agents: `tokens-*.md`, `iconology.md`). Public pages render via the runtime React route. | Markdown | Visitors to `/color`, `/size`, `/typography`, `/iconology`; AI agents |
| Pattern HTML body | Supabase KV `patterns[i].content` | Public website at runtime | HTML | Visitors to `/patterns/<slug>` |
| Pattern MD canonical | Supabase KV `patterns[i].markdownContent` | Edge fn `GET /patterns/:slug.md` | Markdown | AI agents |
| Pattern image assets | Storage `/pattern-assets/<slug>/*` | Stable URL referenced from MD/HTML | PNG/JPG/SVG | Both website + agents |
| Inline article images | Storage `/pattern-assets/_inline/<key>/<sha>.<ext>` | Stable URL referenced from HTML | PNG/JPG/SVG | Visitors |
| llms.txt index | Built from repo template, hosted on GH Pages | Stable GH Pages URL | Plain text | AI agents (entry point) |
| Icon library (manifests + per-icon SVG) | **Canonical:** Supabase KV `icons`. | **Live:** edge fn `GET /icons.index.json`, `/icons.json`, `/icons/:fileName` (what `llms.txt` points agents at, decision #13). Static `design-system.arcsite.com/icons*` are a gitignored build snapshot, back-compat only. | JSON + SVG | AI agents, prototypes |
| Design principles, logos | Inside llms.txt (committed in repo) | Stable GH Pages URL | Plain text + SVG | AI agents |

---

## 7. Operational notes

- **Single source of truth for tokens**: `bootstrap.css` in Supabase Storage is the canonical public copy of token values. `llms.txt` does not carry inline `:root { … }` blocks — it only points to where the values live.
- **GH Pages URL stability**: by serving a 1-line `@import` shim from GH Pages at the historical `bootstrap.css` URL, no existing prototype needs to be edited when we move the actual content to Supabase.
- **Breakpoints duplication is intentional**: same data appears as CSS vars in `bootstrap.css` and as raw numbers in `breakpoints.js` because CSS custom properties don't work inside `@media` query conditions. Both files come from the same JSON, regenerated together.
- **Pattern HTML/MD drift**: the editor stores HTML; the bundle uploader stores MD. Timestamps decide the winner on render. AI agents always read MD via the `.md` endpoint regardless of which path edited last.
- **Inline image handling**: any HTML save (article or pattern) extracts base64 images, uploads once (SHA-256 dedup), and rewrites the HTML to reference Storage URLs. This keeps KV rows small and assets cacheable.
- **Version history**: KV writes snapshot the prior version (capped at 5 per key). Storage bucket versioning is off by default; enable per bucket if you need point-in-time pinning.

## 8. Resolved questions + remaining open ones

### Resolved (kept for historical context)

1. ~~**Token MD docs source**~~ — **Resolved**: canonical is KV `tokenDocs`, written by the CMS Markdown editor (or curl) and mirrored to Supabase Storage on Publish. Repo `tokens/*.md` is a seed only. This was confirmed the hard way by the May 14 2026 drift bug — see project memory `project_token_md_docs_canonical_is_kv.md`.
2. ~~**Font token uploader scope**~~ — **Resolved**: font CMS editor exists at `/cms/font-editor` parallel to size + color. Group A (PR #29) ensured the font parser preserves all `com.figma.scopes` hints, not just the first.
3. ~~**What happens to `tokens/*.json` in the repo after Option B?**~~ — **Resolved**: option (a) — kept as a seed for fresh installs and as a fixture for the byte-identical parity test. They are not the canonical for live consumers; they're snapshotted when desirable but never load-bearing.

### Still open

1. **`bootstrap.css` shim cache headers** — GH Pages caches the shim file for ~10 minutes by default. The `@import` URL inside the shim respects whatever cache headers Supabase Storage sets. Worst-case staleness ≈ GH Pages cache TTL. Designers can hard-reload to bypass. Not blocking but worth confirming if a designer ever reports "I published but my prototype still shows old values after 10+ minutes."
2. **Repo `tokens/tokens-*.md` ↔ KV `tokenDocs` parity check** — no automated diff between the seed and the canonical. The May 14 trap could happen again if someone PR-merges to the repo file and forgets the KV path. Possible CI: on push to main, fetch Storage MD and diff against repo MD; fail if they diverge for more than N commits.
3. **Storage bucket versioning** — off by default. Enable per bucket if we want point-in-time pinning for designers / dev teams who need reproducibility.

---

*Last meaningfully revised on 2026-05-14 after the Group A–F + drift-guards bug chain (PRs #29–#43). Update this file whenever a data-write or data-read flow changes — the docs-drift CI check will warn on PRs that miss it.*
