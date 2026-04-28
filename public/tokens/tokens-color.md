# Color Tokens

ArcSite's color system is split into two Figma variable collections: `**color-global**` (raw color primitives) and `**color**` (semantic tokens that alias the globals and switch between light and dark mode). Designers, developers, and AI agents should almost always reach for a `color/*` semantic token — never bind a raw global directly.

---

## Why tokens?

Hard-coded hex values like `#398ae7` drift across surfaces. The same blue gets typed independently in Figma, iOS Swift, and web CSS, and they diverge the moment a designer tweaks brand or accessibility nudges contrast up. Tokens give every color a single authoritative name (`color/label/action/primary`), and the underlying value resolves per mode (light vs. dark). Hex changes in one place; every platform reads through.

The semantic layer also encodes *intent*: `color/label/danger/primary` doesn't just mean "red," it means "the primary text color for destructive intent on a default surface." That intent travels with the token across modes — in dark mode it resolves to a brighter red so it stays legible — and across platforms.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Layer 2 · Semantic tokens         color/***                 │
│  e.g. color/label/primary           (light/dark modes)       │
│       color/fill/danger/primary                              │
│       color/surface/container/default                        │
│       color/border/action/secondary                          │
├──────────────────────────────────────────────────────────────┤
│  Layer 1 · Global primitives       color/global/***          │
│  e.g. color/global/blue/60 = #398ae7   (single mode, raw)    │
│       color/global/gray/85  = #262626                        │
└──────────────────────────────────────────────────────────────┘
```

**Globals** (`color-global` collection) are raw colors. One mode, one value each. They have no opinion about light vs. dark — they're just the palette.

**Semantic tokens** (`color` collection) alias globals, carry intent, and have two modes (`light` and `dark`). The semantic layer is where the design system encodes how the palette gets used.

Direct binding rule: **layers and components bind to semantic tokens, not globals.** The only acceptable exceptions are inside the design system itself (e.g., a swatch sample on the color reference page) where you need to display a specific raw color. Everything else goes through semantic.

---

## The two modes (semantic tokens only)


| Mode    | Used for                                 |
| ------- | ---------------------------------------- |
| `light` | Default — light backgrounds, dark text   |
| `dark`  | Dark mode — dark backgrounds, light text |


Toggle the mode on a frame and every bound semantic token updates automatically. Globals don't have modes; they're frozen primitives.

---

## Intent groups

Semantic tokens are organized by *intent* — what the color is communicating, not what it looks like.


| Intent           | Maps to global family | Use for                                                    |
| ---------------- | --------------------- | ---------------------------------------------------------- |
| (neutral)        | `gray`                | Default text, surfaces, borders, dividers                  |
| `brand`          | `brand-orange`        | ArcSite brand expression — logo, hero CTAs, brand surfaces |
| `action`         | `blue`                | Interactive elements — primary buttons, links, focus rings |
| `success`        | `green`               | Positive confirmation — success messages, completed states |
| `caution`        | `orange`              | Warning, attention required — non-blocking alerts          |
| `caution-yellow` | `yellow`              | High-visibility caution — flags, advisory states           |
| `danger`         | `red`                 | Destructive intent, errors — delete, validation errors     |


`caution` and `caution-yellow` are both warnings but visually distinct. Pick `caution` (orange) for the default warning lane. Reach for `caution-yellow` when something needs to stand out alongside an existing `caution` element, or when the warning is advisory rather than action-required.

---

## The semantic ramp (primary → quaternary)

Most intent groups expose a four-tier ramp. The number indicates *prominence*, not value — `primary` is the strongest expression of the intent and `quaternary` is the most muted.


| Tier         | Use for                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| `primary`    | Strongest expression — main label color, headline button, lead icon      |
| `secondary`  | Second prominence — secondary actions, hover states, less prominent text |
| `tertiary`   | Third — disabled states, tertiary actions, ghost text                    |
| `quaternary` | Most muted — disabled-on-disabled, very subtle backgrounds               |


Not every category exposes the full ramp — `surface` and `border` typically only have `primary` and `secondary`, while `label` exposes all four because text needs more granular hierarchy.

---

## Increased-contrast variants

Every semantic token has an `-increased-contrast` sibling that uses a **transparency-based** value instead of a solid color.

```
color/label/primary                    → solid color, light/dark mode
color/label/primary-increased-contrast → black or white with alpha
```

**Why both exist.** A solid `gray/85` text on a `gray/00` background gives perfect 13:1 contrast — but on a `green/10` success surface, that same gray creates a faint olive tint where the gray bleeds into the green. The `-increased-contrast` variant uses `gray/transparency-on-light/85` (`#000000d9` — black with 85% alpha) instead, which mathematically darkens whatever surface it sits on without introducing a tint.

**Pick `-increased-contrast` when:** the foreground sits on a non-neutral or layered surface (intent-tinted backgrounds, photos, gradients, glass effects). Otherwise stick with the default — solid colors are simpler and don't compound when stacked.

---

## On-dark-increased-contrast variants

A second variant suffix, `-on-dark-increased-contrast`, freezes the token at its dark-mode value across both modes.

```
color/label/action/primary-on-dark-increased-contrast
  light mode → blue/50 (the bright blue)
  dark mode  → blue/50 (the bright blue)
```

**Why this exists.** Some surfaces are *always dark* regardless of the document's mode — a video player overlay, a dark-themed marketing banner inside a light app, a tooltip with a dark background. A normal token would resolve to its light-mode value (a darker blue) when the document is in light mode, which would disappear into the dark surface. Freezing at the dark value keeps the foreground readable.

**Pick `-on-dark-increased-contrast` when:** the surface is dark in both modes (intentionally dark UI inside a light document). Don't reach for it just because the surface is currently dark in dark mode — that's what the regular token already handles.

---

## Categories

The `color` collection has five top-level categories. Each has a clear, non-overlapping responsibility.

### `color/label/`* — text and icons

**Use for:** all text colors and most icon colors.

#### Neutral labels (no intent)


| Token                                               | Light → global             | Dark → global             |
| --------------------------------------------------- | -------------------------- | ------------------------- |
| `color/label/primary`                               | `gray/85` `#262626`        | `gray/00` `#ffffff`       |
| `color/label/secondary`                             | `gray/55` `#737373`        | `gray/40` `#999999`       |
| `color/label/tertiary`                              | `gray/25` `#bfbfbf`        | `gray/70` `#4d4d4d`       |
| `color/label/quaternary`                            | `gray/15` `#d9d9d9`        | `gray/80` `#333333`       |
| `color/label/primary-increased-contrast`            | trans-light/85 `#000000d9` | trans-dark/100 `#ffffff`  |
| `color/label/secondary-increased-contrast`          | trans-light/55 `#0000008c` | trans-dark/60 `#ffffff99` |
| `color/label/tertiary-increased-contrast`           | trans-light/25 `#00000040` | trans-dark/30 `#ffffff4d` |
| `color/label/quaternary-increased-contrast`         | trans-light/15 `#00000026` | trans-dark/20 `#ffffff33` |
| `color/label/primary-on-dark-increased-contrast`    | trans-dark/100 `#ffffff`   | trans-dark/100 `#ffffff`  |
| `color/label/secondary-on-dark-increased-contrast`  | trans-dark/60 `#ffffff99`  | trans-dark/60 `#ffffff99` |
| `color/label/tertiary-on-dark-increased-contrast`   | trans-dark/30 `#ffffff4d`  | trans-dark/30 `#ffffff4d` |
| `color/label/quaternary-on-dark-increased-contrast` | trans-dark/20 `#ffffff33`  | trans-dark/20 `#ffffff33` |


#### Intent labels

Each intent (`brand`, `action`, `success`, `caution`, `caution-yellow`, `danger`) exposes the same eleven tokens:

```
color/label/{intent}/primary
color/label/{intent}/secondary
color/label/{intent}/tertiary
color/label/{intent}/quaternary
color/label/{intent}/secondary-increased-contrast
color/label/{intent}/tertiary-increased-contrast
color/label/{intent}/quaternary-increased-contrast
color/label/{intent}/primary-on-dark-increased-contrast
color/label/{intent}/secondary-on-dark-increased-contrast
color/label/{intent}/tertiary-on-dark-increased-contrast
color/label/{intent}/quaternary-on-dark-increased-contrast
```

Note: intent labels skip `primary-increased-contrast` (the regular `primary` is already a saturated brand value).


| Intent           | `primary` light → dark                                    |
| ---------------- | --------------------------------------------------------- |
| `brand`          | `brand-orange/60` `#e3571c` → `brand-orange/50` `#f06326` |
| `action`         | `blue/60` `#398ae7` → `blue/50` `#479eff`                 |
| `success`        | `green/60` `#04b50b` → `green/50` `#04c20c`               |
| `caution`        | `orange/60` `#e37612` → `orange/50` `#f07d13`             |
| `caution-yellow` | `yellow/65` `#d6bc0f` → `yellow/50` `#f0d213`             |
| `danger`         | `red/60` `#e31c1c` → `red/50` `#fc3f3f`                   |


---

### `color/surface/*` — backgrounds

**Use for:** background fills of pages, cards, modals, sheets, popovers, panels.


| Token                                                | Light → global             | Dark → global             |
| ---------------------------------------------------- | -------------------------- | ------------------------- |
| `color/surface/default`                              | `gray/00` `#ffffff`        | `gray/90` `#1a1a1a`       |
| `color/surface/dim`                                  | `gray/02` `#fafafa`        | `gray/95` `#0d0d0d`       |
| `color/surface/container/default`                    | `gray/00` `#ffffff`        | `gray/90` `#1a1a1a`       |
| `color/surface/container/high`                       | `gray/06` `#f0f0f0`        | `gray/80` `#333333`       |
| `color/surface/container/higher`                     | `gray/10` `#e6e6e6`        | `gray/75` `#404040`       |
| `color/surface/container/default-increased-contrast` | `gray/00` `#ffffff`        | trans-dark/10 `#ffffff1a` |
| `color/surface/container/high-increased-contrast`    | trans-light/06 `#0000000f` | trans-dark/20 `#ffffff33` |
| `color/surface/container/higher-increased-contrast`  | trans-light/10 `#0000001a` | trans-dark/25 `#ffffff40` |
| `color/surface/container/action`                     | `blue/10` `#ebf4ff`        | `blue/95` `#1e252b`       |
| `color/surface/container/action-hover`               | `blue/20` `#d1e7ff`        | `blue/100` `#1f252c`      |
| `color/surface/container/brand`                      | `brand-orange/10`          | `brand-orange/95`         |
| `color/surface/container/success`                    | `green/10` `#ebffec`       | `green/95` `#2e322f`      |
| `color/surface/container/caution`                    | `orange/10` `#fff4eb`      | `orange/95` `#352d27`     |
| `color/surface/container/caution-yellow`             | `yellow/10` `#fffceb`      | `yellow/95` `#353327`     |
| `color/surface/container/danger`                     | `red/10` `#ffebeb`         | `red/95` `#382e2e`        |


`**default` vs. `dim`**: `default` is the canonical app background. `dim` is one shade further from white in light mode (and further from black in dark mode) — use it as the "outermost" background when a `default`-colored container needs to sit on top and visually separate.

`**container/default` → `high` → `higher**`: the elevation ramp. As surfaces stack (page → card → modal → popover), step up the ramp so each layer is visually distinct from the one below. `higher` is for the topmost floating element.

**Intent-tinted containers** (`container/action`, `container/brand`, `container/success`, etc.) are subtle tinted backgrounds for callouts, alerts, and feature highlights. Always pair their text with the matching `-increased-contrast` label tokens, since the surface itself is no longer neutral.

---

### `color/fill/*` — solid fills

**Use for:** the body color of buttons, badges, tags, toggles, progress bars — anything where the shape itself carries the intent.


| Token                                 | Light → global              | Dark → global               |
| ------------------------------------- | --------------------------- | --------------------------- |
| `color/fill/secondary`                | `gray/10` `#e6e6e6`         | `gray/75` `#404040`         |
| `color/fill/tertiary`                 | `gray/06` `#f0f0f0`         | `gray/80` `#333333`         |
| `color/fill/bright`                   | `gray/00` `#ffffff`         | `gray/90` `#1a1a1a`         |
| `color/fill/brand/primary`            | `brand-orange/60` `#e3571c` | `brand-orange/50` `#f06326` |
| `color/fill/brand/secondary`          | `brand-orange/20` `#fadacc` | `brand-orange/90` `#421b0a` |
| `color/fill/action/primary`           | `blue/60` `#398ae7`         | `blue/50` `#479eff`         |
| `color/fill/action/primary-hover`     | `blue/70` `#407fc7`         | `blue/40` `#8fc3ff`         |
| `color/fill/action/secondary`         | `blue/20` `#d1e7ff`         | `blue/90` `#2e4157`         |
| `color/fill/action/secondary-hover`   | `blue/30` `#b7d9ff`         | `blue/95` `#1e252b`         |
| `color/fill/action/tertiary`          | `blue/10` `#ebf4ff`         | `blue/95` `#1e252b`         |
| `color/fill/success/primary`          | `green/60` `#04b50b`        | `green/50` `#04c20c`        |
| `color/fill/success/secondary`        | `green/20` `#d0f5d1`        | `green/90` `#223622`        |
| `color/fill/caution/primary`          | `orange/60` `#e37612`       | `orange/50` `#f07d13`       |
| `color/fill/caution/secondary`        | `orange/20` `#fae2cc`       | `orange/90` `#42250a`       |
| `color/fill/caution-yellow/primary`   | `yellow/60` `#e3c712`       | `yellow/50` `#f0d213`       |
| `color/fill/caution-yellow/secondary` | `yellow/20` `#faf4cc`       | `yellow/90` `#423b0a`       |
| `color/fill/danger/primary`           | `red/60` `#e31c1c`          | `red/50` `#fc3f3f`          |
| `color/fill/danger/secondary`         | `red/20` `#fccaca`          | `red/90` `#440c0c`          |


`**primary` vs. `secondary`**: `primary` is the saturated, prominent fill (a CTA button body, a danger badge). `secondary` is the muted/tinted version (a hover background under a label, a subtle status pill).

`**-hover` variants** appear only on `action/primary` and `action/secondary` because those are the only fills explicitly designed for the interactive press path. Other intents handle hover by stepping the global tier up or down at the component level.

---

### `color/border/*` — borders and outlines

**Use for:** strokes on inputs, buttons, cards, focus rings, divider lines that visually separate regions.


| Token                                     | Light → global             | Dark → global             |
| ----------------------------------------- | -------------------------- | ------------------------- |
| `color/border/default`                    | `gray/15` `#d9d9d9`        | `gray/75` `#404040`       |
| `color/border/extra`                      | `gray/25` `#bfbfbf`        | `gray/65` `#595959`       |
| `color/border/default-increased-contrast` | trans-light/15 `#00000026` | trans-dark/15 `#ffffff26` |
| `color/border/extra-increased-contrast`   | trans-light/25 `#00000040` | trans-dark/25 `#ffffff40` |
| `color/border/brand/primary`              | `brand-orange/60`          | `brand-orange/50`         |
| `color/border/brand/secondary`            | `brand-orange/30`          | `brand-orange/80`         |
| `color/border/action/primary`             | `blue/60` `#398ae7`        | `blue/50` `#479eff`       |
| `color/border/action/secondary`           | `blue/30` `#b7d9ff`        | `blue/80` `#356aa6`       |
| `color/border/success/primary`            | `green/60` `#04b50b`       | `green/50` `#04c20c`      |
| `color/border/success/secondary`          | `green/30` `#a4eba7`       | `green/80` `#274a28`      |
| `color/border/caution/primary`            | `orange/60` `#e37612`      | `orange/50` `#f07d13`     |
| `color/border/caution/secondary`          | `orange/30` `#f3caa5`      | `orange/80` `#5d3109`     |
| `color/border/caution-yellow/primary`     | `yellow/60` `#e3c712`      | `yellow/50` `#f0d213`     |
| `color/border/caution-yellow/secondary`   | `yellow/30` `#f3e9a5`      | `yellow/80` `#5d5209`     |
| `color/border/danger/primary`             | `red/60` `#e31c1c`         | `red/50` `#fc3f3f`        |
| `color/border/danger/secondary`           | `red/30` `#f5a9a9`         | `red/80` `#661414`        |


`**default` vs. `extra`**: `default` is the standard border weight visually — input outlines, card borders. `extra` is a stronger border for cases where you need more separation (a card whose body color matches the page background, for example).

**Intent borders**: `primary` is for active/focused/error states (a focus ring, a danger input). `secondary` is for the default resting state of an intent component (a tinted notification card's outline).

---

### `color/divider/*` — divider lines

**Use for:** thin separator lines between content rows or sections inside a single surface — list item separators, settings groups, table row dividers.


| Token                                      | Light → global             | Dark → global             |
| ------------------------------------------ | -------------------------- | ------------------------- |
| `color/divider/default`                    | `gray/10` `#e6e6e6`        | `gray/80` `#333333`       |
| `color/divider/extra`                      | `gray/20` `#cccccc`        | `gray/70` `#4d4d4d`       |
| `color/divider/default-increased-contrast` | trans-light/10 `#0000001a` | trans-dark/20 `#ffffff33` |
| `color/divider/extra-increased-contrast`   | trans-light/20 `#00000033` | trans-dark/30 `#ffffff4d` |


`**divider` vs. `border`**: a divider is decorative — a hair line between two pieces of content that already belong together. A border *contains* — it's the edge of a region. If removing the line would visually merge two distinct regions, it's a `border`. If removing it would just remove visual rhythm, it's a `divider`.

---

## Globals reference (`color-global` collection)

The full primitive palette. All values single-mode (`global-value`), all scopes `ALL_SCOPES`. **Don't bind these directly to layers in product UI** — go through a semantic token.

### Gray scale


| Token                   | Hex       | Token                  | Hex       |
| ----------------------- | --------- | ---------------------- | --------- |
| `color/global/gray/100` | `#000000` | `color/global/gray/40` | `#999999` |
| `color/global/gray/95`  | `#0d0d0d` | `color/global/gray/30` | `#b2b2b2` |
| `color/global/gray/90`  | `#1a1a1a` | `color/global/gray/25` | `#bfbfbf` |
| `color/global/gray/85`  | `#262626` | `color/global/gray/20` | `#cccccc` |
| `color/global/gray/80`  | `#333333` | `color/global/gray/15` | `#d9d9d9` |
| `color/global/gray/75`  | `#404040` | `color/global/gray/10` | `#e6e6e6` |
| `color/global/gray/70`  | `#4d4d4d` | `color/global/gray/06` | `#f0f0f0` |
| `color/global/gray/65`  | `#595959` | `color/global/gray/02` | `#fafafa` |
| `color/global/gray/60`  | `#666666` | `color/global/gray/00` | `#ffffff` |
| `color/global/gray/55`  | `#737373` |                        |           |
| `color/global/gray/50`  | `#808080` |                        |           |


### Color families

Each color family — `blue`, `green`, `red`, `yellow`, `orange`, `brand-orange` — exposes a 10–12 step ramp. The numeric value indicates lightness: lower numbers are darker, higher numbers are lighter. `60` is typically the saturated mid-tone used for `primary` intent on light mode; `50` is the equivalent on dark mode.


| Family         | Range        | Notes                                       |
| -------------- | ------------ | ------------------------------------------- |
| `blue`         | `05` → `100` | Action/interactive — links, primary buttons |
| `green`        | `10` → `95`  | Success — confirmation, completed states    |
| `red`          | `10` → `95`  | Danger — destructive, errors                |
| `yellow`       | `10` → `95`  | Caution-yellow — high-visibility advisory   |
| `orange`       | `10` → `95`  | Caution — standard warning                  |
| `brand-orange` | `10` → `95`  | ArcSite brand                               |


### Transparency families

Each family additionally exposes transparency variants used by `-increased-contrast` semantic tokens.


| Subgroup                           | Composition             | Use case                                      |
| ---------------------------------- | ----------------------- | --------------------------------------------- |
| `{family}/transparency-on-light/`* | source color with alpha | Foregrounds on light or tinted-light surfaces |
| `{family}/transparency-on-dark/*`  | source color with alpha | Foregrounds on dark or tinted-dark surfaces   |
| `gray/transparency-on-light/*`     | black with alpha        | Increased-contrast neutrals on light          |
| `gray/transparency-on-dark/*`      | white with alpha        | Increased-contrast neutrals on dark           |


The trailing number is the alpha percentage (e.g., `transparency-on-light/40` is the source color at 40% opacity).

---

## Routing rules — how to pick a token

A decision sequence to follow before binding any color. AI agents should walk through these in order; designers can use it as a sanity check.

**1. What category of element are you coloring?**

- Text or icon → `color/label/`*
- A page/card/modal background → `color/surface/*`
- The body of a button, badge, or tag → `color/fill/*`
- A border or outline → `color/border/*`
- A separator line within a surface → `color/divider/*`

**2. Does it carry an intent?**

- No specific intent (default text, neutral card) → use the neutral path: `color/label/primary`, `color/surface/default`, `color/fill/secondary`, `color/border/default`
- Has intent → pick the intent path: `color/{category}/{intent}/{tier}`

**3. What prominence?**

- Most important / saturated → `primary`
- Hover or second prominence → `secondary` (or `primary-hover` where it exists)
- Disabled / muted → `tertiary`
- Most muted / disabled-on-disabled → `quaternary`

**4. Is the surface neutral or tinted?**

- Neutral (white/gray/black) → use the regular semantic
- Tinted (intent-colored container, photo, gradient) → use the `-increased-contrast` variant

**5. Is the surface always-dark regardless of document mode?**

- No → done
- Yes (overlay, dark-themed module in a light app) → use `-on-dark-increased-contrast`

---

## Anti-patterns

Things to actively avoid. AI agents should treat these as hard rules, not preferences.

**Don't bind globals directly to layers in product UI.** If you find yourself reaching for `color/global/blue/60`, stop — there's a `color/{category}/action/primary` that does the same thing and survives mode changes. The only acceptable globals usage is inside the design system reference (swatches, the color page itself).

**Don't pick by hex value.** "I need a blue at #398ae7" is the wrong question. "I need the action primary" is the right question. The hex may change next quarter; the intent won't.

**Don't mix `-increased-contrast` and regular tokens on the same surface.** If the surface needs increased contrast, every foreground on it should use the `-increased-contrast` variant. A solid label next to a transparency label on the same tinted surface produces visible color drift.

**Don't reach for `caution-yellow` as a primary warning.** It's an *additional* lane for advisory/high-visibility cases. The default warning is `caution` (orange).

**Don't skip the ramp.** If a design needs four levels of label prominence, use `primary/secondary/tertiary/quaternary` — don't substitute random globals for finer gradations. The ramp is calibrated for legibility across modes; freelance choices break that.

---

## Code examples

### CSS

```css
.label--primary {
  color: var(--color-label-primary);             /* light: #262626 / dark: #ffffff */
}

