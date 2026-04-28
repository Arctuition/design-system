# Typography Tokens

Source: Figma Design Library (`QH0keaNSAxGwUxwUV3unEi`) — `font` variable collection + text styles.

There are two parallel font systems in the library:

- `**font/***` — the current, tokenized system. Multi-mode (web-desktop / web-mobile / device-tablet / device-mobile) and composed entirely from primitives (`font/typeface/*`, `font/size/*`, `font/font-weight/*`, `font/letter-spacing/*`).
- `**app/***` — legacy text styles with raw values. Kept for backwards compatibility with existing app screens; new work should reference `font/*`.

## Modes in the `font` collection


| Mode            | Used for                  |
| --------------- | ------------------------- |
| `web-desktop`   | Desktop web (default)     |
| `web-mobile`    | Web on mobile breakpoints |
| `device-tablet` | Native tablet apps (iPad) |
| `device-mobile` | Native phone apps (iOS)   |


Web modes use Inter; device modes use SF Pro Text / SF Pro Display. Sizes also differ per mode for body and titles (see tables below).

---

## 1. Primitives

The atomic variables in the `font` collection. Semantic styles compose from these.

### Type families


| Token                   | web-desktop | web-mobile | device-tablet  | device-mobile  |
| ----------------------- | ----------- | ---------- | -------------- | -------------- |
| `font/typeface/text`    | Inter       | Inter      | SF Pro Text    | SF Pro Text    |
| `font/typeface/display` | Inter       | Inter      | SF Pro Display | SF Pro Display |


### Font weights

All weights are mode-invariant.


| Token                         | Value |
| ----------------------------- | ----- |
| `font/font-weight/thin`       | 100   |
| `font/font-weight/extralight` | 200   |
| `font/font-weight/light`      | 300   |
| `font/font-weight/regular`    | 400   |
| `font/font-weight/medium`     | 500   |
| `font/font-weight/semibold`   | 600   |
| `font/font-weight/bold`       | 700   |
| `font/font-weight/extrabold`  | 800   |
| `font/font-weight/black`      | 900   |


### Letter spacing


| Token                              | web-desktop | web-mobile | device-tablet | device-mobile |
| ---------------------------------- | ----------- | ---------- | ------------- | ------------- |
| `font/letter-spacing/title-large`  | -1.05       | -1.05      | 0             | 0             |
| `font/letter-spacing/title-medium` | -0.45       | -0.45      | 0             | 0             |


> Negative tracking only on the web modes. Device modes use SF Pro, which is already optically tightened.

### Body sizes


| Token                   | web-desktop | web-mobile | device-tablet | device-mobile |
| ----------------------- | ----------- | ---------- | ------------- | ------------- |
| `font/size/body/tiny`   | 10          | 10         | 10            | 10            |
| `font/size/body/small`  | 12          | 12         | 13            | 13            |
| `font/size/body/medium` | 14          | 14         | 15            | 15            |
| `font/size/body/large`  | 16          | 16         | 17            | 17            |


### Body line-heights


| Token                               | web-desktop | web-mobile | device-tablet | device-mobile |
| ----------------------------------- | ----------- | ---------- | ------------- | ------------- |
| `font/size/body/line-height/tiny`   | 14          | 14         | 12            | 12            |
| `font/size/body/line-height/small`  | 16          | 16         | 18            | 18            |
| `font/size/body/line-height/medium` | 18          | 18         | 20            | 20            |
| `font/size/body/line-height/large`  | 22          | 22         | 22            | 22            |


### Title sizes


| Token                    | web-desktop | web-mobile | device-tablet | device-mobile |
| ------------------------ | ----------- | ---------- | ------------- | ------------- |
| `font/size/title/small`  | 16          | 16         | 17            | 17            |
| `font/size/title/medium` | 24          | 20         | 28            | 22            |
| `font/size/title/large`  | 32          | 28         | 34            | 28            |


### Title line-heights


| Token                                | web-desktop | web-mobile | device-tablet | device-mobile |
| ------------------------------------ | ----------- | ---------- | ------------- | ------------- |
| `font/size/title/line-height/small`  | 22          | 22         | 22            | 22            |
| `font/size/title/line-height/medium` | 30          | 26         | 34            | 34            |
| `font/size/title/line-height/large`  | 40          | 40         | 40            | 40            |


