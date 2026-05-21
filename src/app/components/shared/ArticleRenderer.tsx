import React, { useMemo, useEffect, useRef } from "react";
// Theme CSS — small (~2 KB gzip), kept eager so highlighted spans always have
// colors even before the lazy hljs chunk finishes loading.
import "highlight.js/styles/github.css";
import { highlightCodeIn } from "./syntax-highlight";

interface ArticleRendererProps {
  html: string;
  className?: string;
}

/**
 * Strips empty / placeholder-only figcaptions and fig-description elements
 * so they don't render as blank space on the public page.
 */
function sanitizeArticleHtml(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, "text/html");

  // Remove empty or placeholder figcaptions
  doc.querySelectorAll("figcaption").forEach((el) => {
    const text = el.textContent?.trim() ?? "";
    if (text === "" || text === "Add caption here...") {
      el.remove();
      return;
    }
    // Normalise inline styles to design system spec
    const s = (el as HTMLElement).style;
    s.removeProperty("border-bottom");
    s.removeProperty("border-bottom-width");
    s.removeProperty("border-bottom-style");
    s.removeProperty("border-bottom-color");
    s.fontStyle = "italic";
    s.fontWeight = "var(--font-weight-medium)";
    s.color = "var(--color-label-primary)";
  });

  // Remove empty or placeholder fig-descriptions
  doc.querySelectorAll('[data-role="fig-description"]').forEach((el) => {
    const text = el.textContent?.trim() ?? "";
    if (text === "" || text === "Add description here...") {
      el.remove();
      return;
    }
    // Normalise inline styles to design system spec
    const s = (el as HTMLElement).style;
    s.fontStyle = "italic";
    s.fontWeight = "var(--font-weight-normal)";
    s.color = "var(--color-label-secondary)";
  });

  // Strip inline `color` from text-content elements so theme tokens always
  // win. Background: the rich-text editor's color picker records every
  // choice as an inline style, which beats CSS specificity in BOTH modes —
  // it just happens to be near-foreground in light mode so the bug is
  // invisible until dark mode flips the body to dark and the hardcoded
  // near-black text disappears against it. Font-size / font-weight / other
  // inline properties are preserved (those represent layout intent that
  // doesn't break across themes); only `color` is dropped, falling back to
  // the theme's --foreground / --card-foreground via `.article-content`.
  // Figcaption + fig-description are exempt because we set their color
  // explicitly above to design-system label tokens.
  doc
    .querySelectorAll("h1, h2, h3, h4, h5, h6, p, p span, li, li span, strong, em, a")
    .forEach((el) => {
      const html = el as HTMLElement;
      if (html.closest("figcaption, [data-role='fig-description']")) return;
      if (html.style.color) html.style.removeProperty("color");
    });

  return doc.body.innerHTML;
}

export function ArticleRenderer({ html, className }: ArticleRendererProps) {
  const cleanHtml = useMemo(() => sanitizeArticleHtml(html), [html]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => highlightCodeIn(containerRef.current), [cleanHtml]);

  return (
    <div
      ref={containerRef}
      className={`article-content ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
