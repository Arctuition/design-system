import React, { useMemo, useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { useAppData, type PatternArticle } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import { MarkdownRenderer } from "../components/shared/MarkdownRenderer";
import { projectId } from "/utils/supabase/info";
import { ArrowLeft } from "lucide-react";

const STORAGE_BASE = `https://${projectId}.supabase.co/storage/v1/object/public/pattern-assets`;

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

type Rendering =
  | { mode: "html"; processedHtml: string; outline: OutlineItem[] }
  | { mode: "markdown"; mdContent: string; outline: OutlineItem[] };

function extractMdHeadings(md: string): OutlineItem[] {
  const items: OutlineItem[] = [];
  let inFence = false;
  let idx = 0;
  for (const line of md.split("\n")) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      items.push({ id: `heading-${idx++}`, text: m[2].trim(), level: m[1].length });
    }
  }
  return items;
}

function processHtmlForOutline(html: string): { processedHtml: string; outline: OutlineItem[] } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items: OutlineItem[] = [];
  let idx = 0;
  doc.querySelectorAll("h2, h3").forEach((el) => {
    const id = `heading-${idx++}`;
    el.id = id;
    items.push({
      id,
      text: el.textContent || "",
      level: el.tagName === "H2" ? 2 : 3,
    });
  });
  return { processedHtml: doc.body.innerHTML, outline: items };
}

function pickRendering(pattern: PatternArticle): Rendering {
  // Show HTML if it exists AND is at least as fresh as MD. Empty-string
  // timestamps compare as "older than any real ISO date", so an HTML-only
  // legacy pattern (markdownUpdatedAt: "") naturally falls into HTML mode.
  const htmlWins =
    !!pattern.content && pattern.htmlUpdatedAt >= (pattern.markdownUpdatedAt || "");
  if (htmlWins) {
    return { mode: "html", ...processHtmlForOutline(pattern.content) };
  }
  if (pattern.markdownContent) {
    return {
      mode: "markdown",
      mdContent: pattern.markdownContent,
      outline: extractMdHeadings(pattern.markdownContent),
    };
  }
  // Both empty — fall back to HTML mode with empty body (renders nothing).
  return { mode: "html", ...processHtmlForOutline(pattern.content || "") };
}

export function PatternDetailPage() {
  const { id } = useParams();
  const { patterns } = useAppData();
  const pattern = patterns.find((p) => p.id === id && !p.deleted);
  const [activeHeading, setActiveHeading] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const rendering = useMemo<Rendering | null>(() => {
    if (!pattern) return null;
    return pickRendering(pattern);
  }, [pattern]);

  // For MD mode, inject IDs into post-render heading DOM nodes so the outline
  // anchor links resolve. For HTML mode, IDs are already in processedHtml from
  // the synchronous DOMParser pass.
  useEffect(() => {
    if (!rendering) return;
    const container = containerRef.current;
    if (!container) return;

    if (rendering.mode === "markdown") {
      const headings = container.querySelectorAll("h2, h3");
      headings.forEach((el, idx) => {
        el.id = `heading-${idx}`;
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { threshold: 0.5, rootMargin: "-80px 0px -70% 0px" }
    );
    rendering.outline.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [rendering]);

  if (!pattern || !rendering) {
    return (
      <div className="max-w-[800px] mx-auto px-8 py-10 text-center">
        <p className="text-muted-foreground" style={{ fontSize: "var(--text-p)" }}>Pattern not found.</p>
        <Link to="/patterns" className="text-primary mt-4 inline-block" style={{ fontSize: "var(--text-p)" }}>
          Back to Patterns
        </Link>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-[800px] mx-auto px-8 py-10">
        <Link
          to="/patterns"
          className="flex items-center gap-1.5 text-primary mb-6 hover:underline"
          style={{ fontSize: "var(--text-label)" }}
        >
          <ArrowLeft className="size-4" />
          Back to Patterns
        </Link>

        <div ref={containerRef}>
          {rendering.mode === "html" ? (
            <ArticleRenderer html={rendering.processedHtml} />
          ) : (
            <MarkdownRenderer
              content={rendering.mdContent}
              className="article-content"
              assetBaseUrl={`${STORAGE_BASE}/${pattern.id}/`}
            />
          )}
        </div>
      </div>

      {/* Outline sidebar (right) */}
      {rendering.outline.length > 0 && (
        <aside className="w-[220px] shrink-0 sticky top-0 h-screen overflow-auto border-l border-border py-10 px-4 hidden lg:block">
          <p className="text-muted-foreground mb-4" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
            ON THIS PAGE
          </p>
          <nav className="space-y-1">
            {rendering.outline.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block py-1 transition-colors ${
                  activeHeading === item.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{
                  fontSize: "var(--text-label)",
                  paddingLeft: item.level === 3 ? "12px" : "0",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item.text}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </div>
  );
}
