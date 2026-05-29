# Design System Website — Claude Context

> **Before opening a substantial PR, open `ARCHITECTURE.md`.** That file is
> a map of where data lives and how it flows across runtime boundaries —
> it exists specifically to help you spot drift risks before a change
> goes wrong. The PR template asks you to skim it; the docs-drift CI
> check warns when you change load-bearing files without touching it.

## Project doc manifest

> All the project rule files in one place — agents and humans alike should
> know what exists *before* they start a task. Don't re-load these all at
> once; pull only the rows relevant to what you're about to do. The
> "When to read" column says when each becomes load-bearing.
>
> **Maintenance**: when you add, retire, or move a rule file, update this
> table in the same PR. If a row stops being consulted across multiple
> sessions, demote it (move to the "Background" tier) or delete it.

| Tier | File | When to read |
|---|---|---|
| **Always-loaded** | `CLAUDE.md` (this file) | Auto-loaded into every session by Claude Code |
| **Always-loaded** | `~/.claude/projects/<this>/memory/MEMORY.md` | Auto-loaded; index into project-specific lessons & feedback |
| **Always-loaded** | `~/.claude/memory/MEMORY.md` | Cross-project engineering lessons; index. Auto-loaded by some configurations |
| **High — data flow / architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Before any substantial PR. Lists drift risks + canonical sources + load-bearing source files + CI gates |
| **High — past decisions** | [`.claude/decisions.md`](.claude/decisions.md) | When deciding *how* to implement something; check whether a similar choice was already made and why |
| **Medium — local setup** | [`.claude/local-dev.md`](.claude/local-dev.md) | First-time local setup; debugging dev env (esp. the Supabase Docker quirks) |
| **Medium — pattern docs** | [`.claude/pattern-doc-workflow.md`](.claude/pattern-doc-workflow.md) | Editing or creating Pattern docs / images |
| **Specialised — token MDs** | (canonical: KV `tokenDocs` via curl, **not** `tokens/*.md`) | Editing the three token reference MDs. See §"Token reference MDs" below |
| **Specialised — changelog** | [`scripts/safe-changelog-sync.mjs`](scripts/safe-changelog-sync.mjs) + `defaultChangeLogs` in `data-store.tsx` | Every user-visible PR. See §"ChangeLog must update on every PR" below |
| **Specialised — drift guards** | [`.github/workflows/docs-drift-check.yml`](.github/workflows/docs-drift-check.yml), [`.github/pull_request_template.md`](.github/pull_request_template.md) | When touching load-bearing source files |
| **Background — token data** | `tokens/tokens-*.md`, `tokens/<collection>/*.json` | Reading current token values (seed copy). For *editing*, see "Specialised — token MDs" above |
| **Background — lessons archive** | `~/.claude/projects/<this>/memory/project_*.md`, `~/.claude/memory/lesson_*.md` | Pull on-demand when MEMORY.md index hints at relevance to current task |

### How to use this manifest

- **Starting a new task?** Skim the table, identify rows that match the task domain, read those files first.
- **Creating a new project-level doc?** Run `find . -iname "<topic>*"` first. If a relevant entry exists anywhere in `.claude/`, `tokens/`, or repo root, **extend it rather than creating a parallel file**. Two parallel architecture docs is worse than one slightly-outdated one — that exact mistake happened on 2026-05-14 (see project memory).
- **Promote / demote**: if a row goes unconsulted across several sessions, either the doc is no longer load-bearing (demote to Background or delete), or it's load-bearing but unreadable (rewrite). Doc rot is real; address it rather than accumulating.

## Project
React + Vite + TypeScript design system CMS. Content is managed through `/src/app/pages/cms/` pages and persisted via a Supabase edge function acting as a key-value store.

