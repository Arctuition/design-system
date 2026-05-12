import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import { ArrowLeft, Loader2, Eye, FileCode, Columns2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useAppData, type TokenDocs } from "../../store/data-store";
import { MarkdownRenderer } from "./MarkdownRenderer";

type ViewMode = "edit" | "split" | "preview";

interface Props {
  /** Which token-docs slot this editor binds to. */
  slot: keyof TokenDocs;
  /** Page title shown in the header. */
  title: string;
  /** Path the "Back" link points at. */
  backTo: string;
  /** Visible label for the Back link. */
  backLabel?: string;
}

/**
 * Markdown editor for the public token reference docs. Reads the current
 * value from `useAppData().tokenDocs[slot]`, lets the editor draft changes
 * in a local buffer, and persists via `setTokenDoc` (which debounces to
 * Supabase KV under the hood). Save also forces an immediate flush via
 * `saveKeyNow` so the editor sees an authoritative "Saved" confirmation.
 *
 * Layout: side-by-side editor + live preview by default, with single-pane
 * toggles for laptops. The preview reuses `MarkdownRenderer` so it renders
 * identically to the public `/color`, `/size`, `/typography` pages.
 *
 * No version history (the surrounding `articleVersions` slot is HTML-only).
 * Reverting unsaved local edits is supported via the "Discard changes"
 * button — same shape as the rich-text editor's dirty-state UX.
 */
export function MarkdownEditorPage({ slot, title, backTo, backLabel = "Back to CMS" }: Props) {
  const { isAuthenticated, tokenDocs, setTokenDoc, saveKeyNow, syncingKeys } = useAppData();

  // Hooks must run before any early returns (React rules of hooks).
  const serverValue = tokenDocs[slot];
  const [draft, setDraft] = useState(serverValue);
  const [view, setView] = useState<ViewMode>("split");
  const [saving, setSaving] = useState(false);
  const lastSyncedRef = useRef(serverValue);

  // When the server value changes externally (initial server load, or another
  // editor session writes), sync the draft if the user hasn't started editing.
  useEffect(() => {
    if (lastSyncedRef.current !== serverValue && draft === lastSyncedRef.current) {
      setDraft(serverValue);
    }
    lastSyncedRef.current = serverValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverValue]);

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const dirty = draft !== serverValue;
  const syncing = syncingKeys.has("tokenDocs");

  const onSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    // Push the draft into context state so other readers see it instantly,
    // then force an immediate server flush.
    setTokenDoc(slot, draft);
    const ok = await saveKeyNow("tokenDocs", { ...tokenDocs, [slot]: draft });
    setSaving(false);
    if (ok) toast.success("Saved");
    else toast.error("Save failed — change kept locally; retry when connection returns");
  };

  const onDiscard = () => {
    if (!dirty) return;
    setDraft(serverValue);
  };

  return (
    <div className="flex-1 min-w-0 max-w-[1400px] mx-auto px-8 py-6">
      <Link
        to={backTo}
        className="flex items-center gap-1.5 text-primary mb-4 hover:underline"
        style={{ fontSize: "var(--text-label)" }}
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
            {title}
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "var(--text-label)" }}>
            Markdown source for the public reference page. Saves auto-sync to Supabase KV;
            click <strong>Publish</strong> on the matching token editor to mirror to Storage for AI agents.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ViewToggle view={view} onChange={setView} />
          <Button variant="outline" size="sm" onClick={onDiscard} disabled={!dirty}>
            <RotateCcw className="size-4 mr-1.5" /> Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
            {(saving || syncing) ? (
              <Loader2 className="size-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="size-4 mr-1.5" />
            )}
            {dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </div>

      <div className="h-px bg-border mb-4" />

      {/* Editor pane(s) */}
      <div
        className={
          view === "split"
            ? "grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]"
            : "min-h-[600px]"
        }
      >
        {(view === "edit" || view === "split") && (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            className="w-full h-full min-h-[600px] resize-y p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10 font-mono leading-relaxed focus:outline-none focus:border-primary"
            style={{ fontSize: "var(--text-label)" }}
            placeholder="# Start writing Markdown…"
          />
        )}

        {(view === "preview" || view === "split") && (
          <div className="border border-border rounded-[var(--radius-card)] p-6 bg-background overflow-auto min-h-[600px]">
            {draft.trim() ? (
              <MarkdownRenderer content={draft} />
            ) : (
              <p className="text-muted-foreground text-center py-12" style={{ fontSize: "var(--text-label)" }}>
                Preview appears here as you type.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-4 mt-3 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
        <span>{draft.length.toLocaleString()} chars</span>
        <span>{draft.split("\n").length.toLocaleString()} lines</span>
        {dirty && <span className="text-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const items: Array<{ key: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: "edit", label: "Edit", icon: FileCode },
    { key: "split", label: "Split", icon: Columns2 },
    { key: "preview", label: "Preview", icon: Eye },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 border border-border rounded-[var(--radius-card)] bg-secondary/30">
      {items.map((it) => {
        const active = view === it.key;
        const Icon = it.icon;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={
              active
                ? "flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] bg-background text-foreground"
                : "flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius)] text-muted-foreground hover:text-foreground"
            }
            style={{ fontSize: "var(--text-label)" }}
            title={it.label}
          >
            <Icon className="size-3.5" /> {it.label}
          </button>
        );
      })}
    </div>
  );
}
