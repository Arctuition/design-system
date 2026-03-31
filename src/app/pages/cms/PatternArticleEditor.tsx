import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navigate, Link, useParams } from "react-router";
import { useAppData } from "../../store/data-store";
import { RichTextEditor } from "../../components/shared/RichTextEditor";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Save, X, History, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ArticleVersion } from "../../store/data-store";

export function PatternArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, patterns, updatePattern, saveArticleWithVersion, getArticleVersions, deleteArticleVersion } = useAppData();
  const pattern = patterns.find((p) => p.id === id);
  const versions = getArticleVersions(`pattern-${id}`);

  const [draftTitle, setDraftTitle] = useState(pattern?.title || "");
  const [draftContent, setDraftContent] = useState(pattern?.content || "");
  const [dirty, setDirty] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // Track saved content for meaningful dirty comparison
  const savedTitleRef = useRef(pattern?.title || "");
  const savedContentRef = useRef(pattern?.content || "");

  const normalizeForComparison = useCallback((html: string) => {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/\s+/g, "").trim();
  }, []);

  const checkDirty = useCallback((title: string, content: string) => {
    const titleChanged = title.trim() !== savedTitleRef.current.trim();
    const contentChanged = normalizeForComparison(content) !== normalizeForComparison(savedContentRef.current);
    setDirty(titleChanged || contentChanged);
  }, [normalizeForComparison]);

  const handleSave = useCallback(() => {
    if (!pattern) return;
    if (pattern.content !== draftContent) {
      saveArticleWithVersion(`pattern-${id}`, draftContent, () => {});
    }
    updatePattern(pattern.id, { title: draftTitle, content: draftContent });
    savedTitleRef.current = draftTitle;
    savedContentRef.current = draftContent;
    setDirty(false);
    toast.success("Pattern saved");
  }, [pattern, id, draftContent, draftTitle, saveArticleWithVersion, updatePattern]);

  // Ctrl+S shortcut
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
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // React Router navigation blocking — using popstate instead of useBlocker
  useEffect(() => {
    if (!dirty) return;
    const handlePopState = () => {
      if (dirty) {
        const leave = window.confirm("You have unsaved changes. Leave anyway?");
        if (!leave) {
          window.history.pushState(null, "", window.location.href);
        }
      }
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [dirty]);

  // Auth guard — placed AFTER all hooks
  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-foreground mb-4" style={{ fontSize: "var(--text-h3)" }}>Pattern not found</p>
          <Link to="/cms/patterns-editor" className="text-primary hover:underline" style={{ fontSize: "var(--text-p)" }}>
            Back to Patterns
          </Link>
        </div>
      </div>
    );
  }

  const handleContentChange = (html: string) => {
    setDraftContent(html);
    checkDirty(draftTitle, html);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftTitle(e.target.value);
    checkDirty(e.target.value, draftContent);
  };

  const handleCancel = () => {
    setDraftTitle(pattern.title);
    setDraftContent(pattern.content);
    savedTitleRef.current = pattern.title;
    savedContentRef.current = pattern.content;
    setDirty(false);
  };

  const handleRestoreVersion = (version: ArticleVersion) => {
    setDraftContent(version.content);
    setDirty(true);
    setShowVersions(false);
    toast.success("Version restored to editor. Save to apply.");
  };

  const handleDeleteVersion = (versionId: string) => {
    if (confirm("Delete this version permanently?")) {
      deleteArticleVersion(versionId);
      toast.success("Version deleted");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border shrink-0">
        <div className="flex items-center justify-between px-10 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/cms/patterns-editor"
              className="flex items-center gap-1.5 text-primary hover:underline"
              style={{ fontSize: "var(--text-label)" }}
              onClick={(e) => {
                if (dirty && !confirm("You have unsaved changes. Leave anyway?")) {
                  e.preventDefault();
                }
              }}
            >
              <ArrowLeft className="size-4" /> Back
            </Link>
            <div className="w-px h-5 bg-border" />
            <input
              value={draftTitle}
              onChange={handleTitleChange}
              className="bg-transparent border-none outline-none text-foreground p-0 focus:ring-0 w-[400px]"
              style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}
              placeholder="Pattern title"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVersions(!showVersions)}
              className={`gap-1 ${showVersions ? "bg-primary/10 text-primary" : ""}`}
              type="button"
            >
              <History className="size-4" /> Versions ({versions.length})
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel} 
              className="px-4"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={!dirty} 
              className="px-6"
              type="button"
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <RichTextEditor
            value={draftContent}
            onChange={handleContentChange}
            onSave={dirty ? handleSave : undefined}
            stickyToolbar
            borderless
          />
        </div>

        {/* Version sidebar */}
        {showVersions && (
          <div className="w-[300px] border-l border-border bg-card overflow-auto shrink-0">
            <div className="p-4 border-b border-border">
              <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                Version History
              </h3>
            </div>
            {versions.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                No previous versions yet.
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
                        <Button variant="ghost" size="sm" className="h-6 px-2" type="button" onClick={() => handleRestoreVersion(version)}>
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