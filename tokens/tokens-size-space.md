# Size & Space Tokens

ArcSite's size and spacing system is built on four layers of design tokens stored in a single **size** variable collection in Figma. Switch the mode once on any frame and every bound token updates — padding, gaps, heights, radii, and typography — simultaneously across all six modes: Device Mobile, Device Tablet, Web Mobile, Web Tablet, Web Desktop, and Web Desktop Large.

Breakpoints are stored separately in a **breakpoint** collection — they're the viewport widths that *trigger* the size-mode switches, so they're conceptually independent from the size scale itself.

---

## Why tokens?

Hard-coded numbers like `gap: 16px` drift. The same value gets typed independently in Figma frames, iOS SwiftUI layouts, and web CSS, and they diverge the moment the spec changes. Tokens give that number a single authoritative name (`size/spacing-inline-md`) that every platform reads from one source of truth.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Layer 3 · Component tokens    size/comp/***             │
│  e.g. size/comp/button/height-md = size/height-md        │
├──────────────────────────────────────────────────────────┤
│  Layer 2 · Semantic tokens     size/***                  │
│  e.g. size/spacing-inline-md  (resolved per mode)        │
│       size/spacing-stack-lg                              │
│       size/padding-component-sm                          │
│       size/padding-md                                    │
├──────────────────────────────────────────────────────────┤
│  Layer 1 · Global scale        size-global/***           │
│  e.g. size-global/16 = 16 (raw value, mode-independent)  │
└──────────────────────────────────────────────────────────┘
```

**Global scale** — raw numbers on an even step (2, 4, 6, 8 … 512). No meaning, just math.

**Semantic tokens** — alias global values, carry intent, and change per mode. Split into four groups with clear, non-overlapping responsibilities.

**Component tokens** — alias semantic tokens and belong to one component. The final step before a designer applies a token to a layer.

---

## The six modes

| Mode              | Represents                                 | Viewport range       | Sizing basis |
| ----------------- | ------------------------------------------ | -------------------- | ------------ |
| Device Mobile     | iPhone / Android phone                     | native app           | iOS HIG (pt) |
| Device Tablet     | iPad / Android tablet                      | native app           | iOS HIG (pt) |
| Web Mobile        | Browser on phone / compact viewport        | `< 768 px`           | px           |
| Web Tablet        | Browser on tablet / narrow laptop          | `768 – 1199 px`      | px           |
| Web Desktop       | Browser on standard laptop / 1080p monitor | `1200 – 1399 px`     | px           |
| Web Desktop Large | Browser on QHD / 4K / ultrawide monitor    | `≥ 1400 px`          | px           |

Web mode switches are driven by the breakpoint tokens (see [Breakpoints](#breakpoints) below). Device modes are runtime constants on their respective native platforms — they don't switch with viewport width.


---

## Semantic token groups

### Spacing — inline (`size/spacing-inline-*`)

**Use for: horizontal gaps between sibling elements.**
Icon ↔ label in a button, chips in a row, nav tab items, action button groups, form fields side by side.


| Token                    | Device Mobile | Device Tablet | Web Mobile | Web Tablet | Web Desktop | Web Desktop Large |
| ------------------------ | ------------- | ------------- | ---------- | ---------- | ----------- | ----------------- |
| `size/spacing-inline-xs` | 4             | 4             | 4          | 4          | 4           | 4                 |
| `size/spacing-inline-sm` | 8             | 8             | 8          | 8          | 8           | 8                 |
| `size/spacing-inline-md` | 12            | 12            | 12         | 12         | 16          | 16                |
| `size/spacing-inline-lg` | 16            | 20            | 16         | 20         | 24          | 24                |
| `size/spacing-inline-xl` | 24            | 24            | 20         | 24         | 32          | 40                |


xs and sm are universal — icon-to-text gaps and chip spacing don't change between platforms. md–xl grow as screens widen, with `xl` getting one extra notch on Web Desktop Large to give section-level toolbars more air on wide monitors.

---

### Spacing — stack (`size/spacing-stack-*`)

**Use for: vertical gaps between stacked elements.**
List items, stacked form fields, cards in a feed, space between content sections on a page.


| Token                   | Device Mobile | Device Tablet | Web Mobile | Web Tablet | Web Desktop | Web Desktop Large |
| ----------------------- | ------------- | ------------- | ---------- | ---------- | ----------- | ----------------- |
| `size/spacing-stack-xs` | 4             | 4             | 4          | 4          | 4           | 4                 |
| `size/spacing-stack-sm` | 8             | 8             | 8          | 8          | 8           | 8                 |
| `size/spacing-stack-md` | 16            | 16            | 12         | 16         | 16          | 20                |
| `size/spacing-stack-lg` | 24            | 24            | 20         | 24         | 24          | 32                |
| `size/spacing-stack-xl` | 32            | 48            | 24         | 32         | 32          | 48                |


xs/sm match inline for tight micro-spacing. md–xl diverge: Device Tablet's xl is 48pt because vertical page rhythm is more generous on large screens; Web Desktop Large bumps `md`/`lg`/`xl` for the same reason.

---

### Padding (`size/padding-*`)

**Use for: inset padding inside container surfaces.**
Page content areas, modal bodies, drawers, side panels, sheets. Values are intentionally larger than component padding to give surfaces breathing room. Device values respect iOS HIG (10pt compact, 20pt regular); web values follow common 8-grid multiples.


| Token             | Device Mobile | Device Tablet | Web Mobile | Web Tablet | Web Desktop | Web Desktop Large |
| ----------------- | ------------- | ------------- | ---------- | ---------- | ----------- | ----------------- |
| `size/padding-xs` | 10            | 10            | 8          | 8          | 8           | 10                |
| `size/padding-sm` | 16            | 20            | 12         | 16         | 16          | 20                |
| `size/padding-md` | 20            | 24            | 16         | 20         | 24          | 32                |
| `size/padding-lg` | 24            | 32            | 20         | 28         | 32          | 40                |
| `size/padding-xl` | 32            | 48            | 24         | 40         | 48          | 64                |


---

### Padding — component (`size/padding-component-*`)

**Use for: inset padding inside interactive controls.**
Button horizontal padding, input field padding, tag/chip padding. Device sizes use a 6pt base to ensure legible tap targets per iOS HIG.


| Token                       | Device Mobile | Device Tablet | Web Mobile | Web Tablet | Web Desktop | Web Desktop Large |
| --------------------------- | ------------- | ------------- | ---------- | ---------- | ----------- | ----------------- |
| `size/padding-component-xs` | 6             | 6             | 4          | 4          | 4           | 4                 |
| `size/padding-component-sm` | 12            | 12            | 8          | 8          | 8           | 10                |
| `size/padding-component-md` | 16            | 20            | 12         | 12         | 12          | 14                |
| `size/padding-component-lg` | 20            | 24            | 16         | 20         | 20          | 24                |
| `size/padding-component-xl` | 24            | 28            | 20         | 24         | 24          | 28                |


---

### Icon sizes


| Token          | All modes |
| -------------- | --------- |
| `size/icon-sm` | 16        |
| `size/icon-md` | 24        |
| `size/icon-lg` | 30        |


---

### Border radius


| Token              | Device Mobile | Device Tablet | Web Mobile | Web Tablet | Web Desktop | Web Desktop Large |
| ------------------ | ------------- | ------------- | ---------- | ---------- | ----------- | ----------------- |
| `size/radius-none` | 0             | 0             | 0          | 0          | 0           | 0                 |
| `size/radius-xs`   | 4             | 4             | 2          | 2          | 2           | 2                 |
| `size/radius-sm`   | 6             | 6             | 4          | 4          | 4           | 4                 |
| `size/radius-md`   | 10            | 10            | 6          | 6          | 6           | 8                 |
| `size/radius-lg`   | 16            | 20            | 8          | 8          | 8           | 10                |
| `size/radius-xl`   | 20            | 24            | 12         | 12         | 12          | 16                |
| `size/radius-full` | 9999          | 9999          | 9999       | 9999       | 9999        | 9999              |


---

## Component token groups

Component tokens are a thin alias layer. They keep component-specific decisions explicit (`dialog uses padding-layout-md`) without adding new raw values.

### Button

| Token                                       | Web (mobile/tablet/desktop/large) | Device (mobile/tablet)        |
| ------------------------------------------- | --------------------------------- | ----------------------------- |
| `size/comp/button/height-xl`                | `size-global/48`                  | `size-global/50`              |
| `size/comp/button/height-lg`                | `size-global/40`                  | `size-global/44`              |
| `size/comp/button/height-md`                | `size-global/32`                  | `size-global/36`              |
| `size/comp/button/height-sm`                | `size-global/24`                  | `size-global/28`              |
| `size/comp/button/padding-horizontal-xl`    | `size/padding-component-lg`       | `size/padding-component-lg` (mobile uses `size/padding-lg`) |
| `size/comp/button/padding-horizontal-lg`    | `size/padding-component-lg`       | `size-global/18`              |
| `size/comp/button/padding-horizontal-md`    | `size/padding-component-md`       | `size-global/12`              |
| `size/comp/button/padding-horizontal-sm`    | `size/padding-component-sm`       | `size/padding-component-sm`   |
| `size/comp/button/radius-default`           | `size/radius-sm`                  | `size/radius-md`              |
| `size/comp/button/radius-rounded`           | `size/radius-full`                | `size/radius-full`            |
| `size/comp/button/gap`                      | `size/spacing-inline-sm`          | `size/spacing-inline-sm`      |

**Per-mode alias note**: Most button comp tokens alias to the same semantic across all modes, but `radius-default`, `height-*`, and `padding-horizontal-{lg,md}` deliberately diverge between web and device platforms — native iOS/Android conventions prefer slightly larger touch targets and softer corners. The CMS round-trip preserves per-mode alias differences faithfully (see PR #29). When you switch mode in Figma, the bound layer recomputes against that mode's alias chain.


### Input / Text field


| Token                                       | Aliases                           |
| ------------------------------------------- | --------------------------------- |
| `size/comp/input/height-sm` … `lg`          | `size/height-sm` … `lg`           |
| `size/comp/input/padding-horizontal`        | `size/padding-component-lg`       |
| `size/comp/input/padding-vertical-sm/md/lg` | `size/padding-component-xs/sm/md` |
| `size/comp/input/icon-size`                 | `size/icon-md`                    |
| `size/comp/input/radius`                    | `size/radius-md`                  |


### Dialog / Modal


| Token                         | Aliases           |
| ----------------------------- | ----------------- |
| `size/comp/dialog/padding-sm` | `size/padding-sm` |
| `size/comp/dialog/padding-md` | `size/padding-md` |
| `size/comp/dialog/padding-lg` | `size/padding-lg` |
| `size/comp/dialog/padding-xl` | `size/padding-xl` |


`dialog/padding-md` is the default for confirmation dialogs. Use `lg` for information-dense drawers and `xl` for full-panel workflows. All dialog padding aliases the `size/padding-*` scale directly.

### Tag / Badge


| Token                              | Aliases                     |
| ---------------------------------- | --------------------------- |
| `size/comp/tag/height-sm/md`       | `size/height-xs/sm`         |
| `size/comp/tag/padding-horizontal` | `size/padding-component-sm` |
| `size/comp/tag/radius`             | `size/radius-sm`            |


---

## Using tokens in Figma

### Switch the mode

Select any frame → **Design panel → Variables → size collection** → pick the target mode. Every bound token in the frame updates at once.

### Bind a layer to a token

Select a layer, click the variable binding icon next to any numeric property (padding, gap, height, corner radius), and navigate the `size` collection.

### Choosing the right token


| What you're setting                              | Use                                     |
| ------------------------------------------------ | --------------------------------------- |
| Horizontal gap between a button's icon and label | `size/spacing-inline-xs`                |
| Horizontal gap between nav tabs                  | `size/spacing-inline-lg`                |
| Vertical gap between list items                  | `size/spacing-stack-sm`                 |
| Vertical gap between page sections               | `size/spacing-stack-xl`                 |
| Padding inside a button                          | `size/comp/button/padding-horizontal-*` |
| Padding inside an input                          | `size/comp/input/padding-horizontal`    |
| Padding inside a modal body                      | `size/comp/dialog/padding-md`           |
| Padding of a page content area                   | `size/padding-md` or `lg`               |
| Corner radius of a button                        | `size/comp/button/radius-default`       |
| Corner radius of a modal                         | `size/radius-lg`                        |


---

## Using tokens in code

### Web (CSS custom properties)

```css
/* Gap between items in a horizontal toolbar */
.toolbar { gap: var(--size-spacing-inline-md); }

