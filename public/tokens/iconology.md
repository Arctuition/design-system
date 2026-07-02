# Iconology

Icons are a core part of the ArcSite visual language. They carry meaning at a glance, so they must stay visually consistent, predictable to find, and safe to recolor across light and dark themes. This page is the working specification for how our icons are drawn, sized, colored, and named. It reflects the rules we build to going forward — the library still contains older icons that predate it (see **Legacy & known issues** at the end).

## Principles

- **One glyph, one meaning.** An icon names a thing or an action, never a color or a screen. The same concept looks the same everywhere.
- **Themeable by default.** A UI icon inherits its color from its context via `currentColor`. Hardcoded color is the exception, and when it happens the name must say so.
- **Drawn per size, not scaled.** A 16px icon is redrawn for legibility, not a shrunken 24px icon.
- **Predictable names.** Anyone should be able to guess an icon's name from what it is, and read its style and size straight from the name.

## Anatomy & grid

Every icon is drawn as filled vector paths (compound paths), colored with `fill`. We do not use SVG `stroke` — even "outline"-looking icons are built from thin filled shapes. This keeps scaling, recoloring, and boolean edits consistent.

- **24px canvas** — 2px padding on all sides, leaving a **20×20 live area**. This is the default drawing grid.
- **16px canvas** — 1px padding, **14×14 live area**. Redraw for this size: fewer details, heavier relative weight, snap to the pixel grid.
- **Keyshapes** for optical balance — square ≈ 20×20, circle ≈ ⌀20, portrait ≈ 20×16, landscape ≈ 16×20. Wide/tall glyphs may fill the padding so they read at the same visual size as square ones.
- **Pixel alignment** — snap vertices and edges to whole pixels; keep corner radii and visual weight consistent across a set.

## Sizes

Size is always the last token in the name, written **`HxW` — height first, then width** (e.g. `24x24`, `16x10`).

**Why height first:** for icons, height is the primary dimension people reason about — it's what you match to the surrounding text or UI density. Width often varies within the same height bucket (a 16-tall arrow might be 10, 11, or 12 wide depending on the glyph), but everything in that bucket is treated as the "16 set" and used together. So `chevron right 16x10` is **16px tall, 10px wide**. Match the **height** to context, not the width.

| Size | Platform / role | Where it's used |
|---|---|---|
| **16×16** | Web — dense UI | Menus, table rows, inline text, small buttons, input adornments |
| **24×24** | Web — default UI | Toolbars, nav, primary actions — the workhorse size |
| **30×30** | iOS / mobile app | The standard icon size in the native iOS app |
| **40 / 48 / 64** | Illustrative | Empty states, upload drop zones, feature callouts, onboarding |
| **Non-square** (e.g. `16x10`, `24x12`) | Intrinsic shape | Only when the glyph is genuinely non-square (chevrons, grips, dividers). Keep `HxW` honest. |

New **web** work targets **16 and 24** (plus 40/48/64 for illustration); new **iOS** work targets **30**.

## Color & style variants

This is the most important rule to get right, because it decides whether an icon can be recolored in code. There are three families. The name's *style suffix* must match the implementation.

| Family | Name suffix | Recolor via `currentColor`? | Implementation |
|---|---|---|---|
| Default (outline) | *— none —* | Yes | Filled paths, all `fill="currentColor"` |
| Fill (solid) | `fill` | Yes | Filled paths, all `fill="currentColor"` |
| Duotone | `duotone` | Yes — one input color, two shades | Two layers, both `currentColor`; secondary layer at `fill-opacity="0.3"` |
| Color | `color <name>` | No — fixed | Hardcoded hex per layer |

### 1. Default — no color suffix

If an icon has no color-related suffix, it is a single-color SVG whose color is set by `currentColor`. It inherits the surrounding text color, so it adapts to light/dark and to any context (buttons, disabled states, hover) for free. This covers both the outline default and the `fill` variant.

```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="..." fill="currentColor"/>
</svg>
```

### 2. Duotone — two shades from one color

A duotone icon is built from **two layers, both using `currentColor`**. The secondary (background) layer is set to a reduced opacity so a single input color renders as two shades — a light fill and a solid foreground. It stays fully themeable: set one color, get a coherent two-tone icon in any theme.

```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- secondary layer: same color, reduced opacity -->
  <path d="..." fill="currentColor" fill-opacity="0.3"/>
  <!-- primary layer: full opacity -->
  <path d="..." fill="currentColor"/>
</svg>
```

Use one canonical secondary opacity across the whole set — **0.3** — so duotone icons feel like a family. Do **not** implement duotone by baking in two hardcoded colors:

```html
<!-- Do NOT do this: two hardcoded blues, not themeable -->
<path d="..." fill="#9CCAFF"/>
<path d="..." fill="#398AE7"/>
```

### 3. Color — fixed, non-themeable

