import React from "react";
import { Link } from "react-router";
import { useAppData } from "../store/data-store";
import { ArrowRight, Calendar } from "lucide-react";

export function PatternsPage() {
  const { patterns } = useAppData();
  const activePatterns = patterns.filter((p) => !p.deleted);

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--font-weight-normal)" }}>
        Patterns
      </h1>
      <p className="mt-2 text-card-foreground" style={{ fontSize: "var(--text-p)" }}>
        Design patterns provide reusable solutions to common design challenges. Each pattern includes usage guidelines, anatomy breakdowns, and best practices.
      </p>
      <div className="h-px bg-border mt-6 mb-8" />

      <div className="space-y-4">
        {activePatterns.map((pattern) => (
          <Link
            key={pattern.id}
            to={`/patterns/${pattern.id}`}
            className="flex items-center gap-4 p-5 border border-border rounded-[var(--radius-card)] hover:border-primary/50 hover:bg-secondary/20 transition-all group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-foreground" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                {pattern.title}
              </p>
              <span className="flex items-center gap-1.5 text-muted-foreground mt-1" style={{ fontSize: "var(--text-label)" }}>
                <Calendar className="size-3.5" />
                Updated {pattern.updatedAt}
              </span>
            </div>
            <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      {activePatterns.length === 0 && (
        <div className="text-center py-16 text-muted-foreground" style={{ fontSize: "var(--text-p)" }}>
          No patterns available yet.
        </div>
      )}
    </div>
  );
}