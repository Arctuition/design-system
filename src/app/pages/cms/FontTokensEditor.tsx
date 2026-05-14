import React, { useRef, useState } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Upload, Download, Info, CheckCircle2, AlertTriangle, XCircle, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import type { FontTokenSet, FontToken } from "../../store/data-store";
import {
  parseFontTokenFile,
  validateFontFileShape,
  exportFontCSSAsZip,
  analyzeBulkFiles,
  EXPECTED_FILES,
  formatFontValueForCss,
  groupFontTokensStable,
  type MatchSlot,
} from "../../components/shared/font-token-cms-utils";
import { PublishTokensButton } from "../../components/shared/PublishTokensButton";
import { TokenSlotStatusBadge } from "../../components/shared/TokenSlotStatusBadge";
import { looksLikeFigmaFontTokens } from "../../components/shared/font-token-utils";

const FONT_SLOTS: Array<{ key: MatchSlot; label: string; stateKey: keyof FontTokenSet }> = [
  { key: "deviceMobile", label: "Device Mobile", stateKey: "deviceMobile" },
  { key: "deviceTablet", label: "Device Tablet", stateKey: "deviceTablet" },
  { key: "webMobile",    label: "Web Mobile",    stateKey: "webMobile" },
  { key: "webDesktop",   label: "Web Desktop",   stateKey: "webDesktop" },
];

function slotToStateKey(slot: MatchSlot): keyof FontTokenSet {
  return slot as keyof FontTokenSet;
}

