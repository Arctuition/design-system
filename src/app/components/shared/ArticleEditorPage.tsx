import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { RichTextEditor } from "./RichTextEditor";
import { Button } from "../ui/button";
import { ArrowLeft, Save, X, History, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppData, type ArticleVersion } from "../../store/data-store";

interface ArticleEditorPageProps {
  title: string;
  backTo: string;
  backLabel?: string;
  articleKey: string;
  initialValue: string;
  onSave: (html: string) => void;
}

export function ArticleEditorPage({
  title,
  backTo,
  backLabel = "Back to CMS",
  articleKey,
  initialValue,
  onSave,
}: ArticleEditorPageProps) {
  const { saveArticleWithVersion, getArticleVersions, restoreArticleVersion, deleteArticleVersion } = useAppData();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initialValue);
  const [dirty, setDirty] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const versions = getArticleVersions(articleKey);

  // Track what was last saved so we can compare against it for dirty detection
  const savedContentRef = useRef(initialValue);

  // Normalize HTML for meaningful dirty comparison.
  // We translate block boundaries and <br> into "\n" before stripping tags so
  // that adding/removing line breaks counts as a change (otherwise collapsing
  // all whitespace would hide pure-line-break edits and leave Save disabled).
  // Inline-tag churn (e.g. selection-driven span attributes) still normalizes
  // away because non-newline whitespace is collapsed.
  const normalizeForComparison = useCallback((html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|hr|blockquote|pre|figure|figcaption|table)>/gi, "\n")
      .replace(/<hr\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

  const handleChange = useCallback((html: string) => {
    setDraft(html);
    // Only mark dirty if text content meaningfully differs from what was last saved
    const currentNorm = normalizeForComparison(html);
    const savedNorm = normalizeForComparison(savedContentRef.current);
    setDirty(currentNorm !== savedNorm);
  }, [normalizeForComparison]);

  const handleSave = useCallback(() => {
    saveArticleWithVersion(articleKey, draft, onSave);
    savedContentRef.current = draft;
    setDirty(false);
    toast.success(`${title} saved`);
  }, [articleKey, draft, onSave, saveArticleWithVersion, title]);

  const handleCancel = useCallback(() => {
    setDraft(initialValue);
    savedContentRef.current = initialValue;
    setDirty(false);
  }, [initialValue]);

  const handleRestoreVersion = useCallback((version: ArticleVersion) => {
    setDraft(version.content);
    setDirty(true);
    setShowVersions(false);
    toast.success("Version restored to editor. Save to apply.");
  }, []);

  const handleDeleteVersion = useCallback((versionId: string) => {
    if (confirm("Delete this version permanently?")) {
      deleteArticleVersion(versionId);
      toast.success("Version deleted");
    }
  }, [deleteArticleVersion]);

  // Ctrl+S shortcut at page level
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) handleSave();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dirty, handleSave]);

  // Browser beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // React Router in-app navigation blocking
  // Using window.onpopstate instead of useBlocker to avoid POP navigation issues
  useEffect(() => {
    if (!dirty) return;
    const handlePopState = () => {
      if (dirty) {
        const leave = window.confirm("You have unsaved changes. Leave anyway?");
        if (!leave) {
          // Push current URL back to prevent navigation
          window.history.pushState(null, "", window.location.href);
        }
      }
    };
    // Push a state so we can intercept back
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dirty]);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky top header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              to={backTo}
              className="flex items-center gap-1.5 text-primary hover:underline"
              style={{ fontSize: "var(--text-label)" }}
              onClick={(e) => {
                if (dirty) {
                  if (!confirm("You have unsaved changes. Leave anyway?")) {
                    e.preventDefault();
                  }
                }
              }}
            >
              <ArrowLeft className="size-4" /> {backLabel}
            </Link>
            <div className="w-px h-5 bg-border" />
            <span className="text-foreground" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-muted-foreground mr-2" style={{ fontSize: "var(--text-label)" }}>
                Unsaved changes
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
              className={showVersions ? "bg-primary/10 text-primary" : ""}
              type="button"
            >
              <History className="size-4 mr-1" /> Versions ({versions.length})
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={!dirty} type="button">
              <X className="size-4 mr-1.5" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={!dirty} type="button">
              <Save className="size-4 mr-1.5" /> Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <RichTextEditor
              value={draft}
              onChange={handleChange}
              onSave={dirty ? handleSave : undefined}
              stickyToolbar
            />
          </div>
        </div>

        {/* Version history sidebar */}
        {showVersions && (
          <div className="w-[300px] border-l border-border bg-card overflow-auto shrink-0">
            <div className="p-4 border-b border-border">
              <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                Version History
              </h3>
            </div>
            {versions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                No previous versions saved yet. Versions are created each time you save.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {versions.map((version) => (
                  <div key={version.id} className="p-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-foreground" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                        {version.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          type="button"
                          onClick={() => handleRestoreVersion(version)}
                        >
                          <RotateCcw className="size-3 mr-1" /> Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-destructive hover:text-destructive"
                          type="button"
                          onClick={() => handleDeleteVersion(version.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground" style={{ fontSize: "11px" }}>
                      {new Date(version.timestamp).toLocaleString()} by {version.author}
                    </p>
                    <p className="text-muted-foreground mt-1 truncate" style={{ fontSize: "11px" }}>
                      {version.content.replace(/<[^>]*>/g, "").slice(0, 80)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Blocker dialog removed — using window.confirm instead */}
    </div>
  );
}