# Reference: AntD vs. ArcSite token conflict

The hardest case in Mode 2 (product codebase). When an ArcSite component-level token doesn't map cleanly onto an Ant Design component's customization surface, **stop and ask the user**.

## How to recognize a conflict

- The ArcSite token specifies a value for a property AntD doesn't expose in its theme tokens.
- The ArcSite token specifies a structural change (padding inside an internal element, a border on a sub-part) that AntD only allows via deep CSS overrides.
- AntD's component has its own opinionated default (e.g., focus ring style, animation curve) that contradicts an ArcSite principle.
- Two ArcSite tokens collapse into one AntD theme token, or vice versa — there's no 1:1 mapping.

## How to surface the conflict

Don't write the override silently. Don't accept the AntD default silently. Present the trade-off concretely with code-level specificity, then wait for the user.

## Template for the question

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

## When to lean toward each option (without prescribing)

These are observations to help frame the user's choice, not rules:

- **A (override)** tends to fit when the visual divergence is high-visibility (brand colors, primary CTA styling) and the team accepts the upgrade-fragility cost.
- **B (accept default)** tends to fit when the property is low-visibility (internal padding by 2px, animation timing) and the cost of overriding outweighs the visual gain.
- **C (replace)** tends to fit when this component is already an outlier in the codebase, or the team is gradually migrating off AntD.

State the observation if it's relevant, but the user makes the call.

## When NOT to ask

If the ArcSite token *does* map cleanly onto an AntD ConfigProvider theme token, just apply it. Asking on every token would be noise. The question is reserved for actual conflicts.

## Where to apply tokens that DO map cleanly

Prefer ConfigProvider at the app root:

```tsx
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      // Mapping ArcSite → AntD theme tokens
      colorPrimary: 'var(--arcsite-color-accent)',
      borderRadius: 'var(--arcsite-radius-md)',
      // ...
    },
  }}
>
  <App />
</ConfigProvider>
```

This keeps the diff small and avoids per-instance overrides.