## Key files
| Path | Purpose |
|------|---------|
| `src/app/pages/cms/IconEditor.tsx` | Icon upload, deduplication, bulk import |
| `src/app/store/api.ts` | All backend API calls (switches local/prod automatically) |
| `supabase/functions/make-server-067f252d/index.ts` | Hono-based edge function (state CRUD). Deployed as `make-server-067f252d`; this is the canonical source (there is no `server/index.tsx`) |
| `utils/supabase/client.ts` + `utils/supabase/allowlist.ts` | CMS Google sign-in (Supabase Auth). Frontend gate only — see `.claude/decisions.md` #9 |
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

## Generated files — do not edit directly
- **`public/llms.txt`** is generated by `scripts/generate-llms-txt.mjs` on every `prebuild` / `predev`. Any direct edit will be silently overwritten on the next build. To change its contents (add sections, links, skill references, etc.), edit the template inside `scripts/generate-llms-txt.mjs` and re-run `node scripts/generate-llms-txt.mjs`.
- **`public/tokens/bootstrap.css`** is also generated by the same script — the paste-ready stylesheet that prototypes import to load Inter + every token. Edit the template at the bottom of `scripts/generate-llms-txt.mjs`, never the output file.
- **`public/tokens/*.md`** are mirrored from `tokens/*.md` by the same script — edit the source under `tokens/`, not the copies under `public/tokens/`.

## Token reference MDs — canonical = KV, NOT repo

