# Size & Space Tokens

ArcSite's size and spacing system is built on four layers of design tokens stored in a single **size** variable collection in Figma. Switch the mode once on any frame and every bound token updates — padding, gaps, heights, radii, and typography — simultaneously across Device Mobile, Device Tablet, Web Mobile, and Web Desktop.

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

## The four modes


| Mode          | Represents             | Sizing basis |
| ------------- | ---------------------- | ------------ |
| Device Mobile | iPhone / Android phone | iOS HIG (pt) |
| Device Tablet | iPad / Android tablet  | iOS HIG (pt) |
| Web Mobile    | Browser ≤ 768 px       | px           |
| Web Desktop   | Browser on desktop     | px           |


---

## Semantic token groups

### Spacing — inline (`size/spacing-inline-`*)

**Use for: horizontal gaps between sibling elements.**
Icon ↔ label in a button, chips in a row, nav tab items, action button groups, form fields side by side.


| Token                    | Device Mobile | Device Tablet | Web Mobile | Web Desktop |
| ------------------------ | ------------- | ------------- | ---------- | ----------- |
| `size/spacing-inline-xs` | 4             | 4             | 4          | 4           |
| `size/spacing-inline-sm` | 8             | 8             | 8          | 8           |
| `size/spacing-inline-md` | 12            | 12            | 12         | 16          |
| `size/spacing-inline-lg` | 16            | 20            | 16         | 24          |
| `size/spacing-inline-xl` | 24            | 24            | 20         | 32          |


xs and sm are universal — icon-to-text gaps and chip spacing don't change between platforms. md–xl grow on tablet and web desktop where wider screens allow looser rhythm.

---

### Spacing — stack (`size/spacing-stack-`*)

**Use for: vertical gaps between stacked elements.**
List items, stacked form fields, cards in a feed, space between content sections on a page.


| Token                   | Device Mobile | Device Tablet | Web Mobile | Web Desktop |
| ----------------------- | ------------- | ------------- | ---------- | ----------- |
| `size/spacing-stack-xs` | 4             | 4             | 4          | 4           |
| `size/spacing-stack-sm` | 8             | 8             | 8          | 8           |
| `size/spacing-stack-md` | 16            | 16            | 12         | 16          |
| `size/spacing-stack-lg` | 24            | 24            | 20         | 24          |
| `size/spacing-stack-xl` | 32            | 48            | 24         | 32          |


xs/sm match inline for tight micro-spacing. md–xl diverge: Device Tablet's xl is 48pt because vertical page rhythm is more generous on large screens.

---

### Padding (`size/padding-`*)

**Use for: inset padding inside container surfaces.**
Page content areas, modal bodies, drawers, side panels, sheets. Values are intentionally larger than component padding to give surfaces breathing room. Device values respect iOS HIG (10pt compact, 20pt regular); web values follow common 8-grid multiples.


| Token             | Device Mobile | Device Tablet | Web Mobile | Web Desktop |
| ----------------- | ------------- | ------------- | ---------- | ----------- |
| `size/padding-xs` | 10            | 10            | 8          | 8           |
| `size/padding-sm` | 16            | 20            | 12         | 16          |
| `size/padding-md` | 20            | 24            | 16         | 24          |
| `size/padding-lg` | 24            | 32            | 20         | 32          |
| `size/padding-xl` | 32            | 48            | 24         | 48          |


---

### Padding — component (`size/padding-component-`*)

**Use for: inset padding inside interactive controls.**
Button horizontal padding, input field padding, tag/chip padding. Device sizes use a 6pt base to ensure legible tap targets per iOS HIG.


| Token                       | Device Mobile | Device Tablet | Web Mobile | Web Desktop |
| --------------------------- | ------------- | ------------- | ---------- | ----------- |
| `size/padding-component-xs` | 6             | 6             | 4          | 4           |
| `size/padding-component-sm` | 12            | 12            | 8          | 8           |
| `size/padding-component-md` | 16            | 20            | 12         | 12          |
| `size/padding-component-lg` | 20            | 24            | 16         | 20          |
| `size/padding-component-xl` | 24            | 28            | 20         | 24          |


