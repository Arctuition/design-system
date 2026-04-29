import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CssSyntaxBlock } from "./CssSyntaxBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--font-weight-normal)", marginBottom: "1rem", marginTop: "2rem" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)", marginBottom: "0.75rem", marginTop: "2rem" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-normal)", marginBottom: "0.5rem", marginTop: "1.5rem" }}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)", marginBottom: "0.5rem", marginTop: "1.25rem" }}>
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p style={{ fontSize: "var(--text-p)", lineHeight: "1.7", marginBottom: "1rem", color: "var(--foreground)" }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul style={{ fontSize: "var(--text-p)", lineHeight: "1.7", marginBottom: "1rem", paddingLeft: "1.5rem", listStyleType: "disc" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ fontSize: "var(--text-p)", lineHeight: "1.7", marginBottom: "1rem", paddingLeft: "1.5rem", listStyleType: "decimal" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: "0.25rem" }}>{children}</li>
          ),
          // `pre` wraps ALL fenced code blocks — every block goes through
          // the shiki-powered CssSyntaxBlock. Blocks without a language tag
          // render as "plaintext" (no coloring, but consistent layout).
          pre: ({ children }) => {
            const child = React.Children.toArray(children)[0] as React.ReactElement<any>;
            const codeClass: string = child?.props?.className ?? "";
            const lang = codeClass.replace("language-", "") || "plaintext";
            const raw = String(child?.props?.children ?? "").replace(/\n$/, "");

            return (
              <div style={{ marginBottom: "1rem" }}>
                <CssSyntaxBlock code={raw} lang={lang} />
              </div>
            );
          },
          // `code` handles INLINE code only; block code is handled by `pre` above
          code: ({ children, className: codeClass }) => {
            if (codeClass) {
              // Inside a <pre> — pass through, already rendered by `pre`
              return <code className={codeClass}>{children}</code>;
            }
            // Inline code
            return (
              <code
                style={{
                  backgroundColor: "var(--secondary)",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "var(--radius)",
                  fontSize: "var(--text-label)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  color: "var(--foreground)",
                }}
              >
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "var(--text-p)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: "var(--secondary)" }}>{children}</thead>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: "0.5rem 1rem",
                textAlign: "left",
                fontSize: "var(--text-table-header)",
                fontWeight: "var(--font-weight-medium)",
                borderBottom: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: "0.5rem 1rem",
                borderBottom: "1px solid var(--border)",
                color: "var(--foreground)",
                verticalAlign: "top",
              }}
            >
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: "3px solid var(--border)",
                paddingLeft: "1rem",
                marginLeft: 0,
                marginBottom: "1rem",
                color: "var(--muted-foreground)",
                fontSize: "var(--text-p)",
              }}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "1.5rem 0" }} />
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              style={{ color: "var(--primary)", textDecoration: "underline" }}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: "var(--font-weight-medium)" }}>{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
