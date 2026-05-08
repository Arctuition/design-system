# Reference: AntD conflict handling (Mode 2)

The hardest case in Mode 2 (modifying the ArcSite product codebase). The product uses Ant Design heavily, and ArcSite component-level tokens don't always map cleanly onto AntD's customization surfaces. This guide is a **linear runbook**: do the audit first, the freshness check second, the decision third, the implementation fourth, and the self-check last. Skipping a step leads to the bugs the design team keeps catching at review time.

---

## 1. Pre-coding audit (always do this before writing any styled JSX)

The biggest source of Mode 2 rework is "I started writing before I understood what was already there." This audit makes the codebase's current state visible so your decisions later have ground truth to stand on. Don't skip it because the task feels small — it's almost always faster to do the audit than to undo a wrong assumption.

The codebase is a pnpm monorepo. Multiple apps each have their own `App.tsx` and their own `ConfigProvider` setup. **Identify which app you are working in first** (typically `apps/web` for user-site work, `apps/enterprise`, `apps/web2` for the Next.js app, `apps/h5` for mobile web). Every audit step below is scoped to that app, not the repo root.

Walk this checklist in order. Read the actual files — do not work from memory or assume the codebase matches a generic React+AntD setup.

### 1a. ConfigProvider current state

Open the ConfigProvider entry for your app:
- Vite apps: `apps/<app>/src/App.tsx`
- Next.js app: `apps/web2/src/app/providers.tsx`

Note which AntD theme tokens are already overridden (under `theme.token`) and which component-specific overrides exist (under `theme.components`). **You will not redefine anything that's already configured here** — if the override exists, the team has already made a decision about it.

### 1b. Tailwind / CSS variable layer

Find the codebase's local token layer (typically `tokens-color.css`, `tokens-typography.css`, etc., often imported from `shared-styles.css` or similar). Note the naming convention used (semantic vs. primitive split, prefix conventions). The audit's purpose is to confirm that this layer mirrors `llms.txt` — see step 2 below.

### 1c. Font loading

Check `apps/<app>/index.html` (or the Next.js equivalent: `app/layout.tsx`) for how Inter is loaded. If it's already loaded globally, you do not need to import bootstrap.css — Mode 2 follows the codebase's existing font wiring. **Never** layer bootstrap.css on top of an already-set-up codebase; that's a Mode 1 (prototype) artifact, not a Mode 2 tool.

### 1d. Existing pages and dependencies

Search the codebase for any page or component whose purpose overlaps with what you're about to build. If one exists, **stop and list its dependencies before deciding to rewrite vs. extend**:

- API calls (REST endpoints, GraphQL queries)
- Tracker / analytics events
- External SDK injection points (Google OAuth, Apple Sign-In, Stripe Elements, etc.)
- URL parameters the page reads or writes
- React context or store dependencies
- Modal / drawer / overlay triggers from elsewhere in the app

Replacing a page silently breaks all of these. If overlap exists, surface it to the user with the dependency list and ask whether to extend the existing page or start fresh.

---

## 2. Token freshness check (mandatory before applying any ArcSite token)

Codebase semantic tokens are expected to mirror `llms.txt`, but they lag periodically when the design system updates and the product PR hasn't shipped yet. **A lag is a signal to update the codebase, never a license to redefine tokens locally inside the new page.** If you redefine `--color-*` or `--font-*` inside a feature page's CSS, you create a parallel source of truth and hide the lag from the team.

For each token you intend to use in this PR:

1. Find its value in `llms.txt` (the canonical source).
2. Resolve the same token name in the codebase's local layer. Follow the alias chain if needed: semantic → primitive → hex.
3. Compare. If they match, proceed. If they diverge, **stop and present the user with three options**:

   > The codebase value for `--color-action-primary` is `#3477F2`, but `llms.txt` has it as `#2E6DEC`. Three options:
   >
   > **A — Update the codebase tokens first (separate PR), then build on top.** Cleanest; keeps the codebase as the working source of truth. Recommended when the divergence affects more than this one PR.
   >
   > **B — Use the codebase value, accept the lag for this PR.** Ship the page on stale tokens; flag the divergence in the PR description so the team can backfill. Recommended when the visual difference is small and ship timing matters.
   >
   > **C — Use the `llms.txt` value, document the deviation.** Emergency override; this PR's CSS will not match the codebase's other pages until the token layer is updated. Recommended only when the page is high-visibility and the lag is too large to absorb.

Do this **per token you'll use**, not as a sample. The cost is small (one lookup each), and silent drift is what you're paying that cost to prevent.

---

## 3. Recognize a real AntD conflict

After the audit and freshness check, you're ready to apply tokens. Most tokens map cleanly through ConfigProvider — apply those silently. The decision step below is reserved for **actual conflicts**, which look like:

