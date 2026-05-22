# Reference: Canvas-app prototype mode

> **Maintainer note — this file holds *principles only*.** Do not hardcode component names, exact tip-offset numbers, specific frame names, hex values, or asset hashes that may drift. The agent looks those up at runtime from Figma MCP, the codebase's `components/` directory, and the prototype project's own docs. If you find yourself typing a specific path / value here, replace it with a pointer to the canonical source.

Use this guide whenever the prototype includes a **canvas-shaped app surface** — a draftable area with pan / zoom, custom geometry (lines, points, handles, dimensions), a CAD-style toolbar, or a simulated device frame. The Calibration, Elevation, and similar drafting prototypes all live here.

**Canvas and fidelity are independent axes.** A canvas prototype can be lo-fi (a sketch to test an interaction) or hi-fi (a pixel-match mockup for stakeholder review). This file covers the canvas-specific concerns at any fidelity. If your task is *also* pixel-match (Step 0 axis: visual fidelity = contract), walk this guide **in addition to** `design-fidelity.md` — that file holds the universal "read the design as a contract" rules (annotations first, fetch SVG don't hand-draw, variant diff, per-band variables). They compose.

---

## When this file applies

Trigger conditions (any one is enough):

- The design shows a **device frame** (iPad / phone / desktop chrome) wrapping the app's chrome and canvas.
- The canvas has **pan / zoom**.
- The user manipulates **custom geometry** (reference lines, endpoints, handles, dimensions, anchors, bezier control points).
- The brief mentions drafting, CAD, calibration, measurement, snapping, or alignment guides.
- Multiple coordinate spaces are obviously in play (e.g. a grip stays the same visual size while the line it sits on stretches with zoom).

If none of those apply, you're on a responsive web surface — `design-fidelity.md` (for pixel-match work) or `prototype.md` (for exploratory work) is sufficient on its own.

---

## Architecture decisions to lock in *before* any code

The single most expensive class of rework in canvas-app prototypes comes from coordinate-space and scaling decisions made implicitly and re-discovered ten files into the implementation. Lock these down first — regardless of whether the prototype is lo-fi or hi-fi.

Ask the user (or confirm from the design) before you write any layout code:

1. **Is the device frame fixed-size (1:1 viewport pixels) or responsive?** Marketing-style "scale the whole frame to fit" is the wrong default for an app mockup — the app's internal canvas should usually be the thing that pan/zooms, not the device chrome. If the user wants the device frame to scale, that's a different architecture and you need to know up front.
2. **Does the canvas itself pan and zoom?** If yes, you have at least three coordinate spaces (viewport / canvas / screen-anchored-on-canvas) and the rules below apply. If no, you can often collapse the model.
3. **What lives in which space?** Produce a short **coordinate-space contract** for the agent's own reference and the user's review. The default contract for an ArcSite-style canvas prototype:

   | Element category | Coordinate space | Zoom behavior | Implementation hint |
   |---|---|---|---|
   | Device frame, app chrome (top nav, tool panels, modals, toasts) | viewport | does not scale | normal absolute positioning at the root |
   | Floor plan / base photograph / grid background | canvas | grows/shrinks with zoom | image / SVG inside the `transform: scale(zoom)` wrapper |
   | Geometry length (reference line length, polygon edge length) | canvas | grows/shrinks with zoom | SVG line / path inside the canvas wrapper, position in canvas units |
   | Geometry stroke (line width, dot radius) | canvas-positioned, viewport-sized | does not visually thicken | counter-scaled `strokeWidth={N / zoom}` |
   | Grips, handles, drag affordances | screen-anchored-on-canvas | does not scale | `<ScreenAnchor>`-style wrapper at canvas coords with `scale(1 / zoom)` |
   | Dimension tags, tooltips, popovers, snap hints | screen-anchored-on-canvas | does not scale | same `<ScreenAnchor>` pattern |

   Copy this table into your prototype's README or a top-of-file comment and adapt the rows for project-specific elements. If your design diverges from any default (e.g. a tool that *does* scale on a hand-drawn-feel demo), record it explicitly. The value is in having committed before coding.

The full extended reference — with React/SVG snippets for `ScreenAnchor`, counter-scaled stroke, hit-testing pitfalls, and a worked draggable-endpoint example — lives in the Design Playground project at `guidelines/coordinate-spaces.md`. That file is the home for prototype-only patterns; the design-system-website's `patterns/` tree is reserved for production-grade patterns. When working in a Design Playground project, pull up `guidelines/coordinate-spaces.md` for the worked examples; outside Design Playground, the contract table above plus the patterns below are usually sufficient.

If you skip these decisions, you'll write `transform: scale` on the wrong layer, hand-roll counter-scaling per-element, and re-design coordinate handling mid-implementation. Don't.

---

## Coordinate-space patterns

Once the contract is in hand, two patterns dominate.

### Counter-scaled stroke width

Inside a `transform: scale(zoom)` canvas, an SVG `stroke="2"` renders as `2 × zoom` viewport pixels — visibly *grows* with zoom. The fix is to render `strokeWidth={2 / zoom}`, which produces a constant 2-viewport-px stroke regardless of canvas zoom.

```tsx
<line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke="var(--color-label-primary)"
      strokeWidth={2 / zoom} />
```

**Do not rely on `vector-effect: non-scaling-stroke`.** Its behavior is inconsistent across SVG nesting levels and rasterization paths, and it has shipped looking-correct-in-DevTools-but-visibly-wrong-on-screen more than once. Counter-scaling the number is the reliable path.

### `ScreenAnchor` pattern for screen-space overlays

Anything that should stay the same viewport size regardless of canvas zoom (grips, handles, dimension tags, tooltips) is positioned in canvas-space coordinates but rendered with `transform: scale(1 / zoom)` so its own pixels stay viewport-fixed:

```tsx
// Positioned at canvas-space `at`; inner content stays viewport-sized.
// `offset` is in viewport pixels because it composes after the counter-scale.
<div style={{
  position: "absolute",
  left: at.x, top: at.y,
  transform: `scale(${1 / zoom}) translate(${offset.x}px, ${offset.y}px)`,
  transformOrigin: "center",
  pointerEvents: "auto",
}}>
  {children}
</div>
```

Watch out for `pointer-events` — the canvas-root layer underneath usually wants `pointer-events: none` everywhere except gesture-capture zones, so the anchored overlay can catch drag events. Get this wrong and either the grip won't catch drags, or canvas pan will steal them.

When working inside Design Playground, prefer the worked patterns in `guidelines/coordinate-spaces.md` over re-deriving these — they include hit-testing pitfalls, an extended `ScreenAnchor` with origin presets, and a worked draggable-endpoint example.

---

## Canvas-specific verification cases

The general "verify in DOM, then visual diff" protocol lives in `design-fidelity.md` Phase 3 / 4 — walk that whenever the task is pixel-match. **In addition** to those, every interactive geometry change on a canvas surface must be tested through this case matrix, regardless of fidelity:

- **Min zoom + max zoom.** Counter-scaled elements look right at every zoom level? Geometry stroke stays constant? Tags don't crowd at min zoom or disappear at max zoom?
- **Tilted line.** Rotated past 45° and past 90°. Endpoint ticks follow the line's normal (not vertical-on-screen)? Tag offsets compute correctly past the axis flip?
- **Flipped state.** If the component has a `flipped` flag (e.g. `<ReferenceLine flipped>`), every sub-element actually receives and uses it? A common bug: the grip flips, the band does not — because the prop only threads through one of two children.
- **Empty state, error state, mid-drag state.** Does mid-drag show preview state cleanly? Does empty render without `NaN`? `useLayoutEffect` on a `DOMRect` without a value comparison will infinite-loop and emit `NaN` style — guard it.

Skipping any of these is how regressions ship. "`getBoundingClientRect` math is right" is **not** sufficient verification for canvas-app work — the math can match while the rendered output looks visibly wrong (non-scaling-stroke is the classic example).

---

## Caveats and recurring foot-guns

- **`non-scaling-stroke` is unreliable.** Counter-scale `strokeWidth` instead. See above.
- **CSS rotation direction.** `rotate(angleDeg)` rotates clockwise in CSS / SVG; the math for "perpendicular to the line" is `angleDeg + 90` (or `- 90`, depending on which side). Verify with at least one tilted test case; off-by-90 errors are easy and visually catastrophic.
- **`useLayoutEffect` + `DOMRect` infinite loop.** `getBoundingClientRect` returns a new object every call; setting it into state with no equality check re-runs the effect forever and propagates `NaN`. Always compare numerically (`prev.width !== next.width`, etc.) before setting state.
- **Device-mode tokens.** Some size tokens have device-mode variants (e.g. mobile vs. tablet font size or padding). Don't memorize the numbers — list the size token JSON files under `tokens/size/` to learn the modes, then bind the appropriate variant. If the prototype simulates a specific device, set the device mode at the root and let CSS variables resolve.
- **Geometry vocabulary i18n.** Chinese geometry terms commonly mistranslate in canvas-app conversations:
  - **竖线 / 垂直** — usually means **perpendicular to the reference object**, *not* vertical-on-screen. Confirm in English on first use.
  - **上方** — usually means **above with a visual gap**, *not* "stacked on top of" / "overlapping."
  - **跟随线段方向** — "follows the line's direction" means rotation, *not* "stays horizontal."

  When the user uses these terms, restate in English ("you mean perpendicular to the line, with a 12vp gap above it — correct?") before generating code.

---

## End-of-task self-check

Before declaring a canvas-app prototype complete, walk this checklist. If any item is "no," fix it first. (For pixel-match canvas tasks, walk `design-fidelity.md`'s checklist too.)

- [ ] Architecture decisions were written and confirmed before any code — device-frame sizing, canvas pan/zoom, coordinate-space contract.
- [ ] The coordinate-space contract table was filled in (or its default accepted) and lives somewhere the next maintainer can find it.
- [ ] Inside the canvas, stroke widths counter-scale (`2 / zoom`); `vector-effect: non-scaling-stroke` is not the sole defense.
- [ ] Screen-anchored elements (grips / tags / tooltips) hold constant viewport size at min and max zoom.
- [ ] The canvas-specific case matrix was walked: min/max zoom, tilted line (past 45° and 90°), flipped state, empty / error / mid-drag.
- [ ] No `NaN` styles in the rendered DOM (check DevTools Elements for `NaN` substrings).
- [ ] Chinese geometry terms in the user's prompt were restated in English before coding.
- [ ] If the task was *also* pixel-match (Step 0 axis: contract): the universal contract-reading rules from `design-fidelity.md` Phase 1 (annotations, fetched SVG, variant diff) were walked.

If you skipped any item, the task isn't done. Don't ask the user to re-verify what you should have verified yourself.