> Migration note: these size tokens previously lived in the `size` collection as `size/font/...`. Migrated to `font/size/...` on 2026-04-28 so all typography primitives sit in one collection. All `font/*` text styles re-bound; old tokens deleted.

---

## 2. Semantic styles — `font/*`

Use these in components. Every property is bound to a primitive — switch modes and they cascade. Listed values are the `**web-desktop` mode** for quick reference.

### Body — regular


| Style              | Family bound         | Size                    | Line height                         | Weight                     | web-desktop px (size / lh) |
| ------------------ | -------------------- | ----------------------- | ----------------------------------- | -------------------------- | -------------------------- |
| `font/text-tiny`   | `font/typeface/text` | `font/size/body/tiny`   | `font/size/body/line-height/tiny`   | `font/font-weight/regular` | 10 / 14                    |
| `font/text-small`  | `font/typeface/text` | `font/size/body/small`  | `font/size/body/line-height/small`  | `font/font-weight/regular` | 12 / 16                    |
| `font/text-medium` | `font/typeface/text` | `font/size/body/medium` | `font/size/body/line-height/medium` | `font/font-weight/regular` | 14 / 18                    |
| `font/text-large`  | `font/typeface/text` | `font/size/body/large`  | `font/size/body/line-height/large`  | `font/font-weight/regular` | 16 / 22                    |


### Body — semibold


| Style                       | Size                    | Line height                         | Weight                      | web-desktop px |
| --------------------------- | ----------------------- | ----------------------------------- | --------------------------- | -------------- |
| `font/text-tiny-semibold`   | `font/size/body/tiny`   | `font/size/body/line-height/tiny`   | `font/font-weight/semibold` | 10 / 14        |
| `font/text-small-semibold`  | `font/size/body/small`  | `font/size/body/line-height/small`  | `font/font-weight/semibold` | 12 / 16        |
| `font/text-medium-semibold` | `font/size/body/medium` | `font/size/body/line-height/medium` | `font/font-weight/semibold` | 14 / 18        |
| `font/text-large-semibold`  | `font/size/body/large`  | `font/size/body/line-height/large`  | `font/font-weight/semibold` | 16 / 22        |


All body styles use `font/typeface/text` and `textCase: ORIGINAL`.

### Headers (uppercase)


| Style                                   | Size                   | Line height                        | Weight                      | textCase | web-desktop px |
| --------------------------------------- | ---------------------- | ---------------------------------- | --------------------------- | -------- | -------------- |
| `font/header-tiny-medium-upper-case`    | `font/size/body/tiny`  | `font/size/body/line-height/tiny`  | `font/font-weight/medium`   | UPPER    | 10 / 14        |
| `font/header-small-upper-case`          | `font/size/body/small` | `font/size/body/line-height/small` | `font/font-weight/regular`  | UPPER    | 12 / 16        |
| `font/header-small-upper-case-semibold` | `font/size/body/small` | `font/size/body/line-height/small` | `font/font-weight/semibold` | UPPER    | 12 / 16        |


Family: `font/typeface/text`. The Figma text style sets `textCase: UPPER` directly — don't try to bind that.

### Titles — small

Small titles use `font/typeface/text` (not display) and don't bind a letter-spacing token.

> Why (per Figma description): the ExtraBold weight is what differentiates a small title from body text at the same size. On iOS, the typeface resolves to SF Pro **Text** (not Display) because the optical size is below the 19pt switchover threshold.


| Style                        | Size                    | Line height                         | Weight                       | web-desktop px (size / lh) |
| ---------------------------- | ----------------------- | ----------------------------------- | ---------------------------- | -------------------------- |
| `font/title-small`           | `font/size/title/small` | `font/size/title/line-height/small` | `font/font-weight/regular`   | 16 / 22                    |
| `font/title-small-semibold`  | `font/size/title/small` | `font/size/title/line-height/small` | `font/font-weight/semibold`  | 16 / 22                    |
| `font/title-small-extrabold` | `font/size/title/small` | `font/size/title/line-height/small` | `font/font-weight/extrabold` | 16 / 22                    |