- The ArcSite token specifies a value for a property AntD doesn't expose in its theme tokens.
- The ArcSite token specifies a structural change (padding inside an internal element, a border on a sub-part) that AntD only allows via deep CSS overrides.
- AntD's component has its own opinionated default (focus ring style, animation curve) that contradicts an ArcSite principle.
- Two ArcSite tokens collapse into one AntD theme token, or vice versa — there's no 1:1 mapping.

If the conflict is genuine, go to step 4. If it isn't (the mapping is clean), go to step 5.

---

## 4. Decision: surface the conflict, do not paper over it

Don't write the override silently. Don't accept the AntD default silently. Present the trade-off concretely with code-level specificity, then wait for the user.

### Template for the question

> The ArcSite design system specifies `[token name]` = `[value]` for `[element]`, but Ant Design's `<[Component]>` doesn't expose this through its theme tokens. Three options:
>
> **A. Override AntD to match ArcSite**
> ```css
> .arcsite-[component]-override .ant-[component]__[part] {
>   [property]: var(--arcsite-[token]);
> }
> ```
> Visual fidelity to DS, but fights the library and may break on AntD upgrades.
>
> **B. Accept AntD default**
> No code change; visual will be `[AntD default value]` instead of `[ArcSite token value]`. Stable, idiomatic, small visual drift.
>
> **C. Replace with a non-AntD primitive here**
> Build this `[element]` from primitives so we get full ArcSite token fidelity. Inconsistent with the surrounding AntD usage in this file, though.
>
> Which would you like?

### When to lean toward each option (observations, not rules)

- **A (override)** tends to fit when the visual divergence is high-visibility (brand colors, primary CTA styling) and the team accepts the upgrade-fragility cost.
- **B (accept default)** tends to fit when the property is low-visibility (internal padding by 2px, animation timing) and the cost of overriding outweighs the visual gain.
- **C (replace)** tends to fit when this component is already an outlier in the codebase, or the team is gradually migrating off AntD.

State the observation if it's relevant, but the user makes the call.

---

## 5. Apply tokens that DO map cleanly

For tokens that map onto an AntD ConfigProvider theme token, apply them at the app root rather than per-instance:

```tsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      // Mapping ArcSite → AntD theme tokens
      colorPrimary: 'var(--arcsite-color-action-primary)',
      borderRadius: 'var(--arcsite-radius-md)',
      // ...
    },
    components: {
      // Component-specific overrides go here when the team has already
      // standardized on them — check 1a before adding new entries.
      Button: { fontWeight: 600 },
    },
  }}
>
  <App />
</ConfigProvider>
```

This keeps the diff small, avoids per-instance overrides, and concentrates AntD customization in one place the team can review.

---

## 6. Before-done self-check (Mode 2 specific)

Before reporting the page complete, walk this list. Each item targets a category of bug that has shipped to production from past Mode 2 PRs because nobody asked these questions before review.

- [ ] **Inter actually loaded?** Open DevTools → Computed → `font-family` on a sample text node. It must read `Inter`, not a fallback. (A `font-family: Inter, ...` declaration alone is not enough — if Inter isn't loaded, the browser silently falls through to the next font.)
- [ ] **Every design-system color class resolves to a real value?** Inspect a few elements; if any computed color is `currentcolor`, `inherit`, or an unexpected fallback, a token is undefined or misnamed.
- [ ] **All flex containers have explicit `align-items`?** AntD's default `stretch` on a flex parent silently distorts `<img>` children — this has bitten the team specifically with logo placement and SDK-injected button rows.
- [ ] **All button rows in the same row have the same width?** Especially when an SDK injects its own button (Google OAuth, Apple Sign-In, Stripe Elements). Verify visually; if widths differ, decide between Option B (use SDK's own width parameter) or Option A (force-equalize via wrapper width).
- [ ] **Form.Item with custom label JSX has the right label-container styling?** AntD's `Form.Item` label container is shrink-fit by default. If the custom label uses internal flex / width logic, the outer label container needs `width: 100%; display: block` or the inner layout collapses.
- [ ] **No hardcoded hex / px in any custom className?** Search your diff for `#`-prefixed hex values and bare `px` units in CSS / styled-components. They should all be `var(--…)` references. The exception is structural pixels that aren't tokenizable (e.g., 1px borders); flag any others to the user.
- [ ] **No locally-redefined `--color-*` / `--font-*` / `--size-*` variables in this PR's CSS?** That breaks the freshness-check rule from step 2 and creates a parallel source of truth.
- [ ] **Dark mode coherent (if the codebase supports it)?** Toggle the dark theme and verify no broken contrast and no missing tokens on the new page.

If any item fails, fix it before declaring done. If you're unsure about an item (e.g., "is the SDK button width really off?"), screenshot the page and ask the user before claiming completion.
