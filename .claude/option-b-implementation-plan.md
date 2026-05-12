# Option B — CMS-driven publish to Supabase Storage

> **Read this first when starting work on Option B.** Self-contained handoff doc — designed to be picked up by a fresh agent session without re-reading prior conversation history. Update this file as the work progresses.

## 1. What's done already (don't redo)

Merged to `main`:

- **PR #22** — Web Tablet + Web Desktop Large size modes + Breakpoints collection (size scale extended from 4 to 6 modes; new `breakpoint` Figma collection; `bootstrap.css` now emits mobile-first cascade with `@media` overrides at 768/1200/1400; new `public/tokens/breakpoints.js` for JS consumers)

Pending merge to `main` (see §10 — prerequisite for Option B):

- **PR #23 (re-targeting)** — Remove obsolete `sizeArticle` / `colorArticle` / `typographyArticle` HTML paths. The `/size`, `/color`, `/typography` pages render Markdown from `tokens/*.md` (via Vite `?raw` import) — the HTML article slots in Supabase KV were dead code. PR 23 was merged into Part 1's branch instead of `main`, needs to be re-PR'd.

Reference docs in repo:

- [.claude/cms-architecture.md](.claude/cms-architecture.md) — full data-flow architecture (current state + planned Option B state). **Read this first.** Once PR 23 is on main this file will be there. If not yet, it lives on the `claude/part-3-cleanup-obsolete-article-paths` branch.

## 2. Goal of Option B

CMS upload should ship live, end-to-end, without a git commit:

```
Designer uploads JSON in CMS  →  Supabase KV stores raw data
                              →  CMS regenerates bootstrap.css /
                                 breakpoints.js / *-tokens.zip
                              →  Posted to Supabase Storage
                              →  Public consumers see new tokens
                                 within seconds
```

Single source of truth: Supabase. The repo's `tokens/*.json` files become seed-only (for fresh installs and local dev).

## 3. Locked decisions