---

### Icon sizes


| Token          | All modes |
| -------------- | --------- |
| `size/icon-sm` | 16        |
| `size/icon-md` | 24        |
| `size/icon-lg` | 30        |


---

### Border radius


| Token              | Device Mobile | Device Tablet | Web Mobile | Web Desktop |
| ------------------ | ------------- | ------------- | ---------- | ----------- |
| `size/radius-none` | 0             | 0             | 0          | 0           |
| `size/radius-xs`   | 4             | 4             | 2          | 2           |
| `size/radius-sm`   | 6             | 6             | 4          | 4           |
| `size/radius-md`   | 10            | 10            | 6          | 6           |
| `size/radius-lg`   | 16            | 20            | 8          | 8           |
| `size/radius-xl`   | 20            | 24            | 12         | 12          |
| `size/radius-full` | 9999          | 9999          | 9999       | 9999        |


---

## Component token groups

Component tokens are a thin alias layer. They keep component-specific decisions explicit (`dialog uses padding-layout-md`) without adding new raw values.

### Button


| Token                                    | Aliases                     |
| ---------------------------------------- | --------------------------- |
| `size/comp/button/height-xs` … `xl`      | `size/height-xs` … `xl`     |
| `size/comp/button/padding-horizontal-sm` | `size/padding-component-sm` |
| `size/comp/button/padding-horizontal-md` | `size/padding-component-md` |
| `size/comp/button/padding-horizontal-lg` | `size/padding-component-lg` |
| `size/comp/button/radius-default`        | `size/radius-md`            |
| `size/comp/button/radius-rounded`        | `size/radius-full`          |


### Input / Text field


| Token                                       | Aliases                           |
| ------------------------------------------- | --------------------------------- |
| `size/comp/input/height-sm` … `lg`          | `size/height-sm` … `lg`           |
| `size/comp/input/padding-horizontal`        | `size/padding-component-lg`       |
| `size/comp/input/padding-vertical-sm/md/lg` | `size/padding-component-xs/sm/md` |
| `size/comp/input/icon-size`                 | `size/icon-md`                    |
| `size/comp/input/radius`                    | `size/radius-md`                  |


### Dialog / Modal


| Token                         | Aliases           | Web Desktop |
| ----------------------------- | ----------------- | ----------- |
| `size/comp/dialog/padding-sm` | `size/padding-sm` | 16 px       |
| `size/comp/dialog/padding-md` | `size/padding-md` | 24 px       |
| `size/comp/dialog/padding-lg` | `size/padding-lg` | 32 px       |
| `size/comp/dialog/padding-xl` | `size/padding-xl` | 48 px       |


`dialog/padding-md` is the default for confirmation dialogs. Use `lg` for information-dense drawers and `xl` for full-panel workflows. All dialog padding aliases the `size/padding-`* scale directly.

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
| Padding inside a button                          | `size/comp/button/padding-horizontal-`* |
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

## Column grid tokens

The column grid is tokenised for use in responsive layout frames. All names are prefixed with `layout-` to make it immediately clear these belong to the grid system rather than spacing or padding.


| Token                           | Web Desktop | Device Tablet | Web Mobile | Device Mobile |
| ------------------------------- | ----------- | ------------- | ---------- | ------------- |
| `size/layout-columns`           | 24          | 12            | 4          | 4             |
| `size/layout-margin`            | 40          | 24            | 16         | 20            |
| `size/layout-gutter`            | 16          | 16            | 8          | 8             |
| `size/layout-column-min-width`  | 48          | 48            | —          | —             |
| `size/layout-max-content-width` | 1280        | —             | —          | —             |
| `size/layout-max-text-width`    | 680         | 680           | —          | —             |


Apply these as Figma layout grid guides on your page frames so that the grid automatically reflects the active mode.