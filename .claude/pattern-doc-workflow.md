# Pattern Doc Authoring Workflow

How to ship a visual overhaul of a Pattern doc (e.g. Modal Dialogs).

Pulled from the Modal Dialogs Do/Don't-pair work — captures the gotchas that took the longest to figure out the first time, so the second time is a 30-minute job instead of a half-day.

---

## Architecture you'll re-encounter every time

- **Source of truth = Markdown**, stored in Supabase. The `PatternArticle` row carries both `content` (HTML) and `markdownContent` (MD).
- **Display rule** (`PatternDetailPage.tsx` → `pickRendering`): newer wins; HTML wins on tie. Compare `htmlUpdatedAt` to `markdownUpdatedAt` as strings.
- **HTML renderer** (`ArticleRenderer.tsx`) does `dangerouslySetInnerHTML`. The sanitizer strips empty `figcaption` / placeholder fig-descriptions but **does NOT rewrite URLs**.
- **MD renderer** (`MarkdownRenderer.tsx`) rewrites relative `images/X.png` paths via the `assetBaseUrl` prop. Absolute URLs, anchors, `data:` URIs pass through.
- **Server gate** `processPatternsBeforeSave` runs turndown when HTML changes, so MD is auto-regenerated from HTML. Stamps `htmlUpdatedAt` and `markdownUpdatedAt` on the changed side.

The single most important corollary:

> 🛑 **HTML mode requires absolute image URLs.** Relative `images/X.png` works in MD but breaks in HTML — `ArticleRenderer` doesn't have an `assetBaseUrl`.

---

## RTE-compatible markup primitives

These are the *exact* shapes the rich-text editor (`RichTextEditor.tsx`) produces. Match them and the editor will let the user re-edit your output without surprises.

### Two-column layout

```html
<div data-rte-cols="2">
  <div data-rte-col="true"><!-- left column content --></div>
  <div data-rte-col="true"><!-- right column content --></div>
</div>
<p><br></p>
```

- CSS lives in `src/styles/index.css` under `[data-rte-cols]` — `display:grid`, gap 24, collapses to 1 col under 640px viewport.
- The trailing `<p><br></p>` matches what the editor inserts as a cursor-landing paragraph; keep it.
- Inserted via `insertColumnLayout` in the editor → same DOM. The editor also supports `data-rte-cols="3"` and `"4"`.

### Figure (image + caption + description)

```html
<figure style="margin:16px auto;width:100%;display:block;" contenteditable="false">
  <img src="<ABSOLUTE_URL>" alt="..." style="width:100%;border-radius:var(--radius-card);display:block;"/>
  <figcaption contenteditable="true" style="font-size:var(--text-label);color:var(--color-label-primary);margin-top:8px;font-style:italic;font-weight:var(--font-weight-medium);padding:4px 0;outline:none;">Do</figcaption>
  <div contenteditable="true" data-role="fig-description" style="font-size:var(--text-label);color:var(--color-label-secondary);margin-top:2px;padding:4px 0;font-style:italic;outline:none;">Description text…</div>
</figure>
```

- `contenteditable="false"` on `<figure>` and `contenteditable="true"` on children — without these the editor won't behave correctly on click/cursor.
- If `figcaption` / description should render as blank: omit text and add `data-empty`. The sanitizer drops them on the public page so they don't leave gaps.
- For Do/Don't pairs: `<figcaption>` holds the literal label "Do" or "Don't"; the description div holds the explanation text.

### Do/Don't pair (combination of the above)

```html
<div data-rte-cols="2">
  <div data-rte-col="true">
    <figure …>
      <img src="…/anti-X-do.png" …/>
      <figcaption …>Do</figcaption>
      <div data-role="fig-description" …>Use a specific verb …</div>
    </figure>
  </div>
  <div data-rte-col="true">
    <figure …>
      <img src="…/anti-X-dont.png" …/>
      <figcaption …>Don't</figcaption>
      <div data-role="fig-description" …>Generic "Create" forces…</div>
    </figure>
  </div>
</div>
<p><br></p>
```

---

## Bundle endpoint (canonical asset upload path)

`POST /patterns/:slug/bundle` — multipart, field `bundle=<zip>`.

