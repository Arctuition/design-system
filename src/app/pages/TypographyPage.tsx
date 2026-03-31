import React from "react";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";

export function TypographyPage() {
  const { typographyArticle } = useAppData();

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <ArticleRenderer html={typographyArticle} />

      {/* Live type specimens */}
      <div className="mt-12 space-y-8">
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Live Specimens
        </h2>
        <div className="h-px bg-border mb-6" />

        <div className="space-y-6">
          {[
            { label: "H1", size: "var(--text-h1)", weight: "var(--font-weight-normal)", tag: "h1" },
            { label: "H2", size: "var(--text-h2)", weight: "var(--font-weight-normal)", tag: "h2" },
            { label: "H3", size: "var(--text-h3)", weight: "var(--font-weight-normal)", tag: "h3" },
            { label: "H4", size: "var(--text-h4)", weight: "var(--font-weight-medium)", tag: "h4" },
            { label: "Body (P)", size: "var(--text-p)", weight: "var(--font-weight-normal)", tag: "p" },
            { label: "Label", size: "var(--text-label)", weight: "var(--font-weight-normal)", tag: "label" },
            { label: "Table Header", size: "var(--text-table-header)", weight: "var(--font-weight-medium)", tag: "th" },
            { label: "Input", size: "var(--text-input)", weight: "var(--font-weight-normal)", tag: "input" },
          ].map((spec) => (
            <div key={spec.label} className="flex items-baseline gap-6 pb-6 border-b border-border/50">
              <div className="w-[120px] shrink-0">
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                  {spec.label}
                </span>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>
                  {spec.size.replace("var(--text-", "").replace(")", "")}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <span
                  style={{
                    fontSize: spec.size,
                    fontWeight: spec.weight,
                    lineHeight: "1.5",
                    color: "var(--foreground)",
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}