<!--
  This template prompts the author to think about doc drift before
  merging. Background: on 2026-05-14 a maintainer (re-)discovered that
  CLAUDE.md had been silently misleading for two days because PR #26
  moved a canonical source without touching the doc that described
  it. See ARCHITECTURE.md + project memory for the post-mortem.

  Delete sections that don't apply. The intent is to make you stop
  and read ARCHITECTURE.md once before merging, not to fill out a
  form mechanically.
-->

## Summary

<!-- 1-3 bullets on what this PR does and why. -->

## Architectural-impact checklist

> Before you check any of these, open `ARCHITECTURE.md` in another tab
> and skim the section closest to your change. If a box below is
> checked, the corresponding section of `ARCHITECTURE.md` should also
> be updated in this PR.

- [ ] **No architectural impact.** Pure refactor / bug fix / docs / styling that doesn't move data anywhere new.

If any of the below apply, expand the relevant block:

<details>
<summary>This PR changes which file or service is <strong>canonical</strong> for any artifact</summary>

- What artifact? <!-- e.g., "tokens-color.md" -->
- Old canonical → new canonical? <!-- e.g., "repo tokens/*.md → KV tokenDocs" -->
- `ARCHITECTURE.md` section updated to reflect new canonical: yes / no
- `CLAUDE.md` instruction text reviewed for stale meaning: yes / no
- AI agents fetching pointer URLs (`public/llms.txt`) still get correct content: yes / no

</details>

<details>
<summary>This PR adds, removes, or changes a <strong>data flow</strong></summary>

- Source → destination? <!-- e.g., "client → /state/:key → KV" -->
- Any new silent-failure paths introduced? (Number→NaN, fallback flatten, catch-and-discard, etc.)
- Migration code for changed payload shape included: yes / no / not applicable
- `ARCHITECTURE.md` diagram updated: yes / no

</details>

<details>
<summary>This PR adds a new <strong>runtime artifact</strong></summary>

- What artifact? <!-- e.g., "new edge function" / "new Storage bucket object" -->
- Auto-deploy pipeline added or extended: yes / no / not applicable
- Where it gets fetched from documented in `ARCHITECTURE.md`: yes / no

</details>

<details>
<summary>This PR changes a <strong>state slot, server allowlist, or shared contract</strong></summary>

- Slot / key / contract name? <!-- e.g., "tokenStatus", "STATE_KEYS" -->
- Both client and server updated (or shared module used): yes / no
- Runtime assert (`assertValidStateKey`-style) on the outbound path: yes / no
- Migration for old shape: yes / no / not applicable

</details>

<details>
<summary>This PR is <strong>over ~500 LOC</strong> or touches <strong>more than 5 files</strong></summary>

- Even if no individual change is architectural, large PRs can collectively shift the system. Re-scan:
  - `CLAUDE.md` — any instruction with a stale referent?
  - `ARCHITECTURE.md` — any diagram outdated?
  - `tokens/tokens-*.md` — any reference table outdated?
  - `.claude/decisions.md` — any decision invalidated?

</details>

## Test plan

<!-- How to verify this PR locally + on prod. -->

## Regular-task reminders

> Standing rules that apply to most PRs. AI authors: tick these before opening, not after a user audit. See §"Regular task checklist" in CLAUDE.md for the full list and rationale.

- [ ] **ChangeLog entry written** (or explicitly skipped because the PR is purely internal — docs, build tooling, dev-only scripts). For a *cluster* of related PRs, one combined entry is fine and preferred — don't write 14 separate entries. See `scripts/safe-changelog-sync.mjs`.
- [ ] **Project doc manifest** (CLAUDE.md top section) updated if this PR adds, retires, or moves a rule file.
- [ ] **`ARCHITECTURE.md`** updated if this PR changes a data flow, canonical source, or load-bearing source file's contract.
- [ ] **Migration code** is in this PR (not a follow-up) if any persisted field is renamed or reshaped.

## Notes for reviewer

<!-- Anything subtle, anything you considered but didn't do, anything
     follow-up worth. Optional. -->
