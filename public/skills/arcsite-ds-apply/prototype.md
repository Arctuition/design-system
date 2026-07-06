# Reference: Prototype mode

Use this guide whenever you are building standalone ArcSite UI from scratch — prototypes, demos, marketing pages, internal tools — anywhere there is no production codebase or third-party UI library to fight with.

> **Maintainer note — this file holds *principles only*.** Do not hardcode token values, breakpoint pixels, mode names, hex codes, font weight lists, exact filenames, or repo paths that may drift. Reference the canonical source (`llms.txt`, the JSON files under `tokens/`, the codebase itself) and let the agent read live values. If you find yourself typing a specific value here, replace it with a pointer to where the value lives.

## Which kind of "prototype"? Two contexts

"Prototype" covers two different artifacts. Identify yours before applying the rules below:

- **Standalone DS prototype** — new ArcSite UI built from scratch on the design system: demos, marketing pages, internal tools, concept screens. **This whole guide applies as written**: bootstrap import, semantic tokens, Inter.
- **Design Playground product-simulation prototype** — a hi-fi simulation of the *existing shipped ArcSite app*, running inside a simulated device frame on the Design Playground hub. Its authoritative build + publish contract is maintained by the Playground itself: fetch **<https://design-playground.arcsite.com/agent-instructions.md>** and follow it; treat this guide as background reference. Two deliberate differences to expect there — they are **not** violations of the anti-patterns below:
  - The simulated app surface is themed by the Playground template's **device-mode token layer** (`--primary`, `--background`, `--text-h1`, …) — a separate namespace from the DS semantic tokens, mirroring the shipped product's own theme. Anti-pattern 5 ("no `:root` redefinition") is about re-declaring *DS* token variables; the device-mode layer doesn't touch them.
  - The simulated app surface uses the product's shipped UI font (currently Roboto on both iOS and Android — a font-licensing decision; the Playground contract is canonical), not Inter. Inter remains the rule for standalone/web DS surfaces, including the Playground hub's own chrome.

## Non-negotiable bootstrap

Before writing any component CSS, do these three things, in order:

1. **Import the bootstrap stylesheet** — single line in the `<head>` (or top of the entry CSS for a React/Vite prototype):

   ```html
   <link rel="stylesheet" href="https://design-system.arcsite.com/tokens/bootstrap.css">
   ```

   This loads Inter (whatever weights the design system currently ships with), defines every CSS variable referenced in `llms.txt`, and wires up dark-mode swap. **Do not** hand-copy values from `llms.txt` into a local `:root` — that is the failure mode this stylesheet exists to prevent.

   *Offline / sandboxed builds:* when the runtime can't reach `design-system.arcsite.com` (CI sandboxes, egress-restricted networks), vendoring is acceptable — fetch `bootstrap.css` at build time with a sync script and commit the whole-file snapshot (the Design Playground's `scripts/sync-ds-tokens.mjs` is the reference implementation; it also strips the font `@import`, which loads separately). A scripted whole-file snapshot preserves token names, both modes, and the dark-mode swap; hand-copying individual values does not, and stays prohibited.

2. **Pick a logo from `/logos/`** (do not redraw, recolor, or invent). List the directory's current contents and pick by filename: light-background variants vs `on-dark` variants, with-text vs glyph-only as the design needs. Do not enumerate the filenames from memory — `/logos/` is the canonical source and may grow over time.

3. **Confirm dark mode behavior**, even if the prototype is single-mode. The bootstrap defines both modes; if the brief is "light only," explicitly set `<html class="">` (no `dark`) and document the choice. Never strip dark tokens from the bootstrap.

## Workflow once bootstrapped

1. Build using only token CSS variables — `var(--color-label-primary)`, `var(--size-spacing-md)`, `var(--text-body-medium)`, etc. Names and values are listed in `llms.txt`.
2. Bind layers and components to **semantic** tokens (`--color-label-*`, `--color-fill-*`, `--color-surface-*`, `--color-border-*`, `--size-spacing-*`, `--size-padding-*`, `--size-radius-*`, `--text-*`). Use globals (`--color-global-*`, `--size-global-*`) only inside the design system itself, never in product UI.
3. For images, illustrations, or icons: prefer the design-system-provided assets (`/icons.json`, `/logos/`, the `Image` page in the Figma library) before drawing your own.

## Example pattern (HTML/CSS prototype)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel="stylesheet" href="https://design-system.arcsite.com/tokens/bootstrap.css">
    <style>
      body {
        font: var(--text-body-medium);
        color: var(--color-label-primary);
        background: var(--color-surface-default);
      }
      .card {
        background: var(--color-surface-container-default);
        padding: var(--size-padding-lg);
        border-radius: var(--size-radius-lg);
        border: 1px solid var(--color-border-default);
      }
      .cta {
        background: var(--color-fill-action-primary);
        color: var(--color-label-on-action);
        padding: var(--size-padding-md) var(--size-padding-lg);
        border-radius: var(--size-radius-md);
      }
    </style>
  </head>
  <body>
    <img src="https://design-system.arcsite.com/logos/glyph-and-text.svg" alt="ArcSite">
    <!-- ... -->
  </body>
