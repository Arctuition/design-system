import React, { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "../utils/clipboard";

/**
 * Human-friendly view of `public/llms.txt`. The file is generated at build
 * time by `scripts/generate-llms-txt.mjs` so AI agents can fetch the URL
 * directly as plain text. This page just fetches and displays it with a
 * copy button.
 */
export function LlmsPage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const [content, setContent] = useState<string>("Loading…");

  useEffect(() => {
    let cancelled = false;
    fetch("/llms.txt", { headers: { Accept: "text/plain" } })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((txt) => {
        if (!cancelled) setContent(txt);
      })
      .catch((err) => {
        if (!cancelled) setContent(`Failed to load /llms.txt: ${String(err)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCopy = () => {
    copyToClipboard(content);
    toast.success("Copied llms.txt content");
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
            AI Reference
          </h1>
          <p className="text-muted-foreground mt-2" style={{ fontSize: "var(--text-p)" }}>
            Machine-readable design token reference for AI coding agents.
            Share the URL{" "}
            <code
              className="bg-secondary px-1.5 py-0.5 rounded-[var(--radius)] text-foreground"
              style={{ fontSize: "var(--text-label)" }}
            >
              {baseUrl}/llms.txt
            </code>{" "}
            with your agent — it's served as plain text.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-[var(--radius-card)] text-foreground hover:bg-secondary transition-colors shrink-0"
          style={{ fontSize: "var(--text-label)" }}
        >
          <Copy className="size-4" />
          Copy all
        </button>
      </div>

      <pre
        className="bg-secondary rounded-[var(--radius-card)] p-6 overflow-x-auto text-foreground"
        style={{
          fontSize: "var(--text-label)",
          fontFamily:
            "'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content}
      </pre>
    </div>
  );
}