A color icon bakes specific color values into the SVG. It **cannot** be recolored from code, so it is reserved for cases where a fixed color is intentional: illustrations, marketing glyphs, or brand marks. Because a fixed color is a deliberate choice, the name **must carry an explicit color-name suffix** so different color versions of the same glyph stay distinguishable.

```html
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="..." fill="#8FC3FF"/>
  <path d="..." fill="#398AE7"/>
</svg>
<!-- name: sparkles color blue 24x24 -->
```

## Naming convention

A name reads left to right from the most general to the most specific, and always ends with size:

**`name` → `qualifier(s)` → `style` → `HxW`**

- **name** — the object or action, a lowercase noun (`chevron`, `folder`, `user`, `check`).
- **qualifier(s)** — zero or more modifiers that pick one glyph out of a family: shape (`circle`, `square`), direction (`up`, `down`, `left`, `right`), or state (`open`, `slash`, `badge`). Keep the order natural and consistent within a family.
- **style** — exactly one of: *nothing* (default), `fill`, `duotone`, or `color <name>`. Never combine two style words; never use `solid` (use `fill`) or `outline` (that's the default — no suffix).
- **size** — `HxW` in pixels, always last.

All tokens are **lowercase**, space-separated, and use **singular** nouns. Add synonyms as searchable *tags* rather than folding them into the name.

| Name | Reads as |
|---|---|
| `search 24x24` | search, default outline, 24×24, themeable |
| `user fill 24x24` | user, filled, themeable |
| `check circle fill 16x16` | check inside a circle, filled, 16×16 |
| `email duotone 24x24` | email, two-tone from one color |
| `chevron right 16x10` | chevron pointing right, 16px tall × 10px wide |
| `sparkles color blue 24x24` | sparkles, fixed blue, not themeable |

### Do & don't

| Do | Don't | Why |
|---|---|---|
| `proposal fill 16x16` | `proposal solid 16x16` | One word for "filled": `fill`. |
| `floorplan 24x24` | `floorplan outline 24x24` | Outline is the default — no style suffix. (Unless "outline" is part of the meaning.) |
| `sparkles color blue 24x24` | `sparkles blue 24x24` | Fixed color must be flagged with `color`, not just a hue word. |
| `redo 24x24` / `redo arrow 24x24` | `redo2 24x24` | Disambiguate with a real qualifier, not a number. |
| `linked indicator 16x16` | `linked Indicator 16x16` | All lowercase. |

## SVG hygiene checklist

- Include a `viewBox` matching the canvas (`0 0 24 24`); no clip paths or hidden layers.
- Monochrome icons: every fillable path is `fill="currentColor"` — no `stroke`, no hardcoded hex.
- Duotone: two `currentColor` layers, secondary at `fill-opacity="0.3"`.
- Color: hardcoded hex, and the name carries `color <name>`.
- Strip editor metadata, comments, and unused `id`/`class` attributes; merge into as few paths as the glyph allows.
- The file/icon name matches the convention above so it groups and searches correctly in the library.

## Legacy & known issues

The library predates this spec, so a number of icons don't follow it yet. These are tracked here as a migration backlog — new icons should conform now; existing ones will be reworked over time. Counts are from the current library (552 icons).

| Issue | Scope | Fix |
|---|---|---|
| **Duotone hardcodes two colors** instead of `currentColor` + opacity | ~67 `duotone` icons (verified: `email duotone` uses `#9CCAFF`/`#398AE7`; `warning circle duotone` uses `#FCCACA`/`#E31C1C`) | Rebuild as two `currentColor` layers, secondary at `0.3`. Highest priority — these look broken in dark mode and can't be recolored. |
| `solid` used instead of `fill` | 2 icons: `proposal solid 16x16`, `file pdf solid 16x16` | Rename `solid` → `fill`. |
| **Color icons under-specified** | Only `sparkles color blue` follows `color <name>`. `color pallette` misuses `color` and misspells "palette". | Rename `color pallette` → `palette`. Audit illustrative/brand glyphs: if hardcoded, add `color <name>`; if monochrome, confirm `currentColor`. |
| **Ad-hoc numeric disambiguators** | ~9: `redo2`, `undo2`, `rotate 90 2`, `share 2`, `calibrate 2`, `exclamation duotone 2`, `payment card duotone 2` | Replace the trailing number with a descriptive qualifier. |
| **Data hygiene** | `broken file 30x30 30x30` (duplicated size); `linked Indicator 16x16` (stray capital) | Fix the name strings. |
| **Modifier-order drift** | `chevron down small`, `chevron large left`, `triangle large down` — the size/optical word floats position | Reorder to `name → qualifier → style → size`. |
| **Stray off-grid size** | `20x20` (2 icons) | Consolidate onto the 16/24 web grid (or 30 for iOS). Note: `30x30` is **not** off-grid — it is the standard iOS size. |
