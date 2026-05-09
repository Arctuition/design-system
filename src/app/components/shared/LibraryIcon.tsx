import React, { useMemo } from "react";
import { useAppData } from "../../store/data-store";
import type { IconItem } from "../../store/data-store";

interface LibraryIconProps {
  // Library-icon name to look up. Matching is loose: a name like "home"
  // matches "home 24x24"; pass a more specific name (e.g. "home large 24x24")
  // when the loose match would be ambiguous.
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

function pickIcon(icons: IconItem[], name: string): IconItem | undefined {
  const lower = name.toLowerCase();
  // Exact match first, then prefix match (e.g. "home" → "home 24x24"),
  // then any name containing the token. Prefer 24x24 sizing where multiple
  // candidates exist — that's the chrome size everywhere on this site.
  const exact = icons.find((i) => i.name.toLowerCase() === lower);
  if (exact) return exact;
  const prefer24 = (a: IconItem, b: IconItem) =>
    Number(b.name.includes("24x24")) - Number(a.name.includes("24x24"));
  const prefix = icons.filter((i) => i.name.toLowerCase().startsWith(lower)).sort(prefer24);
  if (prefix[0]) return prefix[0];
  const contains = icons.filter((i) => i.name.toLowerCase().includes(lower)).sort(prefer24);
  return contains[0];
}

// Library SVGs ship with hardcoded fills/strokes. Rewrite the most common
// ones to `currentColor` so the icon inherits text color from its parent.
function recolorSvg(svg: string): string {
  return svg
    .replace(/(fill|stroke)="(?!none|currentColor|transparent)[^"]+"/g, '$1="currentColor"')
    .replace(/(fill|stroke)='(?!none|currentColor|transparent)[^']+'/g, "$1='currentColor'");
}

export function LibraryIcon({
  name,
  size = 18,
  className,
  style,
  ariaLabel,
}: LibraryIconProps) {
  const { icons } = useAppData();
  const icon = useMemo(() => pickIcon(icons, name), [icons, name]);
  const html = useMemo(() => (icon ? recolorSvg(icon.svgContent) : null), [icon]);

  // Reserve the slot even when the icon hasn't loaded yet, so chrome layout
  // stays stable during the brief data-store hydration window.
  if (!html) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: "inline-flex",
          width: size,
          height: size,
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <span
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flexShrink: 0,
        lineHeight: 0,
        ...style,
      }}
      // Ensure the inner <svg> fills the wrapper at the requested size,
      // regardless of the source artwork's intrinsic dimensions. The
      // `lib-icon-size-*` marker class is here to opt out of Radix's
      // dropdown-menu primitive, which forces unmarked descendant svgs to
      // 16px via `[&_svg:not([class*='size-'])]:size-4`. Any class string
      // containing the substring "size-" is enough; Tailwind doesn't
      // generate utilities for `lib-icon-size-N`, so the marker has no
      // CSS side effects.
      ref={(el) => {
        if (!el) return;
        const svg = el.querySelector("svg");
        if (svg) {
          svg.setAttribute("width", String(size));
          svg.setAttribute("height", String(size));
          svg.classList.add(`lib-icon-size-${size}`);
        }
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
