import React, { useState } from "react";
import { loadStateFromServer, bulkSaveState } from "../../store/api";
import { Button } from "../ui/button";

/**
 * Strip ALL inline formatting from HTML content and restore only default formatting
 * for contextual elements (figcaption, fig-description, th, h4)
 */
function cleanHTMLContent(html: string): string {
  if (!html || typeof html !== "string") return html;

  // Create a temporary DOM element to parse and clean
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Helper to recursively strip all formatting tags and inline styles
  const stripAllFormatting = (element: HTMLElement) => {
    // Remove all inline styles from the element itself
    element.removeAttribute("style");

    // Process all child nodes
    const children = Array.from(element.childNodes);
    children.forEach((child) => {
      if (child.nodeType === 1) {
        // Element node
        const childEl = child as HTMLElement;
        const tagName = childEl.tagName;

        // If it's a formatting tag (SPAN, B, I, U, STRONG, EM, FONT, etc.), unwrap it
        if (
          ["SPAN", "B", "I", "U", "STRONG", "EM", "FONT", "MARK", "SMALL", "BIG", "SUB", "SUP"].includes(
            tagName
          )
        ) {
          // Move all children out of this wrapper before removing
          while (childEl.firstChild) {
            element.insertBefore(childEl.firstChild, childEl);
          }
          childEl.remove();
        } else {
          // For other elements (div, p, h1-h6, etc.), just remove style attribute and recurse
          childEl.removeAttribute("style");
          stripAllFormatting(childEl);
        }
      }
    });

    // Normalize text nodes (merge adjacent text nodes)
    element.normalize();
  };

  // Apply default formatting to contextual elements
  const applyDefaultFormatting = (element: HTMLElement) => {
    const tagName = element.tagName;
    const dataRole = element.getAttribute("data-role");

    // Get the text content (already cleaned)
    const textContent = element.textContent?.trim() || "";
    
    // Skip if empty
    if (!textContent) return;

    // Apply defaults based on element type
    if (tagName === "FIGCAPTION") {
      // Caption default: bold + italic
      element.innerHTML = "";
      const strong = document.createElement("strong");
      const em = document.createElement("em");
      em.textContent = textContent;
      strong.appendChild(em);
      element.appendChild(strong);
    } else if (dataRole === "fig-description") {
      // Description default: italic only
      element.innerHTML = "";
      const em = document.createElement("em");
      em.textContent = textContent;
      element.appendChild(em);
    } else if (tagName === "TH") {
      // Table header default: bold only
      element.innerHTML = "";
      const strong = document.createElement("strong");
      strong.textContent = textContent;
      element.appendChild(strong);
    } else if (tagName === "H4") {
      // H4 default: bold only
      element.innerHTML = "";
      const strong = document.createElement("strong");
      strong.textContent = textContent;
      element.appendChild(strong);
    }
  };

  // First pass: Strip all formatting from all elements
  stripAllFormatting(temp);

  // Second pass: Apply defaults to contextual elements
  const figcaptions = temp.querySelectorAll("figcaption");
  figcaptions.forEach((el) => applyDefaultFormatting(el as HTMLElement));

  const descriptions = temp.querySelectorAll('[data-role="fig-description"]');
  descriptions.forEach((el) => applyDefaultFormatting(el as HTMLElement));

  const tableHeaders = temp.querySelectorAll("th");
  tableHeaders.forEach((el) => applyDefaultFormatting(el as HTMLElement));

  const h4s = temp.querySelectorAll("h4");
  h4s.forEach((el) => applyDefaultFormatting(el as HTMLElement));

  return temp.innerHTML;
}

