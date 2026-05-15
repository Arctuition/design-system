import { Link } from "react-router";

// 404 page — five responsive layouts matched to Figma:
// <768 (web-mobile) / 768+ (web-tablet) / 992+ (web-desktop, 8/16 split) /
// 1200+ (web-desktop, 12/12 split) / 1440+ (web-desktop-large, 8/16 split).
//
// Sizing follows the Figma "Web *" size-token modes. The website's own
// theme.css doesn't expose the mode-aware size aliases yet (layout-margin,
// spacing-stack-lg, radius-lg, btn padding etc. only carry single values),
// so the page declares them locally as CSS variables and switches them per
// breakpoint via @media — that mirrors the spec exactly and keeps everything
// downstream (paddings, gaps, button radius, "404" display size, grid split)
// driven from the same token names the designer uses.
//
// Surface is the fixed beige from Figma. The page has no dark-mode variant,
// so labels use the on-light gray scale directly — toggling app dark mode
// elsewhere doesn't flip the text to white on a beige surface.
//
// The illustration is the raster export from Figma (a 3D render, not a
// vector) shipped via /public/img-404.png. BASE_URL prefix is needed for
// the GitHub Pages /design-system/ deploy.

const IMG_404 = `${import.meta.env.BASE_URL}img-404.png`;

