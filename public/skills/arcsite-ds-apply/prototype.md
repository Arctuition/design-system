# Reference: Prototype mode

Use this guide whenever you are building standalone ArcSite UI from scratch — prototypes, demos, marketing pages, internal tools — anywhere there is no production codebase or third-party UI library to fight with.

## Non-negotiable bootstrap

Before writing any component CSS, do these three things, in order:

1. **Import the bootstrap stylesheet** — single line in the `<head>` (or top of the entry CSS for a React/Vite prototype):

   ```html
   <link rel="stylesheet" href="https://arctuition.github.io/design-system/tokens/bootstrap.css">
   ```

   This loads Inter (weights 400/500/600/800), defines every CSS variable referenced in `llms.txt`, and wires up dark-mode swap. **Do not** hand-copy values from `llms.txt` into a local `:root` — that is the failure mode this stylesheet exists to prevent.

2. **Pick a logo from `/logos/`** (do not redraw, recolor, or invent):
   - Light background → `glyph-and-text.svg` (or `glyph.svg` if space is tight)
   - Dark background, photography, video → `glyph-and-text-on-dark.svg` (or `glyph-on-dark.svg`)

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
    <link rel="stylesheet" href="https://arctuition.github.io/design-system/tokens/bootstrap.css">
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
    <img src="https://arctuition.github.io/design-system/logos/glyph-and-text.svg" alt="ArcSite">
    <!-- ... -->
  </body>
</html>
```

## Example pattern (React + Tailwind 4 prototype)

Tailwind 4 supports CSS-variable arbitrary values directly — no config extension needed:

```jsx
// In your entry CSS (before tailwind directives):
//   @import url("https://arctuition.github.io/design-system/tokens/bootstrap.css");

<button className="bg-(--color-fill-action-primary) text-(--color-label-on-action) p-(--size-padding-md) rounded-(--size-radius-md)">
  Sign in
</button>
```

For older Tailwind 3 prototypes, extend `tailwind.config.js` to alias the variables (don't copy the values themselves).

## Anti-patterns (do not do these)

These are the failures that show up most often when LLMs default to training-set averages instead of reading this guide. Treat them as hard prohibitions.

1. **No system font stack.** Never write `font-family: -apple-system, system-ui, sans-serif` (or any variant). Inter is loaded by the bootstrap; reference `var(--text-*)` tokens or `font-family: Inter`.
2. **No raw values in component CSS.** No hardcoded `font-size: 14px`, `color: #3B82F6`, `padding: 16px`, `border-radius: 8px`, etc. All values must come from token variables. Hex literals and bare px belong only inside the bootstrap (which is generated, not hand-edited).
3. **No translating values across sources.** Do not read a hex from `llms.txt` and paste it into your CSS; do not read a Figma variable's resolved value and paste it. Always reference by token name so source updates propagate.
4. **No invented or recolored brand assets.** Do not draw a new logo. Do not apply CSS filters to recolor the provided logos. If you need a variant that does not exist (e.g. monochrome on a tinted background), flag to the user.
5. **No `:root` redefinition.** Do not re-declare token variables in your prototype's stylesheet — the bootstrap is the only source. Overrides break dark-mode swap and create silent drift.

## What to flag to the user

- The prototype needs a UI pattern the design system does not have a token or principle for. A prototype is often where new patterns get noticed; the team may want to formalize it.
- You fell back to a primitive because no design-system component exists yet. Name it explicitly so the user knows what is a DS component vs. a one-off.
- A required asset (logo variant, illustration, icon) is missing. Do not improvise — name the gap.

## Self-check before considering the prototype done

Walk this list before reporting completion. If any item is "no," fix it first.

- [ ] Is `bootstrap.css` imported exactly once, before any other styles?
- [ ] Does the document load Inter (verify in DevTools Network tab, not just by font-family declaration)?
- [ ] Are there zero hardcoded hex / rgb / hsl values outside the bootstrap?
- [ ] Are there zero hardcoded `px` / `rem` values for spacing, font-size, line-height, radius, or border-width outside the bootstrap?
- [ ] Are all logos sourced from `/logos/` (not drawn, not recolored)?
- [ ] Do all icons come from the shared icon library or `arcsite-icons` package (not drawn from scratch)?
- [ ] Does toggling `<html class="dark">` produce a coherent dark mode (no broken contrast, no missing tokens)?
- [ ] Are all interactive states (hover, active, focus, disabled) bound to semantic tokens, not ad-hoc tints?
