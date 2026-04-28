import React from "react";
import { Link } from "react-router";
import { MarkdownRenderer } from "../components/shared/MarkdownRenderer";
import { ArrowRight, Layers } from "lucide-react";
import sizeMd from "../../../tokens/tokens-size-space.md?raw";

export function SizePage() {
  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <MarkdownRenderer content={sizeMd} />

      {/* Entry point */}
      <div className="mt-12">
        <Link
          to="/size/tokens"
          className="inline-flex items-center justify-between w-full max-w-sm p-5 border border-border rounded-[var(--radius-card)] hover:border-primary hover:bg-secondary/30 transition-colors group"
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
      </div>
    </div>
  );
}