| Decision | Value | Rationale |
|---|---|---|
| MD reference docs location | Supabase KV with an MD editor in CMS | Single source of truth, agent-friendly, eliminates the dual-edit drift risk. |
| Supabase Storage bucket name | `design-tokens` | Public read, separate from `pattern-assets` |
| Storage versioning | Enabled | Mirrors how other articles already version. Lets devs pin to a specific publish date if needed. |
| `bootstrap.css` URL | Stays at `arctuition.github.io/design-system/tokens/bootstrap.css` via 1-line `@import` shim | Existing prototypes don't change |
| `breakpoints.js` URL | Migrates to Supabase | `@import` doesn't work for JS, so no choice. Update CLAUDE.md / docs. |
| `llms.txt` URL | Stays on GH Pages | Still works. Drop the ~550 lines of inline token blocks — replace with pointers to Supabase. |
| Single bootstrap.css | Contains color + size + font + breakpoint vars combined (today's structure) | Don't split into `typography.css` — one `<link>` for prototypes |
| Per-family `.zip` downloads | Still produced, also posted to Storage | Designer can hand off via CMS button OR dev team can curl |

## 4. Architecture in one diagram

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Designer    │  │ Editor      │  │ Agent       │
│ (uploads    │  │ (writes MD/ │  │ (writes via │
│  JSON)      │  │  HTML)      │  │  REST API)  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
   ┌──────────────────────────────────────────┐
   │            SUPABASE                       │
   │                                           │
   │  KV  /state/:key                          │
   │  ┌─────────────────────────────────┐     │
   │  │ Tokens:    color/size/font/      │     │  raw data,
   │  │            breakpoint             │     │  editable
   │  │ Articles:  home / iconology      │     │
   │  │ MD docs:   tokens-*.md  NEW      │     │
   │  │ Patterns:  patterns[]            │     │
   │  └────────────────┬────────────────┘     │
   │            on Publish                     │
   │                  ▼                        │
   │  Storage  /design-tokens/                 │
   │  ┌─────────────────────────────────┐     │  generated,
   │  │ bootstrap.css                    │     │  read-only,
   │  │ breakpoints.js                   │     │  stable URLs
   │  │ {size,color,font}-tokens.zip     │     │
   │  │ tokens-*.md                      │     │
   │  └─────────────────────────────────┘     │
   │                                           │
   │  Storage  /pattern-assets/  (existing)    │
   └──────────────────────┬───────────────────┘
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
 ┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
 │ AI agents    │ │ Dev team     │  │ Public website   │
 │ → llms.txt   │ │ → curl URL,  │  │ → bootstrap.css  │
 │   (GH Pages) │ │   download   │  │   @import shim   │
 │   then URLs  │ │   zip        │  │   → Supabase     │
 └──────────────┘ └──────────────┘  └──────────────────┘

GH Pages still hosts: llms.txt + 1-line bootstrap.css shim + index.html + bundle.
Everything that changes on publish lives in Supabase.
```

## 5. Implementation plan — sequenced steps

Estimated total: **6–8 hours focused work**. Each step is independently shippable.

### Step A — Font-token CMS uploader (prerequisite)

Today there's NO font-token CMS uploader. Color + size + breakpoint have one each; fonts only have build-time JSON imports. Build the missing piece.

**Files to create:**

- `src/app/pages/cms/FontTokensEditor.tsx` — clone of [SizeTokensEditor](src/app/pages/cms/SizeTokensEditor.tsx) (simpler: fonts don't have a breakpoint sibling, just 4 mode files like web-mobile / web-desktop / device-mobile / device-tablet)
- `src/app/components/shared/font-token-cms-utils.ts` (or extend the existing [font-token-utils.ts](src/app/components/shared/font-token-utils.ts)) — needs `EXPECTED_FILES`, `matchFileToSlot`, `analyzeBulkFiles`, `MODE_HEADERS`, `MODE_FILENAMES`, `exportFontCSSAsZip` (mirror what [size-token-utils.ts](src/app/components/shared/size-token-utils.ts) does)

**Files to modify:**

- `src/app/store/data-store.tsx`:
  - Add `FontToken` interface (probably identical to `SizeToken`: `{ name, value, aliasOf? }`)
  - Add `FontTokenSet { deviceMobile, deviceTablet, webMobile, webDesktop }` (no global, no breakpoints — fonts don't have those)
  - Add `fontTokens: FontTokenSet` to `AppState`
  - Add `setFontTokens` to `AppContextType`
  - Add `defaultFontTokens` const, plumb through `getDefaults`, `buildStateFromServer`, `seedDefaults`, both stateKeyMaps, minimal-payload, safe-loading stub
- `src/app/routes.ts`: add `cms/font-editor` route
- `src/app/pages/cms/CMSDashboard.tsx`: add Font Tokens card
- `supabase/functions/make-server-067f252d/index.ts`: add `fontTokens` to `STATE_KEYS`

**Verification:** Upload 4 font JSON files in CMS; see them in preview; the underlying [tokens/font/*.json](tokens/font/) imports continue to work (don't touch the build-time read path yet).

**Estimated: 2 hours.**

### Step B — Shared token-generation module

`scripts/generate-llms-txt.mjs` has pure flattening logic (`flattenColor`, `flattenSize`, `flattenFont`) that Option B needs to run in the browser too. Port to a shared module.

**Create:**

- `src/app/lib/token-generators.ts` — pure functions, no Node deps:
  - `flattenColor(json)` → `{ cssVar, displayValue }[]`
  - `flattenSize(json)` → `{ cssVar, displayValue }[]`
  - `flattenFont(json)` → `{ cssVar, value }[]`
  - `flattenBreakpoint(json)` → `{ cssVar, displayValue }[]`
  - `buildBootstrapCss(allTokens)` → full bootstrap.css string with mobile-first cascade
  - `buildBreakpointsJs(breakpointPx)` → ES module string
  - `buildLlmsTxt(template, ...)` → llms.txt string (after step E)

**Modify:**

- `scripts/generate-llms-txt.mjs` — replace inline implementations with imports from the shared module (use a small `.cjs` shim if ESM/CJS interop is awkward).

**Why:** Server-side build script and client-side CMS publish flow MUST produce byte-identical output. Single function eliminates drift.

**Verification:** `node scripts/generate-llms-txt.mjs` produces the same `bootstrap.css` as before (byte-diff). Add a quick unit test if you want.

**Estimated: 1 hour.**

### Step C — Supabase Storage bucket setup

**Supabase dashboard:**

1. Create bucket `design-tokens`, public read.
2. Enable bucket versioning.
3. Add CORS allow-all (already used for pattern-assets — copy that config).

**Edge function** ([supabase/functions/make-server-067f252d/index.ts](supabase/functions/make-server-067f252d/index.ts)):

- Add `ensureBucket("design-tokens")` to the boot path (mirror what `pattern-assets` already does).
- Add a `POST /design-tokens/publish` endpoint that:
  - Reads `colorTokens`, `sizeTokens`, `fontTokens`, `breakpointTokens` from KV
  - Calls the shared module's `buildBootstrapCss`, `buildBreakpointsJs`, etc.
  - Uploads each artifact to `/storage/v1/object/public/design-tokens/<filename>`
  - Returns success + URLs for each artifact

**Why edge function instead of client-side upload?** Two reasons: (a) authoritative regeneration server-side prevents "an editor with a stale browser ships old tokens", and (b) Storage write permissions are simpler at the edge function (service role) than from the browser.

**Verification:** `curl -X POST $URL/design-tokens/publish` writes a file to `/storage/.../design-tokens/bootstrap.css` matching the build script's output.

**Estimated: 2 hours.**

### Step D — Publish button in CMS

Add a "Publish" button to each token editor (`/cms/color-editor`, `/cms/size-editor`, `/cms/font-editor`) and to the `CMSDashboard` as a global action.

**UX:**

- Button labeled "Publish to Production"
- Confirmation dialog showing what will be regenerated (bootstrap.css, breakpoints.js, .zips)
- Calls `POST /design-tokens/publish`
- Success toast with the URL: "Published. View at https://<sb>.../design-tokens/bootstrap.css"
- Error toast on failure (network, server error)

**Files:**

- `src/app/store/api.ts` — add `publishDesignTokens(): Promise<{urls: Record<string, string>}>`
- `src/app/pages/cms/SizeTokensEditor.tsx`, `ColorTokensEditor.tsx`, `FontTokensEditor.tsx` — add Publish button + dialog

**Optional polish:** Add a "Last published: 2 minutes ago" indicator using the Storage object's `lastModified` header.

**Estimated: 1.5 hours.**

### Step E — GH Pages `bootstrap.css` shim

Make the canonical `bootstrap.css` URL transparently forward to Supabase.

**Modify:**

- [scripts/generate-llms-txt.mjs](scripts/generate-llms-txt.mjs) — change the `bootstrap.css` writer to emit:

```css
/* Arcsite design system — token bootstrap (shim).
 *
 * This GitHub Pages copy is a 1-line forward to the live Supabase Storage
 * version, which the CMS regenerates and publishes on every token upload.
 * Prototypes that hardcode the historical URL keep working unchanged.
 *
 * To pin to a specific published version, fetch the Supabase URL directly:
 * https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/bootstrap.css
 */

@import url("https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/bootstrap.css");
```

The full bootstrap.css content NO LONGER lives on GH Pages — the build-time generation can be reduced to emitting just this shim. Or generate the full version locally (for `npm run dev`) but only emit the shim in production builds. Decide based on dev UX preference.

**Cache concern:** GH Pages caches files for ~10 minutes by default. The `@import` will respect that cache. To make live publishes propagate faster, set `Cache-Control: max-age=60` headers on the Supabase Storage object (and on the GH Pages shim if possible). Verify cache behavior in a fresh browser after a publish.

**Estimated: 30 minutes.**

### Step F — `llms.txt` slim-down

Drop the ~550 lines of inline token blocks (color/size/font/breakpoint `:root { … }` sections). Replace with a short pointer section.

**Modify** [scripts/generate-llms-txt.mjs](scripts/generate-llms-txt.mjs) template:

Replace the existing color/typography/size/breakpoint sections with:

```markdown
## Token values — fetch live from Supabase

All token CSS-variable definitions live in the published stylesheet, regenerated by the CMS on every token upload. Don't paste numeric values inline; reference by token name and import the stylesheet:

- **Tokens CSS (color + size + font + breakpoint vars, mobile-first):**
  https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/bootstrap.css

- **Breakpoints as JS object (for matchMedia / Tailwind config / container queries):**
  https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/breakpoints.js

- **Token reference docs (Markdown):**
  - https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/tokens-color.md
  - https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/tokens-size-space.md
  - https://<projectId>.supabase.co/storage/v1/object/public/design-tokens/tokens-typography.md

The size cascade is mobile-first: defaults are Web Mobile, with `@media (min-width: 768/1200/1400px)` overrides for Web Tablet / Web Desktop / Web Desktop Large. Parse `bootstrap.css` directly for full values.
```

**Estimated: 30 minutes.**

### Step G — MD docs migration (KV + editor)

Per locked decisions, `tokens-color.md` / `tokens-size-space.md` / `tokens-typography.md` move to Supabase KV with an MD editor in CMS.

**G1 — KV slots:**

- `data-store.tsx`: add `tokenDocs: { color: string; size: string; typography: string }` to `AppState`, with setters. Seed from the current repo files on first install.
- Edge function: add `tokenDocs` to `STATE_KEYS`. No HTML stripping needed (it's MD).

**G2 — MD editor in CMS:**

- New component: `src/app/components/shared/MarkdownEditorPage.tsx` — analog of [ArticleEditorPage](src/app/components/shared/ArticleEditorPage.tsx) but operating on Markdown strings:
  - Textarea OR Milkdown/CodeMirror with MD syntax highlighting
  - Live preview pane (reuse [MarkdownRenderer](src/app/components/shared/MarkdownRenderer.tsx))
  - Save button → PUT `/state/tokenDocs`
  - Version history (mirror ArticleEditorPage's pattern)

- New routes:
  - `cms/color-editor/doc` → `MarkdownEditorPage` for `tokenDocs.color`
  - `cms/size-editor/doc` → `MarkdownEditorPage` for `tokenDocs.size`
  - `cms/typography-editor` (re-introduce, scoped to MD) → `MarkdownEditorPage` for `tokenDocs.typography`

- Add cards to `CMSDashboard.tsx` for the typography doc editor.

**G3 — Public pages switch to runtime fetch:**

- `src/app/pages/SizePage.tsx`, `ColorPage.tsx`, `TypographyPage.tsx`:
  - Remove the build-time `import sizeMd from "../../../tokens/tokens-size-space.md?raw"`
  - Replace with `useEffect` runtime fetch: try `tokenDocs.size` from useAppData first (will be populated after server load); fall back to a build-time bundled seed for first paint
- The publish flow (Step C/D) ALSO writes `tokens-*.md` to Supabase Storage on Publish — so external consumers (AI agents) fetch from Storage URLs.

**G4 — Decide repo file fate:**

Keep `tokens/tokens-*.md` in the repo as seed files (matches the `tokens/size/*.json` pattern). The build-time import still works for `npm run dev` first paint.

**Estimated: 3 hours.** (Biggest individual step.)

### Step H — ChangeLog + arcsite-ds-apply skill audit

**H1 — ChangeLog:**

- Add a 1.7.0 entry to `defaultChangeLogs` in [data-store.tsx](src/app/store/data-store.tsx) describing the publish flow.
- Write same entry to prod Supabase via `curl PUT /state/changeLogs` per the [CLAUDE.md](CLAUDE.md) instructions. Draft the curl command in the PR description for review before executing.

**H2 — Skill audit:**

- [public/skills/arcsite-ds-apply/prototype.md](public/skills/arcsite-ds-apply/prototype.md) — verify the `<link rel="stylesheet" href="https://arctuition.github.io/.../bootstrap.css">` line still works (it should, via the shim).
- [public/skills/arcsite-ds-apply/figma-flow.md](public/skills/arcsite-ds-apply/figma-flow.md) — should be fine, references llms.txt which is unchanged.
- [public/skills/arcsite-ds-apply/antd-conflict.md](public/skills/arcsite-ds-apply/antd-conflict.md) — references llms.txt, should be fine.

Likely **zero edits** to the skill. Just confirm with a quick read.

**Estimated: 30 minutes.**

## 6. Smoke test plan (run at the end)

After all steps, verify the end-to-end loop:

1. Designer uploads a fresh `tokens-color.tokens.json` via `/cms/color-editor`.
2. Clicks Publish.
3. `https://<sb>.../design-tokens/bootstrap.css` is updated within ~5 seconds (check via `curl -I` for `Last-Modified`).
4. Open a fresh browser tab to a known prototype using the GH Pages URL — token values reflect the new upload after ~10 min cache expiry (or shift+reload).
5. Open `/size/tokens` on the live website — Breakpoints tab still works.
6. AI agent test: an agent fetches `https://arctuition.github.io/design-system/llms.txt`, follows the Supabase URL to bootstrap.css, gets the latest token values.
7. Dev team curl: `curl -O https://<sb>.../design-tokens/bootstrap.css` succeeds, returns the latest.

## 7. Key files reference

| File | Role |
|---|---|
| [.claude/cms-architecture.md](.claude/cms-architecture.md) | Full data-flow architecture. **Read this first.** |
| [src/app/store/data-store.tsx](src/app/store/data-store.tsx) | Single source of state — `AppState`, defaults, KV sync, safe-loading stub |
| [src/app/store/api.ts](src/app/store/api.ts) | Supabase fetch wrappers — `loadStateFromServer`, `saveStateKey`, `bulkSaveState` |
| [src/app/components/shared/size-token-utils.ts](src/app/components/shared/size-token-utils.ts) | CMS-side parsing + slot matching for size + breakpoint uploads. Pattern to mirror for fonts. |
| [src/app/components/shared/size-json-token-utils.ts](src/app/components/shared/size-json-token-utils.ts) | Build-time JSON → CSS for the public `/size/tokens` page |
| [src/app/components/shared/font-token-utils.ts](src/app/components/shared/font-token-utils.ts) | Existing font token build-time helper. Extend for CMS uploads. |
| [src/app/pages/cms/SizeTokensEditor.tsx](src/app/pages/cms/SizeTokensEditor.tsx) | Template for `FontTokensEditor.tsx` |
| [scripts/generate-llms-txt.mjs](scripts/generate-llms-txt.mjs) | Build-time generator. Step B factors out shared logic; step E switches to shim emission. |
| [supabase/functions/make-server-067f252d/index.ts](supabase/functions/make-server-067f252d/index.ts) | Edge function — `STATE_KEYS`, `/state/:key` endpoints, pattern bundle endpoint. Add `/design-tokens/publish` here. |
| [supabase/functions/make-server-067f252d/storage.ts](supabase/functions/make-server-067f252d/storage.ts) | Existing Storage helpers — `ensureBucket`, `uploadAsset`, etc. Reuse for `design-tokens` bucket. |
| [CLAUDE.md](CLAUDE.md) | Project conventions, including the prod Supabase ChangeLog write pattern |

## 8. Open questions (decide as you go)

- **GH Pages shim cache headers**: GH Pages caches its `bootstrap.css` shim for ~10 min by default. The `@import url(...)` is fetched by the browser separately and respects whatever cache headers Supabase Storage sets. **Verify the actual propagation latency** with a curl test before declaring victory. If it's > 1 minute, set `Cache-Control: max-age=60` on the Supabase object.
- **What if Supabase Storage is down?** GH Pages shim's `@import` will silently fail and prototypes get unstyled. Two mitigations: (a) the bootstrap.css shim could include the most recent published content as a fallback after the `@import`; (b) keep `bootstrap.css` in the GH Pages build as a static fallback (regenerated on every commit). Option (b) is simpler. Decide.
- **Should `tokens/*.json` in the repo stay?** Locked decision: yes, as seed. Periodically sync from Supabase (manual? scheduled? skip?). Defer this until after launch.
- **Token MD versioning UX**: `ArticleEditorPage` shows version history in a sidebar. `MarkdownEditorPage` should mirror that. Reuse the existing version-snapshot logic in `saveArticleWithVersion`.

## 9. Anti-patterns to avoid

- **Don't reintroduce the obsolete `sizeArticle` / `colorArticle` / `typographyArticle` HTML slots** that PR 23 removed. Token reference docs are MD-canonical, no HTML twin.
- **Don't emit duplicate token blocks in `llms.txt`** — the whole point of step F is to remove duplication. Inline token blocks in llms.txt + the same in bootstrap.css = drift risk.
- **Don't split typography into its own published CSS file.** Keep one `bootstrap.css` with all token families bundled. One `<link>` for prototypes.
- **Don't bypass `/design-tokens/publish` and write to Storage directly from the browser.** The edge function is the authoritative regeneration point. Browser publishes risk a stale CMS shipping old values.

## 10. Prerequisite — re-PR Part 3 cleanup to main

Before starting Option B work, get PR 23's cleanup landed on `main`. The Part 1 branch was squash-merged before PR 23 was merged into it, so PR 23's commit is orphaned (lives on `claude/part-1-tablet-desktop-large-breakpoints` but not on main).

**To fix:**

```bash
# Branch off main
git fetch origin main
git checkout -b cleanup-obsolete-article-paths origin/main

# Cherry-pick the Part 3 cleanup commit
git cherry-pick origin/claude/part-3-cleanup-obsolete-article-paths

# Resolve any conflicts (PR 22 may have touched some files that PR 23 also touches)
# Most likely zero conflicts since PR 23's content was an addition on top of PR 22.

# Push + open PR
git push -u origin cleanup-obsolete-article-paths
gh pr create --base main --title "Remove obsolete HTML article paths (re-PR of #23)"
```

Verify with `npm run build` clean.

---

*Last updated by Claude after PR #22 merged + PR #23 stuck on stale base. Update this file as Option B progresses.*