export function FontTokensEditor() {
  const { isAuthenticated, fontTokens, setFontTokens } = useAppData();
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const individualRefs = useRef<Record<MatchSlot, HTMLInputElement | null>>({
    deviceMobile: null,
    deviceTablet: null,
    webMobile: null,
    webDesktop: null,
  });

  const [bulkPending, setBulkPending] = useState<
    | {
        matched: Array<{ slot: MatchSlot; file: File; expected: string }>;
        duplicates: Array<{ slot: MatchSlot; files: File[] }>;
        unmatched: File[];
        missing: MatchSlot[];
      }
    | null
  >(null);

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const handleIndividualUpload = (slot: MatchSlot) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const shape = validateFontFileShape(data);
        if (!shape.valid) {
          toast.error(
            `${file.name} doesn't look like a font token file. ` +
            `Expected top-level key: ${shape.expectedKeys.join(", ")}. ` +
            `Found: ${shape.foundKeys.slice(0, 3).join(", ") || "(empty)"}.`
          );
          return;
        }
        const tokens = parseFontTokenFile(data);
        if (tokens.length === 0) {
          toast.error(`No font tokens found in ${file.name}.`);
          return;
        }
        setFontTokens({ ...fontTokens, [slotToStateKey(slot)]: tokens });
        toast.success(`${EXPECTED_FILES[slot]}: imported ${tokens.length} tokens`);
      } catch {
        toast.error(`Failed to parse ${file.name}. Check that it's valid JSON.`);
      }
    };
    reader.readAsText(file);
    const inputEl = individualRefs.current[slot];
    if (inputEl) inputEl.value = "";
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      if (bulkInputRef.current) bulkInputRef.current.value = "";
      return;
    }
    const analysis = analyzeBulkFiles(Array.from(files));
    setBulkPending(analysis);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
  };

  const confirmBulkUpload = async () => {
    if (!bulkPending) return;
    const { matched } = bulkPending;
    if (matched.length === 0) {
      toast.error("No matching files to import.");
      setBulkPending(null);
      return;
    }

    const updates: Partial<FontTokenSet> = {};
    const errors: string[] = [];
    let totalTokens = 0;

    for (const { slot, file } of matched) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const shape = validateFontFileShape(data);
        if (!shape.valid) {
          errors.push(`${file.name}: wrong shape — expected ${shape.expectedKeys.join("/")}, found ${shape.foundKeys.slice(0, 2).join(",") || "(empty)"}`);
          continue;
        }
        const tokens = parseFontTokenFile(data);
        if (tokens.length === 0) {
          errors.push(`${file.name}: no font tokens`);
          continue;
        }
        updates[slotToStateKey(slot)] = tokens;
        totalTokens += tokens.length;
      } catch {
        errors.push(`${file.name}: parse error`);
      }
    }

    if (Object.keys(updates).length > 0) {
      setFontTokens({ ...fontTokens, ...updates });
    }
    setBulkPending(null);

    if (errors.length > 0) {
      toast.error(`Imported with errors: ${errors.join("; ")}`);
    } else {
      toast.success(`Imported ${totalTokens} tokens from ${matched.length} file${matched.length === 1 ? "" : "s"}`);
    }
  };

  const handleExportCSS = async () => {
    try {
      await exportFontCSSAsZip(fontTokens);
      toast.success("Exported font-tokens.zip");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  const slotCount = (key: keyof FontTokenSet): number => fontTokens[key].length;

  return (
    <div className="flex-1 min-w-0 max-w-[1400px] mx-auto px-8 py-10">
      <Link
        to="/cms"
        className="flex items-center gap-1.5 text-primary mb-6 hover:underline"
        style={{ fontSize: "var(--text-label)" }}
      >
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
        Font Tokens Manager
      </h1>
      <div className="h-px bg-border mt-3 mb-6" />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 mb-6 border border-primary/20 rounded-[var(--radius-card)] bg-primary/5">
        <Info className="size-4 text-primary mt-0.5 shrink-0" />
        <p className="text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
          Upload the four Figma <code className="bg-secondary px-1 rounded-[var(--radius)]">font</code> collection
          JSON exports — one per mode (device-mobile, device-tablet, web-mobile, web-desktop).
          Each file's typeface / size / line-height / font-weight / letter-spacing tokens
          become CSS variables. The Figma scope hint
          (<code className="bg-secondary px-1 rounded-[var(--radius)]">FONT_SIZE</code>,{" "}
          <code className="bg-secondary px-1 rounded-[var(--radius)]">FONT_STYLE</code>,
          etc.) decides the unit on export.
        </p>
      </div>

      {/* Bulk upload */}
      <div className="mb-6 p-5 border border-border rounded-[var(--radius-card)] bg-secondary/10">
        <div className="flex items-center gap-2 mb-2">
          <Package className="size-4 text-foreground" />
          <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
            Bulk Upload (all 4 files)
          </span>
        </div>
        <p className="text-muted-foreground mb-4" style={{ fontSize: "var(--text-label)" }}>
          Select every file at once. File names are matched against the expected names shown on each slot below. You'll confirm matches before anything is written.
        </p>
        <input
          ref={bulkInputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={handleBulkUpload}
        />
        <Button variant="outline" onClick={() => bulkInputRef.current?.click()}>
          <Upload className="size-4 mr-1.5" /> Select Files
        </Button>
      </div>

      {/* Individual upload */}
      <div className="mb-6">
        <h3 className="mb-3" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
          Individual Upload — Font Modes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FONT_SLOTS.map((s) => {
            const count = slotCount(s.stateKey);
            const hasData = looksLikeFigmaFontTokens(fontTokens[s.stateKey]);
            return (
              <div key={s.key} className="p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                    {s.label}
                  </span>
                  <TokenSlotStatusBadge slotKey={`font/${s.stateKey}`} hasData={hasData} />
                </div>
                <p className="text-muted-foreground mb-1" style={{ fontSize: "var(--text-label)" }}>
                  {count > 0 ? `${count} tokens` : "no tokens"}
                </p>
                <p className="text-muted-foreground mb-3" style={{ fontSize: "var(--text-label)" }}>
                  Expects <code className="bg-secondary px-1 rounded-[var(--radius)]">{EXPECTED_FILES[s.key]}</code>
                </p>
                <input
                  ref={(el) => { individualRefs.current[s.key] = el; }}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleIndividualUpload(s.key)}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => individualRefs.current[s.key]?.click()}
                >
                  <Upload className="size-4 mr-1.5" /> Upload
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export + Publish */}
      <div className="flex flex-wrap items-center gap-3 p-4 mb-8 border border-border rounded-[var(--radius-card)] bg-secondary/10">
        <span className="text-foreground mr-2" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
          Export:
        </span>
        <Button variant="outline" onClick={handleExportCSS}>
          <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
        </Button>
        <div className="ml-auto">
          <PublishTokensButton />
        </div>
      </div>

      {/* Preview */}
      <PreviewSection fontTokens={fontTokens} />

      {/* Confirmation modal */}
      <BulkConfirmDialog
        pending={bulkPending}
        onConfirm={confirmBulkUpload}
        onCancel={() => setBulkPending(null)}
      />
    </div>
  );
}

// ─── Preview ───

function PreviewSection({ fontTokens }: { fontTokens: FontTokenSet }) {
  const hasAny =
    fontTokens.deviceMobile.length +
      fontTokens.deviceTablet.length +
      fontTokens.webMobile.length +
      fontTokens.webDesktop.length >
    0;

  if (!hasAny) {
    return (
      <div
        className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-[var(--radius-card)]"
        style={{ fontSize: "var(--text-label)" }}
      >
        Upload token files to see a preview.
      </div>
    );
  }

  const modeSets: Array<{ label: string; tokens: FontToken[] }> = [
    { label: "Device Mobile", tokens: fontTokens.deviceMobile },
    { label: "Device Tablet", tokens: fontTokens.deviceTablet },
    { label: "Web Mobile", tokens: fontTokens.webMobile },
    { label: "Web Desktop", tokens: fontTokens.webDesktop },
  ];

  return (
    <div className="space-y-8">
      <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
        Preview
      </h3>
      {modeSets.map((m) =>
        m.tokens.length > 0 ? <ModePreview key={m.label} label={m.label} tokens={m.tokens} /> : null
      )}
    </div>
  );
}

function ModePreview({ label, tokens }: { label: string; tokens: FontToken[] }) {
  const groups = groupFontTokensStable(tokens);
  return (
    <div>
      <h4 className="mb-3" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
        {label} <span className="text-muted-foreground ml-1">({tokens.length})</span>
      </h4>
      <div className="border border-border rounded-[var(--radius-card)] overflow-hidden">
        {groups.map((g) => (
          <div key={g.groupName}>
            <div className="px-4 py-2 bg-secondary/30 border-b border-border/50">
              <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                {g.groupName}
              </span>
              <span className="text-muted-foreground ml-1.5" style={{ fontSize: "var(--text-label)" }}>
                ({g.tokens.length})
              </span>
            </div>
            {g.tokens.map((t) => (
              <TokenRow key={t.name} token={t} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenRow({ token }: { token: FontToken }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 last:border-b-0 hover:bg-secondary/20 transition-colors">
      <span className="text-foreground flex-1 min-w-0 truncate" style={{ fontSize: "var(--text-label)" }}>
        {token.name}
      </span>
      <code
        className="text-card-foreground bg-secondary px-2 py-0.5 rounded-[var(--radius)] shrink-0 text-right min-w-[56px]"
        style={{ fontSize: "var(--text-label)" }}
      >
        {token.aliasOf ? `→ ${token.aliasOf}` : formatFontValueForCss(token)}
      </code>
      {token.scope && (
        <code
          className="text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-[var(--radius)] shrink-0"
          style={{ fontSize: "var(--text-label)" }}
        >
          {token.scope}
        </code>
      )}
    </div>
  );
}

// ─── Bulk confirm dialog ───

const SLOT_LABELS: Record<MatchSlot, string> = {
  deviceMobile: "Device Mobile",
  deviceTablet: "Device Tablet",
  webMobile: "Web Mobile",
  webDesktop: "Web Desktop",
};

function BulkConfirmDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: {
    matched: Array<{ slot: MatchSlot; file: File; expected: string }>;
    duplicates: Array<{ slot: MatchSlot; files: File[] }>;
    unmatched: File[];
    missing: MatchSlot[];
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const open = pending !== null;
  const matched = pending?.matched ?? [];
  const duplicates = pending?.duplicates ?? [];
  const unmatched = pending?.unmatched ?? [];
  const missing = pending?.missing ?? [];

  const hasDiscards = duplicates.length > 0 || unmatched.length > 0;
  const [acknowledgedDiscards, setAcknowledgedDiscards] = React.useState(false);
  React.useEffect(() => { if (open) setAcknowledgedDiscards(false); }, [open]);

  const canConfirm = matched.length > 0 && (!hasDiscards || acknowledgedDiscards);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Bulk Upload</DialogTitle>
          <DialogDescription>
            Review the matches below. Only matched files will be imported — each replaces its corresponding mode's tokens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
          {matched.length > 0 && (
            <section>
              <p className="mb-1.5" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                Matched ({matched.length})
              </p>
              <ul className="space-y-1">
                {matched.map((m) => (
                  <li key={m.slot} className="flex items-center gap-2" style={{ fontSize: "var(--text-label)" }}>
                    <CheckCircle2 className="size-4 shrink-0" style={{ color: "var(--color-label-success, green)" }} />
                    <code className="bg-secondary px-1.5 rounded-[var(--radius)]">{m.file.name}</code>
                    <span className="text-muted-foreground">→</span>
                    <span>{SLOT_LABELS[m.slot]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {missing.length > 0 && (
            <section>
              <p className="mb-1.5" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                Missing ({missing.length}) — will keep existing
              </p>
              <ul className="space-y-1">
                {missing.map((slot) => (
                  <li key={slot} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{SLOT_LABELS[slot]}</span>
                    <span>—</span>
                    <code className="bg-secondary px-1.5 rounded-[var(--radius)]">{EXPECTED_FILES[slot]}</code>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {duplicates.length > 0 && (
            <section>
              <p className="mb-1.5" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                Duplicates (ignored)
              </p>
              <ul className="space-y-1">
                {duplicates.flatMap((d) =>
                  d.files.map((f) => (
                    <li key={`${d.slot}-${f.name}`} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                      <XCircle className="size-4 shrink-0" />
                      <code className="bg-secondary px-1.5 rounded-[var(--radius)]">{f.name}</code>
                      <span>— another file already matched {SLOT_LABELS[d.slot]}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          {unmatched.length > 0 && (
            <section>
              <p className="mb-1.5" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                Unrecognized (ignored)
              </p>
              <ul className="space-y-1">
                {unmatched.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                    <XCircle className="size-4 shrink-0" />
                    <code className="bg-secondary px-1.5 rounded-[var(--radius)]">{f.name}</code>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {hasDiscards && (
          <label className="flex items-start gap-2 mt-2 cursor-pointer text-foreground" style={{ fontSize: "var(--text-label)" }}>
            <input
              type="checkbox"
              checked={acknowledgedDiscards}
              onChange={(e) => setAcknowledgedDiscards(e.target.checked)}
              className="mt-0.5 cursor-pointer"
            />
            <span>
              I understand{" "}
              {duplicates.reduce((n, d) => n + d.files.length, 0) + unmatched.length} file
              {duplicates.reduce((n, d) => n + d.files.length, 0) + unmatched.length === 1 ? "" : "s"}{" "}
              will be discarded.
            </span>
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!canConfirm}>
            Import {matched.length} file{matched.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