> 🔄 **CHANGED (see `.claude/decisions.md` #7) — read before trusting the rest of this section.**
> The agent-fetch path moved. `llms.txt` now points AI agents at the **static
> `https://design-system.arcsite.com/tokens/tokens-*.md`** files (mirrored at
> prebuild from **repo `tokens/*.md`**) — *not* the Supabase Storage URLs below.
> Consequence during the egress-interim (until the AWS backend migration):
> - **To make a token-doc edit reach AI agents you now MUST update repo `tokens/*.md` and redeploy.** Editing only via the CMS (KV → Storage) updates the public React pages but no longer reaches agents.
> - So the "do NOT make a PR to `tokens/*.md`" rule below is **inverted for the agent path** during the interim. The KV/Storage workflow below still drives the public token pages.
> - Keep repo `tokens/*.md` and KV `tokenDocs` in sync (byte-identical as of 2026-05-27).

⚠️ **Historical framing — still true for the runtime CMS / public website, but NOT for the AI-agent fetch path:** `tokens/tokens-color.md`, `tokens/tokens-size-space.md`, `tokens/tokens-typography.md` are NOT the source of truth for the public website pages. They're a seed for those.

The canonical for the **public website + CMS** lives in KV (`tokenDocs.{color,size,typography}`) and is published to Supabase Storage by the same `/design-tokens/publish` endpoint that publishes `bootstrap.css`. Before decision #7, `public/llms.txt` pointed AI agents at those Storage URLs (it no longer does). `<ref>` below is the Supabase project ref (`VITE_SUPABASE_PROJECT_ID` in `.env` — currently `dnfzdqyiepjzqrigpvzw`; see decisions.md #10):

```
https://<ref>.supabase.co/storage/v1/object/public/design-tokens/tokens-color.md
https://<ref>.supabase.co/storage/v1/object/public/design-tokens/tokens-size-space.md
https://<ref>.supabase.co/storage/v1/object/public/design-tokens/tokens-typography.md
```

To edit these docs, do NOT make a PR to `tokens/*.md`. Instead:

1. **Via the CMS** (preferred when the change is human-authored): open `/cms`, navigate to the Markdown editor for the target doc, edit, Save (writes KV via `setTokenDoc`), then click "Publish to Production" (mirrors KV → Storage).
2. **Via curl** (for scripted / batch updates):
   ```bash
   ANON=<publishable key from .env / utils/supabase/info.tsx>
   REF=<VITE_SUPABASE_PROJECT_ID from .env>   # currently dnfzdqyiepjzqrigpvzw
   BASE="https://$REF.supabase.co/functions/v1/make-server-067f252d"
   # Read current
   curl -s "$BASE/state/tokenDocs" -H "Authorization: Bearer $ANON"
   # Write new (full {color,size,typography} payload)
   curl -X PUT "$BASE/state/tokenDocs" -H "Authorization: Bearer $ANON" \
     -H "Content-Type: application/json" --data '{"value":{"color":"...","size":"...","typography":"..."}}'
   # Mirror to Storage
   curl -X POST "$BASE/design-tokens/publish" -H "Authorization: Bearer $ANON"
   ```

Then optionally snapshot the new content back into `tokens/*.md` for repo history (a PR is OK as a *snapshot*, but the PR is not what makes the change live — the KV PUT + Publish is).

**This trap caught a maintainer on 2026-05-14**: a PR to `tokens/*.md` was merged but AI agents fetching the canonical URLs still got the stale version. See `.claude/projects/.../memory/project_token_md_docs_canonical_is_kv.md` for the full incident write-up.

## Key decisions
**See `.claude/decisions.md` for full rationale.**

- `supabase functions serve` is broken in v2.75.0 — edge runtime must be started via a manual `docker run` command (documented in `.claude/local-dev.md`)
- The edge function is registered locally as `make-server-067f252d` (not `server`) to match the production URL path, so Hono routes work identically in both environments
- `.claude/edge-main-index.ts` is the committed main service router script — mounted into the Docker container at `/root/index.ts`

## Pattern doc authoring
**See `.claude/pattern-doc-workflow.md` for the full end-to-end playbook.**

When shipping visual changes to a Pattern doc (image refresh, Do/Don't pairs, new diagrams):
- HTML mode does NOT auto-rewrite relative image paths — use absolute prod storage URLs in `<img src>`. MD mode does rewrite via `assetBaseUrl`. This is the most common foot-gun.
- Two-column layouts use the editor's native `<div data-rte-cols="2"><div data-rte-col="true">…</div>…</div>` markup; CSS lives in `src/styles/index.css`.
- Bundle endpoint `POST /patterns/:slug/bundle` (multipart, one zip with MD + assets) handles atomic MD update + asset upload + orphan cleanup. Use this instead of writing storage directly.
- Figma → disk: rename frames to unique export-friendly names via `use_figma` (and set `exportSettings`), then user batch-exports. Don't try to tunnel base64 through `use_figma` output — it truncates at ~20KB.

## ChangeLog must update on every PR
Every PR in this project that ships a user-visible change must produce a corresponding entry in the home-page Change Log. **Update both places**:

1. **Production Supabase** — write the new entry directly so the live site (`https://design-system.arcsite.com/`) shows it immediately. Updating only the `defaultChangeLogs` seed is not enough — the seed only applies to fresh installs, never to existing prod data.
2. **`defaultChangeLogs`** in `src/app/store/data-store.tsx` — keeps the in-repo seed aligned and serves as a code-side record.

**How to write to prod Supabase — use the helper:**

```bash
# Add the entry to defaultChangeLogs in src/app/store/data-store.tsx, then:
node scripts/safe-changelog-sync.mjs            # dry-run, prints diff
node scripts/safe-changelog-sync.mjs --apply    # PUT to prod
```

The script reads the seed from `defaultChangeLogs`, fetches prod, merges (matching by `version`), and PUTs. It refuses to shrink the prod list — so a stale or empty parse can't wipe history.

**Why not raw curl any more:** the endpoint has asymmetric request / response shapes — `GET` returns `{"data": [...]}`, `PUT` expects `{"value": [...]}`. Reading the wrong key looks like "prod is empty" and tempts a destructive PUT. The helper handles this correctly and prints a preview before any write. See the comment at the top of [scripts/safe-changelog-sync.mjs](scripts/safe-changelog-sync.mjs) for the incident write-up.

If you absolutely must write raw curl (e.g. the helper is broken or a non-changelog key needs the same treatment), follow the same pattern: GET → read `data` → prepend new → PUT `{"value": merged}`. Show the merged body to the user before executing.

Both `projectId` and `publicAnonKey` are in `utils/supabase/info.tsx` (anon key is the public front-end key).

Skip the ChangeLog entry only for purely-internal changes (CLAUDE.md edits, build tooling, dev-only scripts) — when in doubt, ask. Default is "always add one."

## Keeping these docs up to date
Say **"sync context"** in any session to trigger an update of these files.
`/project:sync-context` does NOT work — Claude Code resolves slash commands relative to cwd, which is often a worktree, not the project root.

## Authoring substantial PRs (especially AI-authored)

> Background: on 2026-05-14 a maintainer-AI shipped a PR that updated only the repo copy of a doc whose canonical source had silently moved to KV two days earlier. The instruction in CLAUDE.md was still literally true but its meaning had flipped. There was no diff in the doc, so reviewers had no signal. We added three guards to prevent recurrence; this section is the cultural one.

For any PR over ~500 LOC, or any PR touching a [load-bearing source file listed in `ARCHITECTURE.md`](ARCHITECTURE.md#load-bearing-source-files-ci-watches-these):

1. **Skim `ARCHITECTURE.md` first.** Find the section closest to your change. Re-read its "Drift risks" and "Canonical sources" callouts. If your change makes a risk worse, or moves a canonical, update the map in the same PR.
2. **Search-and-read meta-docs** for the file/service/concept your change affects:
   - `CLAUDE.md` (start with the §Project doc manifest table at the top) — look for instructions whose *meaning* (not text) might flip
   - `tokens/tokens-*.md` — reference tables can go stale silently
   - `.claude/decisions.md` — past decisions may be invalidated
3. **Fill in the PR template's architectural-impact checklist.** The boxes exist to make you stop and think; mechanical checking defeats the point.
4. **Search before creating any new project-level doc.** If asked to add a map / runbook / architecture doc / index, run `find . -iname "<topic>*"` first. If a similar file exists (likely listed in §Project doc manifest), extend it instead of creating a parallel file. A duplicated map is itself the drift hazard the system is meant to prevent — on 2026-05-14 this exact mistake was made and the user had to point at the existing file.
5. **Don't forget regular tasks.** Before opening a PR, check the §Regular task checklist below — there are standing rules (e.g., update the ChangeLog) that apply to every user-visible PR, easy to skip when deep in code. The PR template has a reminder.
6. **If AI is authoring the PR**, the prompt should include: *"Before opening the PR, re-read `CLAUDE.md` (especially the §Project doc manifest), the relevant section of `ARCHITECTURE.md`, and check whether any instruction there would become misleading because of this change. Also walk the §Regular task checklist."* AI optimizes for the explicit task; this prompt extends the task to include doc maintenance + the standing rules.

The technical guard for this is `.github/workflows/docs-drift-check.yml` — it posts a warning comment on PRs that touch load-bearing source without `CLAUDE.md`/`ARCHITECTURE.md`. The warning is advisory, not blocking; it exists to make you *look*, not to gate emergency fixes.

## Regular task checklist

> Standing rules that apply to every user-visible PR. AI authors especially: tick through this *before* opening the PR, not after the user catches you skipping. Forgetting any of these is the same class of failure as silent doc drift — they're invisible until someone audits.

- [ ] **ChangeLog updated** if the PR ships a user-visible change. See §"ChangeLog must update on every PR" — grouping multiple small PRs into one entry is fine and preferred, but the rule is "every release of user-visible work has an entry." Skip only for purely-internal changes (CLAUDE.md edits, build tooling, dev-only scripts).
- [ ] **Project doc manifest updated** if the PR adds, retires, or moves a rule file.
- [ ] **`ARCHITECTURE.md` updated** if the PR changes a data flow, a canonical source, or a load-bearing source file's contract (see §Drift risks and guards).
- [ ] **Migration code present** if the PR renames or reshapes any persisted field.
- [ ] **Architecture impact checklist on the PR description** filled in honestly (or its boxes deliberately cleared with reasons).

## Worktree cleanup
If you see a "Commit changes" prompt in the Claude Code toolbar, a worktree is still active. Remove it:
```bash
git worktree remove .claude/worktrees/relaxed-meitner --force
```
