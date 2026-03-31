import React, { useMemo, useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import { ArrowLeft } from "lucide-react";

interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

function extractOutline(html: string): OutlineItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const items: OutlineItem[] = [];
  doc.querySelectorAll("h2, h3").forEach((el, i) => {
    const id = `heading-${i}`;
    const text = el.textContent || "";
    const level = el.tagName === "H2" ? 2 : 3;
    items.push({ id, text, level });
  });
  return items;
}

export function PatternDetailPage() {
  const { id } = useParams();
  const { patterns } = useAppData();
  const pattern = patterns.find((p) => p.id === id && !p.deleted);
  const [activeHeading, setActiveHeading] = useState("");

  const outline = useMemo(() => {
    if (!pattern) return [];
    return extractOutline(pattern.content);
  }, [pattern]);

  // Inject IDs into rendered headings
  const processedContent = useMemo(() => {
    if (!pattern) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(pattern.content, "text/html");
    let idx = 0;
    doc.querySelectorAll("h2, h3").forEach((el) => {
      el.id = `heading-${idx}`;
      idx++;
    });
    return doc.body.innerHTML;
  }, [pattern]);

  useEffect(() => {
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
    outline.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [outline, processedContent]);

  if (!pattern) {
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

        <ArticleRenderer html={processedContent} />
      </div>

      {/* Outline sidebar (right) */}
      {outline.length > 0 && (
        <aside className="w-[220px] shrink-0 sticky top-0 h-screen overflow-auto border-l border-border py-10 px-4 hidden lg:block">
          <p className="text-muted-foreground mb-4" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
            ON THIS PAGE
          </p>
          <nav className="space-y-1">
            {outline.map((item) => (
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