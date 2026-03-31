import React from "react";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import { Badge } from "../components/ui/badge";
import { Calendar } from "lucide-react";

export function HomePage() {
  const { homeArticle, changeLogs } = useAppData();

  return (
    <div className="max-w-[800px] mx-auto px-8 py-10">
      {/* Article Section */}
      <ArticleRenderer html={homeArticle} />

      {/* Change Log */}
      <div className="mt-12">
        <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Change Log
        </h2>
        <div className="h-px bg-border mt-3 mb-6" />

        <div className="space-y-0">
          {changeLogs.map((entry, index) => (
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
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline">{entry.version}</Badge>
                  <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                    <Calendar className="size-3.5" />
                    {entry.date}
                  </span>
                </div>
                <p className="mt-2 text-foreground" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                  {entry.title}
                </p>
                <p className="mt-1 text-card-foreground" style={{ fontSize: "var(--text-p)" }}>
                  {entry.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}