</html>
```

## Example pattern (React + Tailwind 4 prototype)

Tailwind 4 supports CSS-variable arbitrary values directly — no config extension needed:

```jsx
// In your entry CSS (before tailwind directives):
//   @import url("https://design-system.arcsite.com/tokens/bootstrap.css");

<button className="bg-(--color-fill-action-primary) text-(--color-label-on-action) p-(--size-padding-md) rounded-(--size-radius-md)">
  Sign in
</button>
```

For older Tailwind 3 prototypes, extend `tailwind.config.js` to alias the variables (don't copy the values themselves).

## Anti-patterns (do not do these)

These are the failures that show up most often when LLMs default to training-set averages instead of reading this guide. Treat them as hard prohibitions.

1. **No system font stack.** Never write `font-family: -apple-system, system-ui, sans-serif` (or any variant). Inter is loaded by the bootstrap; reference `var(--text-*)` tokens or `font-family: Inter`. (One exception: a Design Playground product-simulation surface uses the product's shipped font per the Playground contract — see "Which kind of prototype?" above.)
2. **No raw values in component CSS.** No hardcoded `font-size: 14px`, `color: #3B82F6`, `padding: 16px`, `border-radius: 8px`, etc. All values must come from token variables. Hex literals and bare px belong only inside the bootstrap (which is generated, not hand-edited).
3. **No translating values across sources.** Do not read a hex from `llms.txt` and paste it into your CSS; do not read a Figma variable's resolved value and paste it. Always reference by token name so source updates propagate.
4. **No invented or recolored brand assets.** Do not draw a new logo. Do not apply CSS filters to recolor the provided logos. If you need a variant that does not exist (e.g. monochrome on a tinted background), flag to the user.
5. **No `:root` redefinition.** Do not re-declare token variables in your prototype's stylesheet — the bootstrap is the only source. Overrides break dark-mode swap and create silent drift.
6. **No hand-drawn SVG paths for non-trivial shapes.** For grips, markers, custom glyphs, icons, dimension chrome — anything with curvature or a non-rectangular silhouette — fetch the actual asset (from Figma via `get_design_context` + `curl`, from `/icons.json`, from the project's existing assets), then embed the real path. Approximating a teardrop as "triangle + half-circle," substituting a lucide-react icon for a custom mark, or eyeballing bezier control points produces visible regressions every time. If the asset doesn't exist yet, flag the gap — don't guess at the curve.
7. **No re-implementing chrome that already exists in a sibling prototype.** When working in a multi-prototype workspace (e.g. `design-playground/<project>/`), the first step before writing any top nav, tool panel, context menu, or canvas wrapper is to list the sibling projects' `components/` directories. If a `TopNav` / `RightToolPanel` / `LeftContextMenu` / `Canvas` already exists, **import it**. A parallel implementation drifts within a single sprint and the maintenance cost compounds.

## What to flag to the user

- The prototype needs a UI pattern the design system does not have a token or principle for. A prototype is often where new patterns get noticed; the team may want to formalize it.
- You fell back to a primitive because no design-system component exists yet. Name it explicitly so the user knows what is a DS component vs. a one-off.
- A required asset (logo variant, illustration, icon) is missing. Do not improvise silently — name the gap. For **icons in a prototype**, a third-party stand-in (e.g. Lucide) is acceptable while iterating *if you disclose it to the user when you add it* and track it as an open gap; icon quality is a delivery gate — before final delivery every stand-in is swapped for a DS icon or the DS icon library is extended to cover it.

## Self-check before considering the prototype done

Walk this list before reporting completion. If any item is "no," fix it first.

- [ ] Is `bootstrap.css` imported exactly once, before any other styles?
- [ ] Does the document load Inter (verify in DevTools Network tab, not just by font-family declaration)?
- [ ] Are there zero hardcoded hex / rgb / hsl values outside the bootstrap?
- [ ] Are there zero hardcoded `px` / `rem` values for spacing, font-size, line-height, radius, or border-width outside the bootstrap?
- [ ] Are all logos sourced from `/logos/` (not drawn, not recolored)?
- [ ] Do all icons come from the shared icon library or `arcsite-icons` package (not drawn from scratch)? If any third-party stand-ins remain, were they disclosed to the user and flagged as open gaps — and, for a **final delivery**, resolved (DS icon or a library addition)?
- [ ] Were sibling-project `components/` directories listed before any chrome was implemented, and reusable components imported rather than re-implemented?
- [ ] Does toggling `<html class="dark">` produce a coherent dark mode (no broken contrast, no missing tokens)?
- [ ] Are all interactive states (hover, active, focus, disabled) bound to semantic tokens, not ad-hoc tints?
