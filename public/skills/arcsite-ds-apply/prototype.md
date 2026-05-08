# Reference: Prototype mode

The cleanest case. No production codebase, no third-party UI library to fight with. Use this as the default approach for any standalone prototype.

## Workflow

1. Fetch `https://arctuition.github.io/design-system/llms.txt`.
2. Identify which token categories the prototype needs (color, spacing, typography, radius, elevation, motion).
3. Read the relevant principle docs that apply to the screen type being built.
4. Set up tokens at the top of the prototype as CSS custom properties or in a Tailwind/styled-components config.
5. Build using only those tokens — no raw hex, no magic px values.

## Example pattern (HTML/CSS prototype)

```html
<style>
  :root {
    /* Pulled from ArcSite llms.txt — color tokens */
    --color-surface-primary: [actual value from llms.txt];
    --color-text-primary: [actual value from llms.txt];
    --color-accent: [actual value from llms.txt];

    /* Spacing */
    --spacing-sm: [actual value];
    --spacing-md: [actual value];

    /* Radius */
    --radius-md: [actual value];
  }

  /* Using elevation.raised per ArcSite "depth signals interactivity" principle */
  .card {
    background: var(--color-surface-primary);
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
  }
</style>
```

## Example pattern (React + Tailwind prototype)

If the prototype uses Tailwind, extend the config with ArcSite tokens rather than inlining values:

```js
// tailwind.config.js — values pulled from ArcSite llms.txt
module.exports = {
  theme: {
    extend: {
      colors: {
        'arcsite-surface-primary': '[value from llms.txt]',
        // ...
      },
    },
  },
};
```

## What to flag to the user

- If the prototype needs a UI pattern the design system doesn't have a principle or token for, say so before improvising. A prototype is often where new patterns get noticed — the team may want to formalize it.
- If you fall back to a primitive because no design-system component exists yet, name it explicitly in the response so the user knows what's a DS component vs. a one-off.