export function NotFoundPage() {
  return (
    <>
      <style>{NF_CSS}</style>
      <div className="nf-page">
        <div className="nf-container">
          {/* Image column. Spans 16/24 cols at 992 and 1440 bands,
              12/24 at 1200. Full row at <992 (stacked). */}
          <div className="nf-image-col">
            <img
              className="nf-image"
              src={IMG_404}
              alt=""
              aria-hidden="true"
              width={1867}
              height={1055}
            />
          </div>

          {/* Content column. Spans 8/24 at 992 and 1440, 12/24 at 1200,
              full row at <992. */}
          <div className="nf-content-col">
            <h1 className="nf-404">404</h1>
            <div className="nf-text">
              <p className="nf-title">Page not found</p>
              <p className="nf-desc">
                The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved
              </p>
            </div>
            <Link to="/" className="nf-btn">
              ArcSite Design System Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// The token values below are the Figma `size/*` and `font/*` values for each
// "Web *" mode, mapped 1:1 from tokens/tokens-size-space.md and the Figma
// variable definitions for the five breakpoint frames.
//
// Breakpoints follow Figma's frame names: 768 / 992 / 1200 / 1440.
// Default scope = web-mobile (<768).
const NF_CSS = `
.nf-page {
  /* web-mobile mode (default).
     max-content-width values come from Figma's frame *inner* widths
     (the explicit Frame 7/8/9/10 wrappers the designer added), not the
     generic size/layout-max-content-width token. Using the frame
     widths makes the layout snap to a fixed size within each band
     instead of scaling continuously with viewport. */
  --nf-layout-margin: 16px;
  --nf-layout-gutter: 8px;
  --nf-layout-max-content-width: 100%;
  --nf-spacing-stack-lg: 20px;
  --nf-spacing-stack-xl: 24px;
  --nf-radius-lg: 8px;
  --nf-btn-padding-h: 16px;
  --nf-btn-height: 48px;
  --nf-btn-gap: 8px;
  --nf-title-large: 28px;
  --nf-title-large-lh: 40px;
  --nf-body-large: 16px;
  --nf-body-large-lh: 22px;
  --nf-display-404: 100px;
  --nf-top-padding: 40px;
  --nf-bottom-padding: 40px;
  --nf-image-aspect: 1867 / 1055;

  /* Grid column spans — drive layout via a true 24-col grid (matches
     Figma's layout-columns=24 in web-desktop modes). On <992 the
     grid collapses to a single full-width row. */
  --nf-content-span: 24;
  --nf-image-span: 24;

  --nf-text-align: center;
  --nf-align: center;

  background-color: #EEE9E7;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  padding-top: var(--nf-top-padding);
  padding-bottom: var(--nf-bottom-padding);
  padding-left: var(--nf-layout-margin);
  padding-right: var(--nf-layout-margin);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.nf-container {
  width: 100%;
  max-width: var(--nf-layout-max-content-width);
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  column-gap: var(--nf-layout-gutter);
  row-gap: var(--nf-spacing-stack-xl);
  align-items: center;
}

.nf-image-col {
  grid-column: span var(--nf-image-span);
  order: 1; /* image on top when stacked */
  min-width: 0;
  /* On 992+ bands the image col becomes a fixed-aspect, overflow-clipped
     viewport so the raster can be zoomed in to fill it (matches the
     Figma instances which are placed 1.36–1.83× larger than their
     container and cropped from the edges). Mobile/tablet bands keep
     the simpler natural-aspect display below. */
  display: flex;
  align-items: center;
  justify-content: center;
}

.nf-content-col {
  grid-column: span var(--nf-content-span);
  display: flex;
  flex-direction: column;
  gap: var(--nf-spacing-stack-lg);
  text-align: var(--nf-text-align);
  align-items: var(--nf-align);
  order: 2;
  min-width: 0;
}

.nf-image {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
  aspect-ratio: var(--nf-image-aspect);
  object-fit: contain;
  /* Mobile / tablet cap so the 1867px render doesn't blow out the layout. */
  max-height: 320px;
}

.nf-404 {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: var(--nf-display-404);
  line-height: 1;
  letter-spacing: -0.033em;
  color: var(--color-global-gray-transparency-on-light-25, rgba(0, 0, 0, 0.25));
}

.nf-text {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 28rem;
}

.nf-title {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: var(--nf-title-large);
  line-height: var(--nf-title-large-lh);
  letter-spacing: -0.033em;
  color: var(--color-global-gray-85, #262626);
}

.nf-desc {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: var(--nf-body-large);
  line-height: var(--nf-body-large-lh);
  color: var(--color-global-gray-85, #262626);
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--nf-btn-gap);
  height: var(--nf-btn-height);
  padding: 0 var(--nf-btn-padding-h);
  border-radius: var(--nf-radius-lg);
  background-color: var(--color-fill-brand-primary, #e3571c);
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: var(--nf-body-large);
  line-height: var(--nf-body-large-lh);
  text-decoration: none;
  transition: opacity 0.15s ease;
}
.nf-btn:hover { opacity: 0.9; }
.nf-btn:focus-visible {
  outline: 2px solid var(--color-fill-brand-primary, #e3571c);
  outline-offset: 2px;
}

/* ---- web-tablet (768–991) — single column, max-content = 960 (per
       size/layout-max-content-width). Image and content each span
       full 24-col row since the layout is stacked here. ---- */
@media (min-width: 768px) {
  .nf-page {
    --nf-layout-margin: 24px;
    --nf-layout-gutter: 16px;
    --nf-layout-max-content-width: 960px;
    --nf-spacing-stack-lg: 24px;
    --nf-spacing-stack-xl: 32px;
    --nf-radius-lg: 8px;
    --nf-btn-padding-h: 20px;
    --nf-title-large: 28px;
    --nf-display-404: 120px;
    --nf-top-padding: 80px;
    --nf-bottom-padding: 80px;
  }
  .nf-image { max-height: 360px; }
}

/* ---- web-desktop (992–1199) — content 8 / image 16 cols.
       max-content-width is set to 912px = Figma frame 9's inner width
       (992 − 2×40 margin). This locks the layout's overall width to
       the Figma frame so it doesn't scale linearly with viewport
       inside the band — any extra viewport space becomes side margin. */
@media (min-width: 992px) {
  .nf-page {
    --nf-layout-margin: 40px;
    --nf-layout-gutter: 16px;
    --nf-layout-max-content-width: 912px;
    --nf-spacing-stack-lg: 24px;
    --nf-spacing-stack-xl: 32px;
    --nf-radius-lg: 8px;
    --nf-btn-padding-h: 20px;
    --nf-title-large: 32px;
    --nf-display-404: 140px;
    --nf-top-padding: 200px;
    --nf-bottom-padding: 80px;
    --nf-content-span: 8;
    --nf-image-span: 16;
    --nf-text-align: left;
    --nf-align: flex-start;
    /* Image col 602×344 ≈ 1.75 aspect (Figma frame). Image renders at
       137% of col width (826/602) to match Figma's 826×467 instance,
       overflowing the col on all sides without clipping. */
    --nf-image-col-aspect: 1.75;
    --nf-image-width: 137%;
  }
  .nf-content-col { order: 1; }
  .nf-image-col {
    order: 2;
    /* The image col becomes a layout reference frame whose
       aspect-ratio matches Figma's container; the image itself is
       absolutely positioned and rendered *larger* than the col so its
       edges spill outside without being clipped — same as toggling
       "Clip content" off on a Figma frame. Image's surrounding pixels
       are the same beige as the page bg, so the spill blends. */
    aspect-ratio: var(--nf-image-col-aspect);
    position: relative;
    display: block;
    overflow: visible;
  }
  .nf-image {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: var(--nf-image-width);
    height: auto;
    max-width: none;
    max-height: none;
    aspect-ratio: auto;
    object-fit: unset;
  }
}

/* ---- web-desktop (1200–1439) — content 12 / image 12 cols.
       max-content-width jumps to 1184 = Figma frame 8's inner width
       (1264 − 2×40 margin). Image col 584×322 ≈ 1.81 aspect, image
       zoomed 1.83× to match the 1068×603 Figma instance. ---- */
@media (min-width: 1200px) {
  .nf-page {
    --nf-layout-max-content-width: 1184px;
    --nf-content-span: 12;
    --nf-image-span: 12;
    /* Image col 584×322 ≈ 1.81 aspect; image at 183% to match the
       Figma 1068×603 instance (1068/584). */
    --nf-image-col-aspect: 1.81;
    --nf-image-width: 183%;
  }
}

/* ---- web-desktop-large (>=1440) — content 8 / image 16 cols.
       max-content-width = 1440 = Figma frame 7's inner width.
       Image col 952×346 ≈ 2.75 aspect, image zoomed 1.36× to match
       the 1294×731 Figma instance. ---- */
@media (min-width: 1440px) {
  .nf-page {
    --nf-layout-margin: 80px;
    --nf-layout-gutter: 24px;
    --nf-layout-max-content-width: 1440px;
    --nf-spacing-stack-lg: 32px;
    --nf-spacing-stack-xl: 48px;
    --nf-radius-lg: 10px;
    --nf-btn-padding-h: 24px;
    --nf-top-padding: 300px;
    --nf-bottom-padding: 80px;
    --nf-content-span: 8;
    --nf-image-span: 16;
    /* Image col 952×346 ≈ 2.75 aspect; image at 136% to match the
       Figma 1294×731 instance (1294/952). */
    --nf-image-col-aspect: 2.75;
    --nf-image-width: 136%;
  }
}
`;