### Titles — medium and large

These use `font/typeface/display` and bind a negative letter-spacing on web modes (zero on device).


| Style                         | Size                     | Line height                          | Letter spacing                     | Weight                       | web-desktop px (size / lh / ls) |
| ----------------------------- | ------------------------ | ------------------------------------ | ---------------------------------- | ---------------------------- | ------------------------------- |
| `font/title-medium`           | `font/size/title/medium` | `font/size/title/line-height/medium` | `font/letter-spacing/title-medium` | `font/font-weight/regular`   | 24 / 30 / -0.45                 |
| `font/title-medium-semibold`  | `font/size/title/medium` | `font/size/title/line-height/medium` | `font/letter-spacing/title-medium` | `font/font-weight/semibold`  | 24 / 30 / -0.45                 |
| `font/title-medium-extrabold` | `font/size/title/medium` | `font/size/title/line-height/medium` | `font/letter-spacing/title-medium` | `font/font-weight/extrabold` | 24 / 30 / -0.45                 |
| `font/title-large`            | `font/size/title/large`  | `font/size/title/line-height/large`  | `font/letter-spacing/title-large`  | `font/font-weight/regular`   | 32 / 40 / -1.05                 |
| `font/title-large-semibold`   | `font/size/title/large`  | `font/size/title/line-height/large`  | `font/letter-spacing/title-large`  | `font/font-weight/semibold`  | 32 / 40 / -1.05                 |
| `font/title-large-extrabold`  | `font/size/title/large`  | `font/size/title/line-height/large`  | `font/letter-spacing/title-large`  | `font/font-weight/extrabold` | 32 / 40 / -1.05                 |


---

## 3. Legacy styles — `app/`*

Raw-value styles still referenced by existing app screens. Roboto, no variable bindings. Prefer `font/`* for new work.

### Body — regular


| Token             | Family | Weight | Size | Line height |
| ----------------- | ------ | ------ | ---- | ----------- |
| `app/text-tiny`   | Roboto | 400    | 10   | 12          |
| `app/text-small`  | Roboto | 400    | 13   | 18          |
| `app/text-medium` | Roboto | 400    | 15   | 20          |
| `app/text-large`  | Roboto | 400    | 17   | 22          |


### Body — semibold


| Token                      | Family | Weight | Size | Line height |
| -------------------------- | ------ | ------ | ---- | ----------- |
| `app/text-tiny-semibold`   | Roboto | 600    | 10   | 12          |
| `app/text-small-semibold`  | Roboto | 600    | 13   | 18          |
| `app/text-medium-semibold` | Roboto | 600    | 15   | 20          |
| `app/text-large-semibold`  | Roboto | 600    | 17   | 22          |


### Headers (uppercase)


| Token                                  | Family | Weight | Size | Line height | Notes             |
| -------------------------------------- | ------ | ------ | ---- | ----------- | ----------------- |
| `app/header-small-upper case`          | Roboto | 400    | 13   | 18          | `textCase: UPPER` |
| `app/header-small-semibold-upper case` | Roboto | 600    | 13   | 18          | `textCase: UPPER` |


### Titles


| Token                         | Family | Weight | Size | Line height |
| ----------------------------- | ------ | ------ | ---- | ----------- |
| `app/title-small-extrabold`   | Roboto | 800    | 17   | 22          |
| `app/title-medium`            | Roboto | 400    | 28   | 34          |
| `app/title-medium-semibold`   | Roboto | 600    | 28   | 34          |
| `app/title-medium-extra-bold` | Roboto | 800    | 28   | 34          |
| `app/title-large`             | Roboto | 400    | 34   | 40          |
| `app/title-large-semibold`    | Roboto | 600    | 34   | 40          |
| `app/title-large-extrabold`   | Roboto | 800    | 34   | 40          |


---

## 4. `font/`* ↔ `app/`* mapping

Use this for migration. Sizes are now close enough that the `device-tablet` mode of `font/*` matches the legacy `app/*` values almost exactly (13/15/17 body, 17 small title, 34 large title) — switch to `device-tablet` mode in Figma when checking parity.


