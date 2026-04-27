import React, { useRef, useState, useMemo } from "react";
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
import type { SizeTokenSet, SizeTokenMode, SizeToken } from "../../store/data-store";
import {
  parseSizeTokenFile,
  exportSizeCSSAsZip,
  analyzeBulkFiles,
  EXPECTED_FILES,
  type MatchSlot,
  groupSizeTokensStable,
} from "../../components/shared/size-token-utils";

// Ordered list of upload slots for the individual upload UI
const SLOTS: Array<{ key: MatchSlot; label: string; stateKey: keyof SizeTokenSet }> = [
  { key: "global", label: "Global Scale", stateKey: "global" },
  { key: "deviceMobile", label: "Device Mobile", stateKey: "deviceMobile" },
  { key: "deviceTablet", label: "Device Tablet", stateKey: "deviceTablet" },
  { key: "webMobile", label: "Web Mobile", stateKey: "webMobile" },
  { key: "webDesktop", label: "Web Desktop", stateKey: "webDesktop" },
];

function slotToStateKey(slot: MatchSlot): keyof SizeTokenSet {
  return slot as keyof SizeTokenSet;
}

export function SizeTokensEditor() {
  const { isAuthenticated, sizeTokens, setSizeTokens } = useAppData();
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const individualRefs = useRef<Record<MatchSlot, HTMLInputElement | null>>({
    global: null,
    deviceMobile: null,
    deviceTablet: null,
    webMobile: null,
    webDesktop: null,
  });

  const [bulkPending, setBulkPending] = useState<
    | { matched: Array<{ slot: MatchSlot; file: File; expected: string }>;
        duplicates: Array<{ slot: MatchSlot; files: File[] }>;
        unmatched: File[];
        missing: MatchSlot[]; }
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
        const tokens = parseSizeTokenFile(data);
        if (tokens.length === 0) {
          toast.error(`No numeric size tokens found in ${file.name}.`);
          return;
        }
        setSizeTokens({ ...sizeTokens, [slotToStateKey(slot)]: tokens });
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

    const updates: Partial<SizeTokenSet> = {};
    const errors: string[] = [];
    let totalTokens = 0;

    for (const { slot, file } of matched) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const tokens = parseSizeTokenFile(data);
        if (tokens.length === 0) {
          errors.push(`${file.name}: no numeric tokens`);
          continue;
        }
        updates[slotToStateKey(slot)] = tokens;
        totalTokens += tokens.length;
      } catch (err) {
        errors.push(`${file.name}: parse error`);
      }
    }

    setSizeTokens({ ...sizeTokens, ...updates });
    setBulkPending(null);

    if (errors.length > 0) {
      toast.error(`Imported with errors: ${errors.join("; ")}`);
    } else {
      toast.success(`Imported ${totalTokens} tokens from ${matched.length} file${matched.length === 1 ? "" : "s"}`);
    }
  };

  const handleExportCSS = async () => {
    try {
      await exportSizeCSSAsZip(sizeTokens);
      toast.success("Exported size-tokens.zip");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  const slotCount = (key: keyof SizeTokenSet): number => sizeTokens[key].length;

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
        Size &amp; Space Tokens Manager
      </h1>
      <div className="h-px bg-border mt-3 mb-6" />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 mb-6 border border-primary/20 rounded-[var(--radius-card)] bg-primary/5">
        <Info className="size-4 text-primary mt-0.5 shrink-0" />
        <p className="text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
          Upload the five Figma size-token JSON exports. Tokens under the <code className="bg-secondary px-1 rounded-[var(--radius)]">size-global</code> collection
          become the global scale; each <code className="bg-secondary px-1 rounded-[var(--radius)]">size</code> collection export becomes one mode (Device Mobile, Device Tablet, Web Mobile, Web Desktop).
          Aliases are preserved: a semantic token that references a global value is exported as <code className="bg-secondary px-1 rounded-[var(--radius)]">var(--size-global-*)</code>.
        </p>
      </div>

      {/* Bulk upload */}
      <div className="mb-6 p-5 border border-border rounded-[var(--radius-card)] bg-secondary/10">
        <div className="flex items-center gap-2 mb-2">
          <Package className="size-4 text-foreground" />
          <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
            Bulk Upload (all 5 files)
          </span>
        </div>
        <p className="text-muted-foreground mb-4" style={{ fontSize: "var(--text-label)" }}>
          Select all five files at once. File names are matched against <code className="bg-secondary px-1 rounded-[var(--radius)]">global.tokens.json</code>, <code className="bg-secondary px-1 rounded-[var(--radius)]">device-mobile.tokens.json</code>, <code className="bg-secondary px-1 rounded-[var(--radius)]">device-tablet.tokens.json</code>, <code className="bg-secondary px-1 rounded-[var(--radius)]">web-mobile.tokens.json</code>, and <code className="bg-secondary px-1 rounded-[var(--radius)]">web-desktop.tokens.json</code>. You'll confirm matches before anything is written.
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
      <div className="mb-8">
        <h3 className="mb-3" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
          Individual Upload
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SLOTS.map((s) => {
            const count = slotCount(s.stateKey);
            return (
              <div key={s.key} className="p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                    {s.label}
                  </span>
                  <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                    {count > 0 ? `${count} tokens` : "empty"}
                  </span>
                </div>
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

      {/* Export */}
      <div className="flex flex-wrap items-center gap-3 p-4 mb-8 border border-border rounded-[var(--radius-card)] bg-secondary/10">
        <span className="text-foreground mr-2" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
          Export:
        </span>
        <Button variant="outline" onClick={handleExportCSS}>
          <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
        </Button>
      </div>

      {/* Preview */}
      <PreviewSection sizeTokens={sizeTokens} />

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

function PreviewSection({ sizeTokens }: { sizeTokens: SizeTokenSet }) {
  // Build alias resolution map for display (alias target name → value)
  const globalMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of sizeTokens.global) m.set(t.name, t.value);
    return m;
  }, [sizeTokens.global]);

  const hasAny =
    sizeTokens.global.length +
      sizeTokens.deviceMobile.length +
      sizeTokens.deviceTablet.length +
      sizeTokens.webMobile.length +
      sizeTokens.webDesktop.length >
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

  const modeSets: Array<{ label: string; tokens: SizeToken[] }> = [
    { label: "Global", tokens: sizeTokens.global },
    { label: "Device Mobile", tokens: sizeTokens.deviceMobile },
    { label: "Device Tablet", tokens: sizeTokens.deviceTablet },
    { label: "Web Mobile", tokens: sizeTokens.webMobile },
    { label: "Web Desktop", tokens: sizeTokens.webDesktop },
  ];

  return (
    <div className="space-y-8">
      <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
        Preview
      </h3>
      {modeSets.map((m) =>
        m.tokens.length > 0 ? (
          <ModePreview key={m.label} label={m.label} tokens={m.tokens} globalMap={globalMap} />
        ) : null
      )}
    </div>
  );
}

function ModePreview({
  label,
  tokens,
  globalMap,
}: {
  label: string;
  tokens: SizeToken[];
  globalMap: Map<string, number>;
}) {
  const groups = groupSizeTokensStable(tokens);
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
              <TokenRow key={t.name} token={t} globalMap={globalMap} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenRow({ token, globalMap }: { token: SizeToken; globalMap: Map<string, number> }) {
  const aliasValue = token.aliasOf ? globalMap.get(token.aliasOf) : undefined;
  const displayValue = token.value;
  // Scale bar to 200px max. Cap "full" radius values for readability.
  const cappedValue = Math.min(token.value, 200);
  const barPct = Math.min(100, (cappedValue / 48) * 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 last:border-b-0 hover:bg-secondary/20 transition-colors">
      <span className="text-foreground flex-1 min-w-0 truncate" style={{ fontSize: "var(--text-label)" }}>
        {token.name}
      </span>
      <div className="w-[160px] h-2 bg-secondary rounded-full overflow-hidden shrink-0">
        <div className="h-full bg-primary" style={{ width: `${barPct}%` }} />
      </div>
      <code
        className="text-card-foreground bg-secondary px-2 py-0.5 rounded-[var(--radius)] shrink-0 text-right min-w-[56px]"
        style={{ fontSize: "var(--text-label)" }}
      >
        {displayValue}px
      </code>
      {token.aliasOf && (
        <code
          className="text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-[var(--radius)] shrink-0"
          style={{ fontSize: "var(--text-label)" }}
          title={aliasValue !== undefined ? `${token.aliasOf} = ${aliasValue}px` : token.aliasOf}
        >
          → {token.aliasOf}
        </code>
      )}
    </div>
  );
}

// ─── Bulk confirm dialog ───

const SLOT_LABELS: Record<MatchSlot, string> = {
  global: "Global Scale",
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

  const canConfirm = matched.length > 0;

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