- Zip contents: **one** `.md` at root + assets in subdirs (`images/foo.png`, etc.).
- Validates every `![](relative-path)` in the MD has a matching file in the bundle — lists all missing in one error.
- Uploads each asset to Supabase Storage at `pattern-assets/<patternId>/<relative-path>`.
- **Removes orphans** that were in the previous upload but aren't referenced in the new MD.
- Stamps `markdownUpdatedAt = today` (which is fine — when user later pastes HTML, `htmlUpdatedAt` ties or exceeds, so HTML wins).

The MD you send in the bundle is throwaway: turndown will overwrite it the moment the user saves new HTML in CMS. So make the bundled MD just plausible enough to pass validation and provide a reasonable MD-mode fallback.

---

## The end-to-end workflow

### 1. Design in Figma

- Build mockups using Design Library components — `web/model dialog` (`type=Text` or `type=Slot`), `web/btn`, `web/checkbox`, etc.
- For Do/Don't tiles, use the `Image background` component_set local to the Patterns file: variants `Dos and Don'ts = {Do, Don't, Caution, None}` × `Surface color = {level 100, level 200}`. Set instance `fills = []` to make the white surface transparent so the modal PNG behind shows through; only the colored bar + corner icon (✓ / ⚠) remain visible.
- For pairs: Do and Don't sources within the same pair must share an aspect ratio so they end up the same size in the published layout.
- Pad generously around the modal *inside the source frame*. E.g. for a 400×324 modal, a 753×439 source frame (≈177px horizontal padding, ≈58px vertical) feels right. Cropped-tight sources look claustrophobic in the published page.

### 2. Rename frames for export

Run via `use_figma` — give each frame a unique, file-system-safe name and attach a default PNG @2x export setting so they all show up in Figma's "Export N items" panel.

```js
n.name = 'anatomy';  // or 'anti-verb-create-do', etc.
n.exportSettings = [{ format: 'PNG', constraint: { type: 'SCALE', value: 2 }, suffix: '' }];
```

Naming convention used by the rest of the pipeline:
- Singles: `<topic>.png` — `anatomy.png`, `type-alert.png`, ...
- Do/Don't pairs: `<name>-do.png` / `<name>-dont.png`

### 3. User batch-exports

In Figma:
1. Select all renamed frames (shift-click in layers panel or drag-select on canvas)
2. Bottom-right of the Export panel → "Export N items"
3. Save to `~/Desktop/<topic>-images/`

> **Why this is a manual step**: `figma.exportAsync` returns base64, but Claude's tool I/O truncates at ~20KB per response. A single 2x PNG (≈37KB → ≈50KB base64) doesn't fit. Multi-call chunking works but is 19× slower for 19 images. User-driven export from Figma is the right primitive.

### 4. Build the bundle + HTML (script)

See `/tmp/build-bundle.mjs` from the Modal Dialogs session for a working reference. The script does:

1. **Read existing prod MD** and mutate it:
   - Replace single anti-* image refs with sequential Do/Don't pair refs (`anti-X-do.png` then `anti-X-dont.png` on separate `![]()` lines — MD's natural flatten of two-column).
   - Add new image refs to sections that didn't have them (anatomy diagram, etc.).
   - Switch extensions if the user changed format (PNG ↔ JPG mid-session — happens).
2. **Build the zip** with the new MD + all images in `images/`. Validate locally that every MD `![]()` has a matching file before posting.
3. **Build the new HTML** in parallel:
   - Convert MD → HTML via `marked`.
   - Find `<p><img>...</p>` blocks that match the pair pattern, replace with `data-rte-cols="2"` two-column figure blocks.
   - Swap relative `images/X.png` paths to absolute prod storage URLs (`https://<projectId>.supabase.co/storage/v1/object/public/pattern-assets/<patternId>/images/X.png`).
   - Wrap standalone single images in `<figure>` with the inline styles above.

### 5. Push the bundle to prod

```bash
curl -sS -X POST "https://<projectId>.supabase.co/functions/v1/make-server-067f252d/patterns/<patternId>/bundle" \
  -H "Authorization: Bearer <publicAnonKey>" \
  -F "bundle=@/tmp/<topic>-bundle.zip"
```

Per `CLAUDE.md` rule: **show the user the file list and the PUT/POST endpoint before running** any prod write.

Response confirms `assetsUploaded` count + lists `orphansRemoved`. Spot-check 2-3 image URLs with `curl -o /dev/null -w "%{http_code}\n"` to verify storage is serving them.

### 6. Re-seed local for visual verification

