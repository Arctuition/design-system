import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Loader2, Rocket, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { publishDesignTokens, type PublishDesignTokensResult } from "../../store/api";
import { useAppData } from "../../store/data-store";

const ARTIFACT_LABELS: Record<string, string> = {
  bootstrap: "bootstrap.css",
  breakpoints: "breakpoints.js",
  "tokens-color": "tokens-color.md",
  "tokens-size-space": "tokens-size-space.md",
  "tokens-typography": "tokens-typography.md",
};

/**
 * "Publish to Production" button for the token editors. Opens a confirm
 * dialog listing what's about to be regenerated, calls
 * `POST /design-tokens/publish`, and surfaces the result inline so the
 * editor can copy the public URLs or retry on failure.
 *
 * The publish itself is server-side — the edge function reads the latest
 * KV state, runs the shared `buildBootstrapCss` / `buildBreakpointsJs`
 * templates, and uploads to the design-tokens Storage bucket. Calling this
 * from a stale browser tab still produces fresh output.
 */
export function PublishTokensButton({ size = "default" }: { size?: "default" | "sm" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PublishDesignTokensResult | null>(null);
  const { markTokensPublished } = useAppData();

  const onClick = () => {
    setResult(null);
    setOpen(true);
  };

  const onConfirm = async () => {
    setBusy(true);
    try {
      const r = await publishDesignTokens();
      setResult(r);
      if (r.ok) {
        // Stamp the publish time so every slot's status badge flips from
        // "Uploaded" → "Published". Any new upload after this point will
        // turn the badge back to "Uploaded" automatically.
        markTokensPublished();
        const artifactCount = Object.keys(r.urls).length;
        toast.success(`Published ${artifactCount} artifact${artifactCount === 1 ? "" : "s"}`);
      } else {
        toast.error(`Publish failed: ${r.error}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const onClose = () => {
    if (busy) return;
    setOpen(false);
  };

  return (
    <>
      <Button onClick={onClick} size={size} className="gap-1.5">
        <Rocket className="size-4" /> Publish to Production
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish design tokens</DialogTitle>
            <DialogDescription>
              Regenerates the public token artifacts from the current CMS state
              and uploads them to the <code className="bg-secondary px-1 rounded-[var(--radius)]">design-tokens</code> Storage bucket.
              Existing prototypes that reference the canonical URLs will pick up
              the new values within ~1 minute.
            </DialogDescription>
          </DialogHeader>

          {!result && (
            <div className="space-y-2 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
              <p>Files that will be regenerated and uploaded:</p>
              <ul className="space-y-1 ml-1">
                <li>• <code className="bg-secondary px-1 rounded-[var(--radius)]">bootstrap.css</code> — color + size + font + breakpoints, mobile-first cascade</li>
                <li>• <code className="bg-secondary px-1 rounded-[var(--radius)]">breakpoints.js</code> — raw pixel values for JS / Tailwind / matchMedia</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Server-side regeneration — the browser doesn't need a fresh build.
              </p>
            </div>
          )}

          {result?.ok && (
            <div className="space-y-2" style={{ fontSize: "var(--text-label)" }}>
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--color-label-success, green)" }} />
                <span>
                  Published {new Date(result.publishedAt).toLocaleTimeString()}.
                </span>
              </div>
              {Object.entries(result.urls).map(([key, url]) => (
                <UrlRow
                  key={key}
                  label={ARTIFACT_LABELS[key] ?? key}
                  url={url}
                  bytes={result.bytes[key] ?? 0}
                />
              ))}
            </div>
          )}

          {result && !result.ok && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius)] bg-destructive/10 border border-destructive/30 text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
              <AlertTriangle className="size-4 mt-0.5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">Publish failed</p>
                <p className="text-muted-foreground mt-0.5">{result.error}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            {result?.ok ? (
              <Button onClick={onClose}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={onConfirm} disabled={busy}>
                  {busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  {result && !result.ok ? "Retry" : "Publish now"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UrlRow({ label, url, bytes }: { label: string; url: string; bytes: number }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Copied ${label} URL`);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] bg-secondary/40">
      <code className="text-foreground shrink-0" style={{ fontSize: "var(--text-label)" }}>{label}</code>
      <span className="text-muted-foreground shrink-0" style={{ fontSize: "var(--text-label)" }}>
        ({bytes.toLocaleString()} B)
      </span>
      <button
        type="button"
        onClick={copy}
        className="ml-auto text-primary hover:underline truncate max-w-[260px] text-left"
        style={{ fontSize: "var(--text-label)" }}
        title={url}
      >
        {url}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground shrink-0"
        title="Open in new tab"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  );
}
