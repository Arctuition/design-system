import React from "react";
import { Link } from "react-router";
import { MarkdownRenderer } from "../components/shared/MarkdownRenderer";
import { ArrowRight, Shapes } from "lucide-react";
import { useAppData } from "../store/data-store";

export function IconologyPage() {
  const { tokenDocs, icons } = useAppData();
  // `tokenDocs.iconology` is seeded at boot from the build-time `?raw` import of
  // tokens/iconology.md, then overridden once the server load merges in whatever
  // the CMS Markdown editor most recently saved — same "live by default, bundled
  // fallback on first paint" model as /color and /size.
  const iconologyMd = tokenDocs.iconology;
  const iconCount = icons.length;

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      {/* Entry point */}
      <div className="mb-12">
        <Link
          to="/iconology/library"
          className="flex items-center justify-between w-full p-5 border border-border rounded-[var(--radius-card)] hover:border-primary hover:bg-secondary/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-[var(--radius-card)] bg-secondary">
              <Shapes className="size-4 text-foreground" />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                Icon Library
              </p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                Browse, search &amp; download {iconCount} icons
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>

      <MarkdownRenderer content={iconologyMd} />
    </div>
  );
}
