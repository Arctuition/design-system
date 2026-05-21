import React, { useState } from "react";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import { MarkdownRenderer } from "../components/shared/MarkdownRenderer";
import { LibraryIcon } from "../components/shared/LibraryIcon";
import { Badge } from "../components/ui/badge";
import { Calendar } from "lucide-react";

// Home hero — a blueprint-style schematic of the "ArcSite Design Hub". Two
// variants: a peach/orange-on-cream version for light mode and a darker
// inverse for dark mode. Lives in /public/home/ so it ships with the
// frontend bundle rather than being CMS-managed (intentional: this is the
// brand identity for the page, not editorial content).
const HOME_HERO_LIGHT = `${import.meta.env.BASE_URL}home/home-hero-light.jpg`;
const HOME_HERO_DARK = `${import.meta.env.BASE_URL}home/home-hero-dark.jpg`;

export function HomePage() {
  const { homeArticle, changeLogs } = useAppData();
  // Entries collapse by default — only the title row is visible until the
  // user clicks. Track expanded ids in a Set so multiple can be open at
  // once without coupling rows to each other.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      {/* Home hero — blueprint schematic. Width matches the article column
          via w-full inside the same max-w-[800px] container; light/dark
          variants swap via the .dark class on <html> (see theme.ts). */}
      <img
        src={HOME_HERO_LIGHT}
        alt="ArcSite Design Hub — blueprint schematic"
        className="block dark:hidden w-full h-auto rounded-[var(--radius-card)] mb-8"
      />
      <img
        src={HOME_HERO_DARK}
        alt="ArcSite Design Hub — blueprint schematic"
        className="hidden dark:block w-full h-auto rounded-[var(--radius-card)] mb-8"
      />

      {/* Article Section */}
      <ArticleRenderer html={homeArticle} />

      {/* Change Log */}
      <div className="mt-12">
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Change Log
        </h2>
        <div className="h-px bg-border mt-3 mb-6" />

        <div className="space-y-0">
          {changeLogs.map((entry, index) => {
            const isOpen = expanded.has(entry.id);
            const hasDescription = !!entry.description?.trim();
            return (
              <div key={entry.id} className="flex gap-6 group">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="size-3 rounded-full bg-primary shrink-0 mt-2" />
                  {index < changeLogs.length - 1 && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => hasDescription && toggle(entry.id)}
                    aria-expanded={isOpen}
                    aria-controls={`changelog-body-${entry.id}`}
                    className={`w-full text-left rounded-[var(--radius-card)] -mx-2 px-2 py-1 transition-colors ${
                      hasDescription
                        ? "cursor-pointer hover:bg-muted/40"
                        : "cursor-default"
                    }`}
                    disabled={!hasDescription}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline">{entry.version}</Badge>
                      <span
                        className="flex items-center gap-1.5 text-muted-foreground"
                        style={{ fontSize: "var(--text-label)" }}
                      >
                        <Calendar className="size-3.5" />
                        {entry.date}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="flex-1 min-w-0 text-foreground"
                        style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}
                      >
                        {entry.title}
                      </span>
                      {hasDescription && (
                        <span
                          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                            isOpen ? "" : "-rotate-90"
                          }`}
                          style={{ lineHeight: 0 }}
                          aria-hidden="true"
                        >
                          <LibraryIcon name="chevron down 16x16" size={16} />
                        </span>
                      )}
                    </div>
                  </button>
                  {hasDescription && isOpen && (
                    <MarkdownRenderer
                      className="mt-2 text-card-foreground changelog-description"
                      content={entry.description}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