/* Vertical gap between stacked form fields */
.form { gap: var(--size-spacing-stack-md); }

/* Padding inside a modal */
.modal-body { padding: var(--size-comp-dialog-padding-md); }

/* Padding inside a page content area */
.page-content { padding: var(--size-padding-md); }
```

### iOS / SwiftUI

```swift
// Horizontal gap between icon and label
HStack(spacing: Tokens.Size.spacingInlineSm) { icon; label }

// Vertical gap between list items
VStack(spacing: Tokens.Size.spacingStackSm) { ForEach(items) { … } }

// Surface / modal body padding
.padding(Tokens.Size.Comp.Dialog.paddingMd)
```

### Android / Jetpack Compose

```kotlin
Row(horizontalArrangement = Arrangement.spacedBy(SizeTokens.spacingInlineMd)) { … }
Column(verticalArrangement = Arrangement.spacedBy(SizeTokens.spacingStackSm)) { … }
Box(modifier = Modifier.padding(SizeTokens.paddingMd)) { … }
```

---

## Breakpoints

Breakpoint tokens live in their own Figma collection (`breakpoint`) — separate from `size` and `size-global`. They're mode-independent because the values themselves are what *defines* the modes: a frame becomes a "Web Tablet frame" at `≥ 768 px`, not because some other variable said so.

| Token                          | Value  | Mode switch?              | Behavior                                                                                                                            |
| ------------------------------ | ------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `breakpoint/xs`                | 576    | No — within Web Mobile    | `< 576`: narrow phone. `≥ 576`: standard mobile. Use for layout micro-adjustments inside Web Mobile.                               |
| `breakpoint/sm`                | 768    | **→ Web Tablet**          | `< 768`: Web Mobile mode. `≥ 768`: Web Tablet mode activates (12-col grid, looser padding).                                         |
| `breakpoint/md`                | 992    | No — within Web Tablet    | `< 992`: small tablet. `≥ 992`: large tablet / narrow laptop. Use for internal layout shifts; mode stays on Web Tablet.            |
| `breakpoint/lg`                | 1200   | **→ Web Desktop**         | `< 1200`: Web Tablet mode. `≥ 1200`: Web Desktop mode activates (24-col grid, generous padding).                                    |
| `breakpoint/xl`                | 1400   | **→ Web Desktop Large**   | `< 1400`: Web Desktop mode. `≥ 1400`: Web Desktop Large mode activates (extra breathing room).                                      |

**`sm` / `lg` / `xl` are the "hard" breakpoints** — they trigger size-mode switches. **`xs` / `md` are "soft" breakpoints** — fine-grained layout shifts that happen *inside* a mode without changing the size scale.

### In code

CSS custom properties do **not** work inside `@media` queries — this is a longstanding browser limitation. The same value is therefore emitted in three forms by `scripts/generate-llms-txt.mjs`:

```css
/* bootstrap.css — for non-media-query use (JS reading, container queries) */
:root {
  --breakpoint-xs: 576px;
  --breakpoint-sm: 768px;
  --breakpoint-md: 992px;
  --breakpoint-lg: 1200px;
  --breakpoint-xl: 1400px;
}

