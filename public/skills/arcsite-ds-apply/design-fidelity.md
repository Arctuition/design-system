# Reference: Design-to-code fidelity gate

> **Maintainer note — this file holds *principles only*.** Do not hardcode breakpoint pixel values, mode names, layout-column counts, token names, hex values, exact file paths, or specific frame names that may drift. The canonical source for those lives in the JSON files under `tokens/`, the published artifacts referenced by `llms.txt`, and the codebase itself. The agent looks them up at runtime. Examples and illustrations in this file are deliberately generic so the file doesn't age out as the design system evolves.

> **This guide applies whenever the design is a contract, not a reference** — any pixel-match design-to-code task with a Figma source, regardless of surface shape. The universal rules ("Phase 1 — Read the design as a contract") apply to both responsive web pages and canvas-app prototypes. The responsive-web-specific substeps (per-band variables, layout-columns grid) only kick in when the design has responsive frames. **If the task is on a canvas surface (pan/zoom, custom geometry, simulated device frame), additionally consult `canvas-prototype.md`** for coordinate-space and canvas-specific concerns — the two docs compose; they're not alternatives.

When the user gives you a Figma URL, a design screenshot, or a detailed visual spec **as the source for a coding task** (Mode 1 or Mode 2), the design-to-code work spans a broad range of expectations. A quick concept demo and a production marketing site might both look like "build this design" at first read, but they call for different workflows — and choosing wrong either over-engineers a throwaway (slow) or under-engineers a real release (sloppy).

**Fidelity is not one slider.** It splits into two near-independent axes:

- **Visual fidelity** — how close the rendered output has to be to the Figma source.
  - *Approximate*: layout right, tokens right, ±5–10 px on dimensions OK, edge cases of responsive behavior may be skipped.
  - *Pixel-match*: every breakpoint frame's dimensions, gutters, image overflow, and computed token values match Figma 1:1.
- **Engineering rigor** — how production-grade the surrounding code has to be.
  - *Demo*: route wiring, a11y, edge cases, tests, dark mode considerations can be ignored unless they're called out.
  - *Production*: catch-all routes / SPA fallback wired, a11y verified, edge cases handled, dark mode resolved coherently, code lives where the codebase expects.

The four quadrants:

| | Demo rigor | Production rigor |
|---|---|---|
| **Approximate visual** | Throwaway concept / idea exploration | "Placeholder that ships" — shipping a real surface but the visual is a temporary stand-in |
| **Pixel-match visual** | Hi-fi prototype for stakeholder review | Production design replication (e.g. building the 404 page in the design-system-website) |

Step 0 asks the user where on this 2×2 the task lives. The rest of this doc covers the *pixel-match* protocol (right column of the grid); engineering rigor decisions are mostly orthogonal — they affect what you wire up, not how you read the design.

---

## Step 0: Ask the fidelity axes (do this first)

**Trigger condition: any design-to-code task.** Both of:

1. The output is **code** (Mode 1 or Mode 2 of this skill). Mode 3 (generating Figma designs) doesn't trigger Step 0 — there's no "design-to-code" step there.
2. The input includes a Figma URL / `node-id`, a design screenshot, or a detailed visual spec the user expects the code to *match*.

This applies regardless of what the project looks like — it could be a throwaway demo, a hi-fi prototype, or a production-level surface like the design-system-website. **The project's "production-ness" is a signal, not a substitute for asking.** A production codebase might still ask for a quick exploratory pass; a throwaway demo might still demand pixel-match for a screenshot. Ask.

Skip Step 0 only when:

- The user has *already* pre-declared both axes ("quick concept demo", "production hi-fi" — or equivalent specifics).
- The request is purely applying tokens to existing UI with no new design as input (Mode 2 with no Figma URL/screenshot — `antd-conflict.md` covers that).
- The request is exploratory and the design is incidental ("look at this Figma and tell me what you'd change").

Use a prompt like this, in the user's language. **Phrase it as an open conversation, not a binary menu** — the user may want to mix axes (e.g. pixel-match visual but demo rigor):

