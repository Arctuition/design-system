import React, { useMemo } from "react";

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

  return doc.body.innerHTML;
}

export function ArticleRenderer({ html, className }: ArticleRendererProps) {
  const cleanHtml = useMemo(() => sanitizeArticleHtml(html), [html]);

  return (
    <div
      className={`article-content ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
}