/* Size tokens cascade as mobile-first @media overrides using the raw numbers */
:root { --size-padding-md: 16px; }                          /* Web Mobile */
@media (min-width: 768px)  { :root { --size-padding-md: 20px; } }   /* Web Tablet */
@media (min-width: 1200px) { :root { --size-padding-md: 24px; } }   /* Web Desktop */
@media (min-width: 1400px) { :root { --size-padding-md: 32px; } }   /* Web Desktop Large */
```

```js
// breakpoints.js — for matchMedia / Tailwind config / any JS that needs raw px
import { breakpoints } from "/tokens/breakpoints.js";
const isDesktop = window.matchMedia(`(min-width: ${breakpoints.lg}px)`).matches;
```

Both are generated from the same `breakpoint.tokens.json` — there's no risk of drift.

---

## Column grid tokens

The column grid is tokenised for use in responsive layout frames. All names are prefixed with `layout-` to make it immediately clear these belong to the grid system rather than spacing or padding.


| Token                           | Device Mobile | Device Tablet | Web Mobile | Web Tablet | Web Desktop | Web Desktop Large |
| ------------------------------- | ------------- | ------------- | ---------- | ---------- | ----------- | ----------------- |
| `size/layout-columns`           | 4             | 12            | 4          | 12         | 24          | 24                |
| `size/layout-margin`            | 20            | 24            | 16         | 24         | 40          | 80                |
| `size/layout-gutter`            | 8             | 16            | 8          | 16         | 16          | 24                |
| `size/layout-column-min-width`  | —             | 48            | —          | 44         | 48          | 56                |
| `size/layout-max-content-width` | —             | —             | —          | 960        | 1280        | 1440              |
| `size/layout-max-text-width`    | —             | 680           | —          | 680        | 680         | 720               |


Apply these as Figma layout grid guides on your page frames so that the grid automatically reflects the active mode.

`max-content-width` and `max-text-width` are **optional caps** you choose per layout — they're not breakpoints. On a 1920 px monitor in Web Desktop Large mode, the canvas is 1920 px but `max-content-width` (1440) keeps the inner content column bounded, leaving the rest as side margin. Full-bleed surfaces like marketing heroes can ignore both caps; long-form reading uses `max-text-width` (680–720) for readable line lengths.