| Legacy `app/*`                         | `font/*` equivalent                     | web-desktop mode size | device-tablet mode size |
| -------------------------------------- | --------------------------------------- | --------------------- | ----------------------- |
| `app/text-tiny`                        | `font/text-tiny`                        | 10                    | 10 ✓                    |
| `app/text-small`                       | `font/text-small`                       | 12                    | 13 ✓                    |
| `app/text-medium`                      | `font/text-medium`                      | 14                    | 15 ✓                    |
| `app/text-large`                       | `font/text-large`                       | 16                    | 17 ✓                    |
| `app/text-*-semibold`                  | `font/text-*-semibold`                  | same as above         | same as above           |
| `app/header-small-upper case`          | `font/header-small-upper-case`          | 12                    | 13 ✓                    |
| `app/header-small-semibold-upper case` | `font/header-small-upper-case-semibold` | 12                    | 13 ✓                    |
| `app/title-small-extrabold`            | `font/title-small-extrabold`            | 16                    | 17 ✓                    |
| `app/title-medium`                     | `font/title-medium`                     | 24                    | 28 ✓                    |
| `app/title-medium-semibold`            | `font/title-medium-semibold`            | 24                    | 28 ✓                    |
| `app/title-medium-extra-bold`          | `font/title-medium-extrabold`           | 24                    | 28 ✓                    |
| `app/title-large`                      | `font/title-large`                      | 32                    | 34 ✓                    |
| `app/title-large-semibold`             | `font/title-large-semibold`             | 32                    | 34 ✓                    |
| `app/title-large-extrabold`            | `font/title-large-extrabold`            | 32                    | 34 ✓                    |


> The `app/*` set used Roboto; `font/*` uses Inter on web and SF Pro on device. There will be a visible glyph shift after migration — most noticeable on titles. Plan a screenshot pass after the swap.

---

## 5. Implementation notes

- Letter spacing on `font/*` body and header styles is implicit zero. Only the title styles (medium / large) have a letter-spacing token bound, and only on the web modes (-1.05 / -0.45). Device modes zero them out.
- Line heights are in **pixels**, not unitless multipliers. When emitting CSS, output as `line-height: 22px` (not `1.375`).
- For web work, load Inter weights 400 / 500 / 600 / 800 (medium is needed for `header-tiny-medium-upper-case`). Add 700 / 900 if you start using bold or black weights.
- For native, SF Pro Text and SF Pro Display ship with iOS/macOS — no font loading needed.
- `textCase: UPPER` lives on the text style itself in Figma, not on a variable. In CSS, `text-transform: uppercase`.

### CSS variable example (web-desktop mode only)

```css
:root {
  /* Type families */
  --font-typeface-text: "Inter", system-ui, sans-serif;
  --font-typeface-display: "Inter", system-ui, sans-serif;

  /* Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-extrabold: 800;

  /* Body sizes (web-desktop) */
  --font-size-body-tiny: 10px;
  --font-size-body-small: 12px;
  --font-size-body-medium: 14px;
  --font-size-body-large: 16px;
  --font-size-body-lh-tiny: 14px;
  --font-size-body-lh-small: 16px;
  --font-size-body-lh-medium: 18px;
  --font-size-body-lh-large: 22px;

  /* Title sizes (web-desktop) */
  --font-size-title-small: 16px;
  --font-size-title-medium: 24px;
  --font-size-title-large: 32px;
  --font-size-title-lh-small: 22px;
  --font-size-title-lh-medium: 30px;
  --font-size-title-lh-large: 40px;

  /* Letter spacing */
  --font-letter-spacing-title-medium: -0.45px;
  --font-letter-spacing-title-large: -1.05px;
}

/* Semantic */
.font-text-medium {
  font-family: var(--font-typeface-text);
  font-weight: var(--font-weight-regular);
  font-size: var(--font-size-body-medium);
  line-height: var(--font-size-body-lh-medium);
}

.font-title-large-semibold {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-title-large);
  line-height: var(--font-size-title-lh-large);
  letter-spacing: var(--font-letter-spacing-title-large);
}
```

For multi-mode output, emit a parallel block per breakpoint / platform and override the affected primitives (`--font-size-*`, `--font-typeface-*`, `--font-letter-spacing-*`).