> Before I start, I want to align on the fidelity bar for this design-to-code task. Two questions:
>
> 1. **Visual fidelity** — should I treat the design as a *reference* (match layout + tokens, but approximate dimensions / responsive details) or as a *contract* (pixel-match per breakpoint, verify computed styles, side-by-side diff)?
> 2. **Engineering rigor** — is this a *demo* (skip route wiring / a11y / edge cases / tests unless flagged) or *production-grade* (do all of those, follow the codebase's conventions)?
>
> Examples: throwaway concept → approximate + demo; stakeholder review → pixel-match + demo; shipping a real page like a 404 → pixel-match + production.

Wait for the answer. **Don't default high or low** — either direction wastes the user's time. If the user gives an answer that doesn't map cleanly to a quadrant, restate what you heard and confirm.

If the user picks anything other than pixel-match visual, the bulk of this doc doesn't apply — use `prototype.md` (Mode 1) or follow Mode 2's existing patterns, and treat the design as a strong reference. The four-phase protocol below is specifically for pixel-match visual fidelity.

---

## Pixel-match visual fidelity — the four-phase protocol

(Use this whenever the user picked pixel-match visual fidelity in Step 0, regardless of the engineering-rigor axis. The protocol is about reading the design accurately; production-vs-demo rigor decisions are orthogonal and handled per-mode.)

### Phase 1 — Read the design as a contract *before* writing any code

Common failure modes — both shipped in past PRs:

- Glance at one Figma frame, infer the rest, start coding. Each frame is its own contract.
- Approximate a custom shape ("teardrop = triangle + half-circle") rather than fetching the real SVG path. The human eye catches the curvature mismatch instantly.
- Skim the visual but skip annotations, which encode the behavior contract the screenshot can't show.

These apply whether your surface is responsive web or a canvas-app. Walk the universal rules first; then the surface-specific substeps below.

#### Universal rules (apply to any pixel-match Figma source)

1. **Annotations first, visuals second.** `mcp__Figma__get_design_context` returns a `data-annotations` block. **Read every annotation before looking at the visual.** Annotations encode behavior the screenshot cannot show — entry conditions, multi-input rules, what triggers a state change, what happens on pointer-up vs. mid-drag. Past projects have shipped wrong because the agent stared at the visual and never noticed an annotation like "once both endpoints are moved, the prompt changes." If annotations conflict with what the visual implies, the annotation wins. If both seem ambiguous, ask the user — do not guess.
2. **Custom shapes: fetch the SVG, never hand-draw.** For any non-trivial shape — custom icons, glyphs, markers, grips, anchor pins, dimension chrome — **download the actual Figma SVG and embed its path**: (a) get the asset URL from `get_design_context` (look for `imgEllipse`, `imgIcon`, etc.); (b) `curl` it from the Figma MCP localhost endpoint, and on a first-attempt 404, re-call `get_design_context` to refresh the asset hash and retry — the hash refreshes between metadata calls and first 404s are normal; (c) embed the SVG `<path d="...">` directly or save the SVG to disk and import it. **Never approximate the shape with hand-written `<path>` math, lucide-react icons, or "the closest emoji."** Approximated curvature is the single most visible regression source; even when the bounding box matches, the human eye catches the wrong curve instantly.
3. **Variant diff requirement.** If the Figma node has multiple variants (the property panel shows variant names like "default / line / ruler", "round-grip / pointed-grip", etc.), **fetch design context for each variant separately** and produce a small diff table. Differences between variants are routinely non-obvious: two variants that share a grip shape may still differ in tip offset, endpoint tick visibility, or band rendering. A single-variant read followed by "the others are probably similar" is wrong almost every time. The cost of reading N variants is small; the cost of discovering a missed difference at review time is several rounds of rework.

#### For responsive web surfaces (additional)

For each responsive frame the design provides, do all of the following:

1. **`mcp__Figma__get_variable_defs` per frame, not per file.** Figma variables are mode-aware. The *same* token name returns *different values* at different breakpoint modes — paddings, gutters, radii, font sizes, max-content-widths all shift. Reading one frame's variables and applying them across breakpoints gives you the wrong values for every other band. Record a token-by-band table.
2. **Note container vs content sizes from the metadata.** Designers often wrap each breakpoint's content in an explicit layout frame whose inner width is the *intended* `max-content-width` for that band. **Use that inner width**, not the design-system-wide `layout-max-content-width` token — when they differ, the frame's inner width is what the designer chose for this specific design. If the design has no such wrapper and the frame width is the canvas itself, fall back to the design-system token.
3. **Look at image / illustration instances carefully.** If an image instance's size differs from its layout container's size, that is *intentional* — the designer set up a layout-reference frame and a separately-sized image inside it, almost always with **"Clip content" off** so the image's edges spill outside the frame visibly. The metadata doesn't expose the Clip toggle, so when sizes don't match, **ask the user** before guessing; default-assume no clipping if the user doesn't say.
4. **Record the `layout-columns` / `layout-gutter` token values per band.** If the design system specifies an N-column grid for the active mode, the implementation must use `grid-template-columns: repeat(N, ...)` with explicit `grid-column: span K` for each layer — **not** a `Nfr Mfr` approximation. The two render differently once gutters enter the math, and at pixel-match fidelity that matters.

#### For canvas surfaces (additional)

If the task is on a canvas surface, walk `canvas-prototype.md`'s "Architecture decisions to lock in before any code" section before any code — device-frame sizing, canvas pan/zoom behavior, the coordinate-space contract table. Those decisions are canvas-specific and have no analogue in the responsive-web substeps; they belong with the canvas guide. This file's Phase 2 / 3 / 4 (artifact, DOM verification, visual diff) still applies on top.

**Don't hardcode the breakpoint values or mode-name crosswalk here, in your code, or in your head.** The breakpoint collection lives in Figma and is JSON-exported to the repo at `tokens/breakpoint/breakpoint.tokens.json`, published to:

- `https://design-system.arcsite.com/tokens/breakpoints.js` *(JS module — `import { breakpointPx } from …`)*
- `llms.txt` — the "Tokens & primitives" section lists the current pixel values inline

Each breakpoint in `breakpoint.tokens.json` has a `$description` field that explicitly states the mode transition in the form `"< X: Mode A. ≥ X: Mode B."`. **Read these `$description`s** to find out which size-token mode applies at which pixel range — that mapping is part of the design system, not something to infer from frame names. Frame names in a Figma file (e.g. "1200 and above") are conventions chosen by the designer; the breakpoint values + descriptions are the source of truth.

If a Figma frame's name implies a breakpoint that doesn't match `breakpoint.tokens.json` (a frame named for a pixel value not in the breakpoint set, or differing by tens of pixels), flag the discrepancy to the user — the design may pre-date a breakpoint rename, or the designer may be working in a different convention. Don't silently pick.

Mode names come from the filenames under `tokens/size/` and `tokens/font/` (each `*.tokens.json` is one mode). List those directories at the start of a task to learn the current modes — do not assume the set or the names from memory.

### Phase 2 — Show the user a confirmation artifact *before* coding

Don't just summarize in prose. Produce a structured artifact the user can scan in 30 seconds and correct in one message. The artifact must include:

1. **A per-band token table.** Rows: each token your implementation will read (`layout-margin`, `gutter`, `max-content-width`, `spacing-stack-lg`, `radius-lg`, `btn-padding-h`, `title-large` font size, `display-404` numeral size — whatever your design uses). Columns: each breakpoint band. Cells: the value you read from Figma for that mode.
2. **Layout column spans per band.** "Content 8 / image 16" or "Content 12 / image 12" or "stacked". State whether the inner container snaps to a fixed width within the band or scales with viewport.
3. **Image / asset overflow semantics.** "Image is layout-frame size X×Y, image instance is bigger (W×H), `overflow: visible` so edges spill — no clipping." Be explicit when overflow is the intent so the user can confirm or correct.
4. **UI text language.** State the language you'll use for buttons / labels / errors. Default to the project's primary language (the codebase's other UI strings), not the conversation language. Cite a sibling page's strings as evidence.
5. **Open questions.** Anything you couldn't read unambiguously from the design — flag them, don't guess. Examples: "Dark mode behavior on a fixed-color surface", "Does the image actually clip at smaller bands or does it always overflow?", "What's the route / catch-all behavior for this 404 page?"

Wait for the user to confirm or correct. **Do not start writing code until they have looked at this artifact.** This is the single biggest lever for reducing rework rounds — a wrong assumption caught at the artifact stage costs one message; caught at the screenshot stage costs three rounds.

### Phase 3 — Implement and verify in the DOM, not in screenshots

Screenshots compress and lie about pixel dimensions. Verify via the DOM.

After each implementation step (or at every meaningful CSS change):

- **`preview_eval` with `getComputedStyle(...)`** on the elements you set tokens on. Confirm `max-height`, `font-size`, `color`, `border-radius`, `padding`, etc. resolve to the Figma values you recorded in Phase 1. **Don't trust the screenshot for this** — a CSS cascade bug can leave `max-height: 360px` overriding your `max-height: none` and the screenshot will look fine until you measure a specific element.
- **`preview_eval` with `getBoundingClientRect()`** on each layout layer (container, content col, image col, image element). Compare widths and heights to Figma's frame / instance values. Off by 1-2 px due to sub-pixel rounding is fine; off by 10%+ means a cascade or selector specificity bug.
- **Verify cascade order when you add new `@media` blocks.** Later same-specificity rules win. If you put a 992+ override block *before* a 768+ block in source order, the 768+ rule at the larger viewport will overwrite the 992+ rule. Always put broader-breakpoint blocks first, narrower-breakpoint blocks last (mobile-first ordering), and consolidate overrides into the appropriate block instead of scattering them.
- **Test inside the band, not just at the breakpoint.** If a band is 992–1199, test 992, 1100, and 1199 — the container should hold a fixed width across the whole range. If it grows with viewport, your `max-content-width` is mis-set for the band.

### Phase 4 — Side-by-side visual diff before declaring done

For each breakpoint band:

1. **`mcp__Figma__get_screenshot`** on the corresponding Figma frame node id.
2. **`preview_screenshot`** at a viewport inside that band (e.g. mid-band).
3. **Reason explicitly in your reply** about what's the same and what's different. Not "looks right" — that's a screenshot reading, not a verification. Pick specific landmarks: "In Figma, the house's roof has X px of beige space above; in my render, it has Y." "Trees on the left visible? Yes / no." "Button's horizontal padding is visually equal in both? Visually yes; computed style confirmed 24px / 24px."

Only declare the task complete when you have done this for every band. Skipping bands is how regressions in tablet / mobile slip through despite the desktop screenshot looking right.

---

## Common pitfalls (from past pixel-match work — read once before starting)

| # | Symptom | Root cause | Prevention |
|---|---|---|---|
| 1 | Image looks too small / too far from text | Used the generic `size/layout-max-content-width` token instead of the Figma frame's specific inner width | Always read the frame's inner width per band; treat the generic token as a fallback only |
| 2 | Layout etui-scales continuously with viewport instead of snapping per band | Container `max-width` never reached because viewport is below cap; container fills `viewport − 2×margin` instead | Set `max-content-width` per band to the Figma frame inner width, not the generic token; the container will then hold a fixed width within most of each band |
| 3 | Image cropped at the edges when it shouldn't be | Used `object-fit: cover` (cover means *crop to fit*, opposite of what's wanted) or `overflow: hidden` on the wrapper | If the image instance is bigger than its container and the wrapper's Clip is off in Figma, use `position: absolute` + `width: <pct>%` + parent without `overflow: hidden` |
| 4 | `max-height` (or another property) won't override even though you wrote `max-height: none` | CSS cascade order: a later same-specificity rule overwrites. The 992+ override is in source before the 768+ block, so at 992+ viewport the 768+ rule wins | Order media query blocks mobile-first (narrowest viewport first, widest last). Consolidate per-breakpoint overrides into one block per band, in ascending order |
| 5 | Column proportions off by a few px from Figma | Used `Nfr Mfr` template with a single gap — the gutter math doesn't match an N-col grid with N gutters internal to each span | Use `grid-template-columns: repeat(C, minmax(0, 1fr))` where C is the mode's `size/layout-columns` value (read it from the size token JSON for the active mode), with `grid-column: span K` for each layer matching its Figma column span |
| 6 | UI text in the wrong language | Conversation language leaked into UI strings | Always cite a sibling page / component's text as the language signal before generating any UI string. Defaults: project's primary language, not chat language |
| 7 | Used an SVG placeholder instead of the real raster | Figma MCP `localhost:3845/assets/...` returned 404 on first try, assumed asset pipeline was broken | Retry `get_design_context` once to refresh the asset hash, then re-curl. The asset URL hash often changes between metadata calls — first 404 is normal |
| 8 | Dark mode foreground unreadable on a designed-light surface | Surface is hard-coded to a Figma-specified color (e.g. beige), but foreground tokens are mode-aware and flip to white when app dark mode toggles | Use light-mode-anchored gray tokens (`--color-global-gray-85` etc.), not aliased semantic tokens (`--color-label-primary`), on fixed-color surfaces. State this decision in Phase 2 |
| 9 | Custom shape rendered with the wrong curvature | Approximated a non-trivial Figma shape (teardrop, anchor pin, custom icon) with hand-written `<path>` math, a lucide-react icon, or "closest emoji" | Universal rule (Phase 1): fetch the actual SVG from `get_design_context`'s asset URL, retry on 404 to refresh hash, then embed the real `<path d="…">`. Never approximate non-trivial shapes |
| 10 | Variant-specific detail missed (a sibling variant has an extra tick / different tip offset / a band that the active variant lacks) | Read design context for one variant and extrapolated; assumed siblings shared all sub-elements | Universal rule (Phase 1): fetch each variant separately and build a diff table. The cost of reading N variants is small; missed variant differences are the most common rework source |
| 11 | Behavior contract missed (state changes, multi-input rules, gestures) — implementation matches the static visual but a key interaction is wrong | Skipped the `data-annotations` block in the design context payload | Universal rule (Phase 1): annotations are read **first**, before the visual. Annotations encode behavior the screenshot can't show |

---

## End-of-task verification

Before declaring done on a pixel-match design-to-code task, walk this checklist:

- [ ] All annotations from the design context were read **before** any code was written (Phase 1, universal).
- [ ] Every non-trivial custom shape traces back to a downloaded Figma SVG path — no hand-drawn approximations (Phase 1, universal).
- [ ] If the design has multiple variants, each was fetched separately and a diff table produced (Phase 1, universal).
- [ ] Each Figma frame's variables were read separately, for responsive surfaces (Phase 1, responsive).
- [ ] User confirmed the Phase 2 artifact.
- [ ] Every band / state tested in the DOM with `getComputedStyle` + `getBoundingClientRect` (Phase 3).
- [ ] Every band has a side-by-side visual diff with reasoning (Phase 4).
- [ ] CSS cascade ordering checked (mobile-first, broader → narrower).
- [ ] No screenshot-only "looks right" assertions for verification.
- [ ] UI text language matches the codebase's sibling files.
- [ ] Image / asset overflow semantics match Figma's Clip toggle (asked the user if uncertain).
- [ ] If the task was on a canvas surface: `canvas-prototype.md`'s self-check was walked in addition.
- [ ] Preview viewport reset to a sensible default before handing back (so the user opening preview doesn't see the last test size).

If any of these is unchecked, the task isn't done — go finish it. Don't ask the user to re-verify what you should have verified yourself.
