import React from "react";
import { Link } from "react-router";
import { MarkdownRenderer } from "../components/shared/MarkdownRenderer";
import { ArrowRight, Palette, Layers } from "lucide-react";
import { useAppData } from "../store/data-store";

export function ColorPage() {
  const { tokenDocs } = useAppData();
  // `tokenDocs.color` is seeded at boot from the build-time `?raw` import of
  // tokens/tokens-color.md, then overridden once the server load merges in
  // whatever the CMS editor most recently saved. So this is "live by default,
  // bundled fallback on first paint" without any explicit fetch in this file.
  const colorMd = tokenDocs.color;
  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      {/* Entry points */}
      <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/color/tokens"
          className="flex items-center justify-between p-5 border border-border rounded-[var(--radius-card)] hover:border-primary hover:bg-secondary/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-[var(--radius-card)] bg-secondary">
              <Layers className="size-4 text-foreground" />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                Design Tokens
              </p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                CSS variables + export
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          to="/color/swatches"
          className="flex items-center justify-between p-5 border border-border rounded-[var(--radius-card)] hover:border-primary hover:bg-secondary/30 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-[var(--radius-card)] bg-secondary">
              <Palette className="size-4 text-foreground" />
            </div>
            <div>
              <p style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                Swatches
              </p>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: "var(--text-label)" }}>
                Interactive color preview
              </p>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
      </div>

      <MarkdownRenderer content={colorMd} />
    </div>
  );
}
