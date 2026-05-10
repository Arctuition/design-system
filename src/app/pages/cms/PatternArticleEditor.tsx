import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navigate, Link, useParams } from "react-router";
import { useAppData } from "../../store/data-store";
import { RichTextEditor } from "../../components/shared/RichTextEditor";
import { MarkdownRenderer } from "../../components/shared/MarkdownRenderer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { uploadPatternBundle } from "../../store/api";
import { projectId } from "/utils/supabase/info";
import { ArrowLeft, Save, X, History, RotateCcw, Trash2, Upload, AlertTriangle, Copy } from "lucide-react";

const STORAGE_BASE = `https://${projectId}.supabase.co/storage/v1/object/public/pattern-assets`;
import { toast } from "sonner";
import type { ArticleVersion } from "../../store/data-store";

type EditorMode = "html" | "markdown";

export function PatternArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, patterns, updatePattern, saveArticleWithVersion, getArticleVersions, deleteArticleVersion } = useAppData();
  const pattern = patterns.find((p) => p.id === id);
  const versions = getArticleVersions(`pattern-${id}`);

  const [draftTitle, setDraftTitle] = useState(pattern?.title || "");
  const [draftContent, setDraftContent] = useState(pattern?.content || "");
  const [dirty, setDirty] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [mode, setMode] = useState<EditorMode>("html");
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<{
    assetsUploaded: number;
    orphansRemoved: string[];
    mdPath: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<{
    message: string;
    missing?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Track saved content for meaningful dirty comparison
  const savedTitleRef = useRef(pattern?.title || "");
  const savedContentRef = useRef(pattern?.content || "");

  // True when this pattern's MD source is fresher than its HTML — the HTML
  // editor is showing stale content and saving it would clobber the newer MD.
  const mdNewerThanHtml = !!pattern
    && !!pattern.markdownUpdatedAt
    && pattern.markdownUpdatedAt > (pattern.htmlUpdatedAt || "");

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

  const switchMode = (target: EditorMode) => {
    if (target === mode) return;
    if (mode === "html" && dirty) {
      const ok = window.confirm("You have unsaved HTML changes. Switching modes will discard them. Continue?");
      if (!ok) return;
      handleCancel();
    }
    setMode(target);
  };

  const handleBundleUploadClick = () => fileInputRef.current?.click();

  const handleBundleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so the same file can re-trigger
    if (!file) return;

    if (!/\.zip$/i.test(file.name)) {
      toast.error(`Expected a .zip file, got "${file.name}".`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const result = await uploadPatternBundle(pattern.id, file);
      if (!result.ok) {
        setUploadError({ message: result.error, missing: result.missing });
        toast.error("Upload failed — see details below");
        return;
      }
      // Server already wrote the canonical state. Mirror it into the local
      // store so the UI reflects markdownContent + markdownUpdatedAt without
      // a refresh. The follow-on bulk PUT is a no-op (server diff sees no
      // further change).
      updatePattern(pattern.id, {
        markdownContent: result.pattern.markdownContent,
        markdownUpdatedAt: result.pattern.markdownUpdatedAt,
      });
      setLastUpload({
        assetsUploaded: result.assetsUploaded,
        orphansRemoved: result.orphansRemoved,
        mdPath: result.mdPath,
      });
      toast.success(
        `Uploaded ${file.name} — ${result.assetsUploaded} asset(s)` +
          (result.orphansRemoved.length
            ? `, removed ${result.orphansRemoved.length} orphan(s)`
            : ""),
      );
    } catch (err) {
      setUploadError({ message: (err as Error).message });
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const mdPublicUrl = `${
    import.meta.env.DEV
      ? "http://127.0.0.1:54321/functions/v1/make-server-067f252d"
      : `https://${projectId}.supabase.co/functions/v1/make-server-067f252d`
  }/patterns/${encodeURIComponent(pattern?.id || "")}.md`;

  const handleCopyMdUrl = async () => {
    try {
      await navigator.clipboard.writeText(mdPublicUrl);
      toast.success("Markdown URL copied");
    } catch {
      toast.error("Copy failed — your browser blocked clipboard access");
    }
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
            {mode === "html" && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 px-10 py-2 border-t border-border bg-muted/20">
          <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
            Source:
          </span>
          <Button
            size="sm"
            variant={mode === "html" ? "default" : "ghost"}
            type="button"
            onClick={() => switchMode("html")}
          >
            HTML editor
          </Button>
          <Button
            size="sm"
            variant={mode === "markdown" ? "default" : "ghost"}
            type="button"
            onClick={() => switchMode("markdown")}
          >
            Markdown source
          </Button>
          <span
            className="ml-3 text-muted-foreground"
            style={{ fontSize: "var(--text-label)" }}
          >
            {mode === "html"
              ? "Saving regenerates the markdown source automatically."
              : "Upload-only. The site shows MD whenever it's newer than HTML."}
          </span>
          {mode === "html" && mdNewerThanHtml && (
            <span
              className="ml-auto flex items-center gap-1.5 text-amber-700 dark:text-amber-400"
              style={{ fontSize: "var(--text-label)" }}
            >
              <AlertTriangle className="size-4" />
              Markdown source ({pattern.markdownUpdatedAt}) is newer than the HTML below ({pattern.htmlUpdatedAt || "never"}). Saving will overwrite it.
            </span>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {mode === "html" ? (
            <RichTextEditor
              value={draftContent}
              onChange={handleContentChange}
              onSave={dirty ? handleSave : undefined}
              stickyToolbar
              borderless
            />
          ) : (
            <div className="px-10 py-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  className="hidden"
                  onChange={handleBundleFileSelected}
                />
                <Button
                  size="sm"
                  type="button"
                  onClick={handleBundleUploadClick}
                  disabled={uploading}
                  className="gap-1"
                >
                  <Upload className="size-4" />
                  {uploading ? "Uploading…" : "Upload bundle (.zip)"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={handleCopyMdUrl}
                  className="gap-1"
                  disabled={!pattern.markdownContent}
                  title={mdPublicUrl}
                >
                  <Copy className="size-4" />
                  Copy MD URL
                </Button>
                <span
                  className="ml-auto text-muted-foreground"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  Last MD save: {pattern.markdownUpdatedAt || "never"}
                  {pattern.htmlUpdatedAt && ` · Last HTML save: ${pattern.htmlUpdatedAt}`}
                </span>
              </div>
              <p
                className="text-muted-foreground mb-4"
                style={{ fontSize: "var(--text-label)" }}
              >
                Bundle = one <code>.md</code> + any asset files (images, figures) referenced by relative paths. Uploading replaces the current MD and the pattern's stored assets; orphaned files from the previous bundle are removed.
              </p>
              {uploadError && (
                <div
                  className="border border-destructive/50 bg-destructive/10 rounded-lg p-4 mb-4"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  <p className="text-destructive font-medium mb-1">Upload rejected</p>
                  <p className="text-foreground">{uploadError.message}</p>
                  {uploadError.missing && uploadError.missing.length > 0 && (
                    <>
                      <p className="text-foreground mt-2 mb-1">Missing files:</p>
                      <ul className="list-disc list-inside text-foreground">
                        {uploadError.missing.map((m) => (
                          <li key={m}><code>{m}</code></li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
              {lastUpload && (
                <div
                  className="border border-border bg-secondary/30 rounded-lg p-3 mb-4"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  <span className="text-foreground">
                    Last upload: <code>{lastUpload.mdPath}</code> · {lastUpload.assetsUploaded} asset(s)
                    {lastUpload.orphansRemoved.length > 0
                      ? ` · removed ${lastUpload.orphansRemoved.length} orphan(s) (${lastUpload.orphansRemoved.join(", ")})`
                      : ""}
                  </span>
                </div>
              )}
              <div className="border border-border rounded-lg p-6 bg-card">
                {pattern.markdownContent ? (
                  <MarkdownRenderer
                    content={pattern.markdownContent}
                    className="article-content"
                    assetBaseUrl={`${STORAGE_BASE}/${pattern.id}/`}
                  />
                ) : (
                  <p
                    className="text-muted-foreground italic"
                    style={{ fontSize: "var(--text-p)" }}
                  >
                    No markdown source yet. Upload a bundle (.zip) above, or save the HTML editor to auto-generate one.
                  </p>
                )}
              </div>
            </div>
          )}
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