export function DataCleanup() {
  const [status, setStatus] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleCleanup = async () => {
    setIsProcessing(true);
    setStatus("Loading data from server...");
    setResults([]);

    try {
      // Load all state from server
      const serverData = await loadStateFromServer();
      if (!serverData) {
        setStatus("❌ Failed to load data from server");
        setIsProcessing(false);
        return;
      }

      setStatus("Processing content...");
      const logs: string[] = [];
      const cleanedData: Record<string, any> = {};

      // Clean all HTML content fields
      const htmlFields = [
        "homeArticle",
        "typographyArticle",
        "colorArticle",
        "iconologyArticle",
      ];

      for (const field of htmlFields) {
        if (serverData[field] && typeof serverData[field] === "string") {
          const original = serverData[field];
          const cleaned = cleanHTMLContent(original);
          cleanedData[field] = cleaned;

          if (original !== cleaned) {
            logs.push(`✓ Cleaned ${field}`);
          } else {
            logs.push(`○ ${field} - no changes needed`);
          }
        }
      }

      // Clean pattern articles
      if (serverData.patterns && Array.isArray(serverData.patterns)) {
        cleanedData.patterns = serverData.patterns.map((pattern: any) => {
          if (pattern.content && typeof pattern.content === "string") {
            const original = pattern.content;
            const cleaned = cleanHTMLContent(original);

            if (original !== cleaned) {
              logs.push(`✓ Cleaned pattern: ${pattern.title}`);
            } else {
              logs.push(`○ Pattern: ${pattern.title} - no changes needed`);
            }

            return { ...pattern, content: cleaned };
          }
          return pattern;
        });
      }

      // Clean changelog descriptions
      if (serverData.changeLogs && Array.isArray(serverData.changeLogs)) {
        cleanedData.changeLogs = serverData.changeLogs.map((log: any) => {
          if (log.description && typeof log.description === "string") {
            const original = log.description;
            const cleaned = cleanHTMLContent(original);

            if (original !== cleaned) {
              logs.push(`✓ Cleaned changelog: ${log.version}`);
            } else {
              logs.push(`○ Changelog: ${log.version} - no changes needed`);
            }

            return { ...log, description: cleaned };
          }
          return log;
        });
      }

      // Copy over other fields that don't need cleaning
      const otherFields = ["colorTokens", "icons", "editors", "articleVersions"];
      otherFields.forEach((field) => {
        if (serverData[field] !== undefined) {
          cleanedData[field] = serverData[field];
        }
      });

      setResults(logs);
      setStatus("Saving cleaned data to server...");

      // Save back to server
      const success = await bulkSaveState(cleanedData);

      if (success) {
        setStatus("✅ Cleanup completed successfully! Refresh the page to see changes.");
      } else {
        setStatus("⚠️ Cleanup processed but failed to save to server");
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      setStatus(`❌ Error during cleanup: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-[var(--radius-card)] p-6">
        <h1
          className="mb-2"
          style={{
            fontSize: "var(--text-h2)",
            lineHeight: "var(--text-h2-line-height)",
            fontWeight: "var(--text-h2-font-weight)",
          }}
        >
          Data Cleanup Utility
        </h1>
        <p
          className="text-muted-foreground mb-6"
          style={{
            fontSize: "var(--text-body)",
            lineHeight: "var(--text-body-line-height)",
          }}
        >
          This utility will scan all content in the database and remove any custom formatting
          (colors, font sizes, extra styles) while preserving the default formatting defined in your
          design system.
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleCleanup}
            disabled={isProcessing}
            style={{
              fontSize: "var(--text-button)",
              padding: "var(--spacing-2) var(--spacing-4)",
            }}
          >
            {isProcessing ? "Processing..." : "Clean All Content"}
          </Button>

          {status && (
            <div
              className="p-4 bg-secondary/30 border border-border rounded-[var(--radius)]"
              style={{
                fontSize: "var(--text-body)",
                lineHeight: "var(--text-body-line-height)",
              }}
            >
              {status}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4">
              <h3
                className="mb-2"
                style={{
                  fontSize: "var(--text-h4)",
                  lineHeight: "var(--text-h4-line-height)",
                  fontWeight: "var(--text-h4-font-weight)",
                }}
              >
                Processing Log:
              </h3>
              <div
                className="bg-background border border-border rounded-[var(--radius)] p-4 max-h-96 overflow-y-auto"
                style={{
                  fontSize: "var(--text-small)",
                  lineHeight: "var(--text-small-line-height)",
                }}
              >
                {results.map((log, i) => (
                  <div key={i} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}