.label--primary-on-tinted {
  color: var(--color-label-primary-increased-contrast); /* black with alpha — adapts to any tint */
}

.button--cta {
  background: var(--color-fill-action-primary);
  color: var(--color-label-primary-on-dark-increased-contrast);
}

.card--success {
  background: var(--color-surface-container-success);
  border: 1px solid var(--color-border-success-secondary);
  color: var(--color-label-success-primary-increased-contrast);
}
```

### SwiftUI (mapped via Asset Catalog colors)

```swift
Text("Hello")
  .foregroundStyle(Color("label/primary"))

Button("Save") { }
  .background(Color("fill/action/primary"))
  .foregroundStyle(Color("label/primary-on-dark-increased-contrast"))

VStack {
  Text("Saved").foregroundStyle(Color("label/success/primary-increased-contrast"))
}
.background(Color("surface/container/success"))
```

### Jetpack Compose (mapped via theme)

```kotlin
Text(
  text = "Hello",
  color = Theme.colors.label.primary,
)

Button(
  colors = ButtonDefaults.buttonColors(
    containerColor = Theme.colors.fill.action.primary,
    contentColor = Theme.colors.label.primaryOnDarkIncreasedContrast,
  ),
) { Text("Save") }
```

---

## Source of truth

Variables live in the Figma library `QH0keaNSAxGwUxwUV3unEi`. The two collections:

- `**color-global**` — single mode (`global-value`), 151 raw color primitives
- `**color**` — two modes (`light`, `dark`), 131 semantic tokens, all aliases pointing to `color-global`

When this doc and Figma disagree, Figma wins. Update this doc when:

- A semantic token changes its global mapping (the alias chain moves)
- A new intent group, category, or variant is added
- A global is added, deleted, or renamed
- The increased-contrast or on-dark rules change

Keep the routing rules and anti-patterns sections current especially — those are what AI agents read first when choosing a token.