The HTML you'll hand to the user must already render correctly *somewhere* before they paste it into prod CMS. Easiest:

1. Local `/state/patterns` PUT with the new HTML on the target pattern, `htmlUpdatedAt = today`. Other patterns unchanged.
2. Open `http://localhost:5173/design-system/patterns/<patternId>` and check:
   - All images load (because absolute prod URLs work from local too — prod storage is public read).
   - Two-column blocks render correctly with ✓/⚠ icons overlaid.
   - Caption HUGs full text — no truncation.

### 7. Hand HTML to the user

Write the final HTML to `~/Desktop/<topic>-new.html`. The user opens it, selects all, copies, then pastes into prod CMS's HTML editor for the pattern and saves. The CMS save triggers:
- `htmlUpdatedAt = today` (HTML wins on tie)
- `processPatternsBeforeSave` runs turndown — regenerates `markdownContent` from HTML, stamps `markdownUpdatedAt = today` too.

### 8. ChangeLog (per `CLAUDE.md` hard rule)

Two writes, in this order:

1. **prod Supabase**: `PUT /state/changeLogs` with the merged array (new entry prepended). Show the body to the user first.
2. **`defaultChangeLogs`** in `src/app/store/data-store.tsx` — same entry. PR this.

ID format: `Math.random().toString(36).slice(2, 11) + Date.now().toString(36)`. Description is markdown — bullets / **bold** / `code` / [links] render via MarkdownRenderer on the home timeline.

### 9. PR

Only file changed: `src/app/store/data-store.tsx`. PR body should reference what's already in prod (bundle uploaded, ChangeLog written) so reviewers know what's data-only vs code.

> ⚠️ The worktree likely has ~500 untracked `xxx 2.svg` files from the predev icon generation step. **Don't include them** — `git add` only the data-store change.

---

## Quick reference: prod endpoints

| Action | Method | Path |
|---|---|---|
| Full state read | GET | `/state` |
| Single key write | PUT | `/state/:key` (e.g. `patterns`, `changeLogs`) |
| Pattern MD only | GET | `/patterns/:slug.md` (agent endpoint) |
| Pattern MD only (write) | POST | `/patterns/:slug` (text/markdown body) |
| Bundle upload | POST | `/patterns/:slug/bundle` (multipart) |

Public anon key in `utils/supabase/info.tsx`. Base URL `https://<projectId>.supabase.co/functions/v1/make-server-067f252d/`.

## Quick reference: where things live in code

| Concern | File |
|---|---|
| Display rule (HTML vs MD) | `src/app/pages/PatternDetailPage.tsx` → `pickRendering` |
| HTML sanitizer (no URL rewrite!) | `src/app/components/shared/ArticleRenderer.tsx` |
| MD asset URL rewriter | `src/app/components/shared/MarkdownRenderer.tsx` (`assetBaseUrl` prop) |
| RTE column / figure structure | `src/app/components/shared/RichTextEditor.tsx` (`insertColumnLayout`, `insertImageFromUrl`) |
| Column CSS | `src/styles/index.css` — search `[data-rte-cols]` |
| Bundle / MD / state endpoints | `supabase/functions/make-server-067f252d/index.ts` |
| ChangeLog seed | `src/app/store/data-store.tsx` → `defaultChangeLogs` |

## Local environment gotchas

- After `supabase db reset` you **must restart** the edge runtime container — `db reset` stops it. See `.claude/local-dev.md` for the exact `docker run` command.
- Project name in the supabase network differs from the directory. Inspect with `docker network ls | grep supabase` to find the suffix (e.g. `laughing-ishizaka-acdc68`) and use the same suffix on the edge runtime container name — otherwise Kong can't resolve it.
- Health check: `curl http://127.0.0.1:54321/functions/v1/make-server-067f252d/health` → `{"status":"ok"}`.

## When NOT to use this workflow

- **Pure text edits** to a pattern doc → just edit the MD in the CMS or via `POST /patterns/:slug`. The whole bundle dance is for asset changes.
- **New pattern doc from scratch** → the bootstrap path (CMS Add Pattern button + first-time bundle upload) is different. This doc assumes the pattern already exists in `kv "patterns"`.
- **Single-image swap** (e.g. fixing a typo in one diagram) → upload via the CMS image uploader UI, or POST a minimal bundle with only the changed file plus the existing MD.
