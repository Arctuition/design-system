import React, { useRef, useState, useMemo } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import {
  ArrowLeft,
  Upload,
  Download,
  Sun,
  Moon,
  Info,
  Copy,
  Package,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import type { ColorTokenGroup, ColorToken } from "../../store/data-store";
import {
  isDirectColorValue,
  parseHexAlpha,
  resolveTokenReference,
  normalizeTokenValue,
  parseGlobalTokenFile,
  parseSemanticTokenFile,
  groupSemanticTokensStable,
  groupGlobalTokensStable,
  exportCSSAsZip,
  analyzeColorBulkFiles,
  COLOR_EXPECTED_FILES,
  COLOR_SLOT_LABELS,
  type GroupedTokens,
  type ColorMatchSlot,
} from "../../components/shared/color-token-utils";
import {
  TokenOutlineSidebar,
  buildOutlineSections,
  slugify,
} from "../../components/shared/TokenOutlineSidebar";
import { copyToClipboard } from "../../utils/clipboard";
import { PublishTokensButton } from "../../components/shared/PublishTokensButton";
import { TokenSlotStatusBadge } from "../../components/shared/TokenSlotStatusBadge";
import { looksLikeFigmaColorTokens } from "../../components/shared/color-json-token-utils";

const COLOR_SLOT_TO_STATE_KEY: Record<"global" | "semanticLight" | "semanticDark", string> = {
  global: "color/global",
  semanticLight: "color/light",
  semanticDark: "color/dark",
};

// ─── Slot config ───

const SLOTS: Array<{
  key: ColorMatchSlot;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    key: "global",
    label: "Global",
    icon: Globe,
    description:
      "Raw color primitives — the full palette (gray, blue, gold, etc.). Mode-independent.",
  },
  {
    key: "semanticLight",
    label: "Semantic — Light",
    icon: Sun,
    description:
      "Semantic tokens (label, surface, fill, border, divider) for light mode.",
  },
  {
    key: "semanticDark",
    label: "Semantic — Dark",
    icon: Moon,
    description:
      "Semantic tokens (label, surface, fill, border, divider) for dark mode.",
  },
];

function parseFileForSlot(slot: ColorMatchSlot, data: any): ColorToken[] {
  return slot === "global" ? parseGlobalTokenFile(data) : parseSemanticTokenFile(data);
}

function applySlotUpdate(
  prev: ColorTokenGroup,
  slot: ColorMatchSlot,
  tokens: ColorToken[]
): ColorTokenGroup {
  switch (slot) {
    case "global":
      return { ...prev, global: tokens };
    case "semanticLight":
      return { ...prev, semanticLight: tokens };
    case "semanticDark":
      return { ...prev, semanticDark: tokens };
  }
}

function slotCount(tokens: ColorTokenGroup, slot: ColorMatchSlot): number {
  switch (slot) {
    case "global":
      return tokens.global.length;
    case "semanticLight":
      return tokens.semanticLight.length;
    case "semanticDark":
      return tokens.semanticDark.length;
  }
}

// ─── Component ───

export function ColorTokensEditor() {
  const { isAuthenticated, colorTokens, setColorTokens } = useAppData();
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const individualRefs = useRef<Record<ColorMatchSlot, HTMLInputElement | null>>({
    global: null,
    semanticLight: null,
    semanticDark: null,
  });
  const [tokenDisplayTab, setTokenDisplayTab] = useState("light");
  const [bulkPending, setBulkPending] = useState<
    | {
        matched: Array<{ slot: ColorMatchSlot; file: File; expected: string }>;
        duplicates: Array<{ slot: ColorMatchSlot; files: File[] }>;
        unmatched: File[];
        missing: ColorMatchSlot[];
      }
    | null
  >(null);

  // Globals are mode-independent so a single map serves both display tabs.
  const globalMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of colorTokens.global) {
      map.set(t.name, t.value);
      map.set(t.name.replace(/\./g, "-"), t.value);
    }
    return map;
  }, [colorTokens.global]);

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const handleIndividualUpload =
    (slot: ColorMatchSlot) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fileName = file.name;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const tokens = parseFileForSlot(slot, data);
          if (tokens.length === 0) {
            toast.error(`No tokens found in ${fileName} for slot "${COLOR_SLOT_LABELS[slot]}".`);
            return;
          }
          setColorTokens(applySlotUpdate(colorTokens, slot, tokens));
          if (slot === "semanticDark") setTokenDisplayTab("dark");
          else if (slot === "semanticLight") setTokenDisplayTab("light");
          toast.success(
            `${COLOR_SLOT_LABELS[slot]}: imported ${tokens.length} tokens from "${fileName}"`
          );
        } catch {
          toast.error(`Failed to parse ${fileName}. Check that it's valid JSON.`);
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
    const analysis = analyzeColorBulkFiles(Array.from(files));
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

    let next: ColorTokenGroup = colorTokens;
    const errors: string[] = [];
    let totalTokens = 0;

    for (const { slot, file } of matched) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const tokens = parseFileForSlot(slot, data);
        if (tokens.length === 0) {
          errors.push(`${file.name}: no tokens parsed`);
          continue;
        }
        next = applySlotUpdate(next, slot, tokens);
        totalTokens += tokens.length;
      } catch {
        errors.push(`${file.name}: parse error`);
      }
    }

    setColorTokens(next);
    setBulkPending(null);

    if (errors.length > 0) {
      toast.error(`Imported with errors: ${errors.join("; ")}`);
    } else {
      toast.success(
        `Imported ${totalTokens} tokens from ${matched.length} file${matched.length === 1 ? "" : "s"}`
      );
    }
  };

  const handleExportCSS = async () => {
    try {
      await exportCSSAsZip(
        colorTokens.semanticLight,
        colorTokens.semanticDark,
        colorTokens.global
      );
      toast.success("Exported color-tokens.zip (color-light.css + color-dark.css + color-global.css)");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  const totalLight = colorTokens.semanticLight.length;
  const totalDark = colorTokens.semanticDark.length;
  const totalGlobal = colorTokens.global.length;

  // Build outline for current token display tab
  const semanticGroups =
    tokenDisplayTab === "light"
      ? groupSemanticTokensStable(colorTokens.semanticLight)
      : groupSemanticTokensStable(colorTokens.semanticDark);
  const globalGroups = groupGlobalTokensStable(colorTokens.global);

  const outlineSections = useMemo(
    () =>
      buildOutlineSections([
        { title: "Semantic Tokens", groups: semanticGroups },
        { title: "Global Tokens", groups: globalGroups },
      ]),
    [semanticGroups, globalGroups]
  );

  const showOutline = outlineSections.length > 0;

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-[1400px] mx-auto px-8 py-10">
        <Link
          to="/cms"
          className="flex items-center gap-1.5 text-primary mb-6 hover:underline"
          style={{ fontSize: "var(--text-label)" }}
        >
          <ArrowLeft className="size-4" /> Back to CMS
        </Link>
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Color Tokens Manager
        </h1>
        <div className="h-px bg-border mt-3 mb-6" />

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 mb-6 border border-primary/20 rounded-[var(--radius-card)] bg-primary/5">
              <Info className="size-4 text-primary mt-0.5 shrink-0" />
              <p className="text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
                Upload three Figma color-token JSON exports —
                <code className="bg-secondary px-1 rounded-[var(--radius)]">color-global-value.tokens.json</code> for the
                raw palette, plus
                <code className="bg-secondary px-1 rounded-[var(--radius)]">light.tokens.json</code> and
                <code className="bg-secondary px-1 rounded-[var(--radius)]">dark.tokens.json</code> for semantic tokens.
                Each upload completely replaces the corresponding slot's tokens; semantic aliases (e.g.
                <code className="bg-secondary px-1 rounded-[var(--radius)]">color/global/gold/60</code>) are preserved
                and emitted as <code className="bg-secondary px-1 rounded-[var(--radius)]">var(--color-global-gold-60)</code> in the CSS export.
              </p>
            </div>

            {/* Bulk upload */}
            <div className="mb-6 p-5 border border-border rounded-[var(--radius-card)] bg-secondary/10">
              <div className="flex items-center gap-2 mb-2">
                <Package className="size-4 text-foreground" />
                <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                  Bulk Upload (all 3 files)
                </span>
              </div>
              <p className="text-muted-foreground mb-4" style={{ fontSize: "var(--text-label)" }}>
                Select all three files at once. File names are matched against{" "}
                <code className="bg-secondary px-1 rounded-[var(--radius)]">color-global-value.tokens.json</code>,{" "}
                <code className="bg-secondary px-1 rounded-[var(--radius)]">light.tokens.json</code>, and{" "}
                <code className="bg-secondary px-1 rounded-[var(--radius)]">dark.tokens.json</code>. You'll confirm matches before anything is written.
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SLOTS.map((s) => {
                  const count = slotCount(colorTokens, s.key);
                  const Icon = s.icon;
                  const slotData =
                    s.key === "global" ? colorTokens.global :
                    s.key === "semanticLight" ? colorTokens.semanticLight :
                    colorTokens.semanticDark;
                  const hasData = looksLikeFigmaColorTokens(slotData);
                  return (
                    <div
                      key={s.key}
                      className="p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon className="size-4 text-foreground shrink-0" />
                          <span
                            className="truncate"
                            style={{
                              fontSize: "var(--text-p)",
                              fontWeight: "var(--font-weight-medium)",
                            }}
                          >
                            {s.label}
                          </span>
                        </div>
                        <TokenSlotStatusBadge slotKey={COLOR_SLOT_TO_STATE_KEY[s.key]} hasData={hasData} />
                      </div>
                      <p className="text-muted-foreground mb-2" style={{ fontSize: "var(--text-label)" }}>
                        {count > 0 ? `${count} tokens` : "no tokens"}
                      </p>
                      <p
                        className="text-muted-foreground mb-2"
                        style={{ fontSize: "var(--text-label)" }}
                      >
                        {s.description}
                      </p>
                      <p
                        className="text-muted-foreground mb-3"
                        style={{ fontSize: "var(--text-label)" }}
                      >
                        Expects{" "}
                        <code className="bg-secondary px-1 rounded-[var(--radius)]">
                          {COLOR_EXPECTED_FILES[s.key]}
                        </code>
                      </p>
                      <input
                        ref={(el) => {
                          individualRefs.current[s.key] = el;
                        }}
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
              <span
                className="text-foreground mr-2"
                style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}
              >
                Export:
              </span>
              <Button variant="outline" onClick={handleExportCSS}>
                <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
              </Button>
              <div className="ml-auto">
                <PublishTokensButton />
              </div>
            </div>

            {/* Token Preview */}
            <h3
              className="mb-4"
              style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}
            >
              Token Preview
            </h3>
            <Tabs value={tokenDisplayTab} onValueChange={setTokenDisplayTab}>
              <TabsList>
                <TabsTrigger value="light">
                  <Sun className="size-3.5 mr-1.5" /> Light Mode
                  {totalLight > 0 && (
                    <span
                      className="ml-1.5 text-muted-foreground"
                      style={{ fontSize: "var(--text-label)" }}
                    >
                      ({totalLight})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="dark">
                  <Moon className="size-3.5 mr-1.5" /> Dark Mode
                  {totalDark > 0 && (
                    <span
                      className="ml-1.5 text-muted-foreground"
                      style={{ fontSize: "var(--text-label)" }}
                    >
                      ({totalDark})
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="light" className="mt-4 space-y-6">
                <GroupedTokenSectionCMS
                  sectionLabel="Semantic Tokens"
                  sectionSlug={slugify("Semantic Tokens")}
                  groups={groupSemanticTokensStable(colorTokens.semanticLight)}
                  type="semantic"
                  globalMap={globalMap}
                />
                <GroupedTokenSectionCMS
                  sectionLabel={`Global Tokens (${totalGlobal})`}
                  sectionSlug={slugify("Global Tokens")}
                  groups={groupGlobalTokensStable(colorTokens.global)}
                  type="global"
                  globalMap={globalMap}
                />
              </TabsContent>

              <TabsContent value="dark" className="mt-4 space-y-6">
                <GroupedTokenSectionCMS
                  sectionLabel="Semantic Tokens"
                  sectionSlug={slugify("Semantic Tokens")}
                  groups={groupSemanticTokensStable(colorTokens.semanticDark)}
                  type="semantic"
                  globalMap={globalMap}
                />
                <GroupedTokenSectionCMS
                  sectionLabel={`Global Tokens (${totalGlobal})`}
                  sectionSlug={slugify("Global Tokens")}
                  groups={groupGlobalTokensStable(colorTokens.global)}
                  type="global"
                  globalMap={globalMap}
                />
              </TabsContent>
            </Tabs>
      </div>

      {/* Outline sidebar (right) */}
      {showOutline && <TokenOutlineSidebar sections={outlineSections} />}

      {/* Bulk confirmation modal */}
      <BulkConfirmDialog
        pending={bulkPending}
        onConfirm={confirmBulkUpload}
        onCancel={() => setBulkPending(null)}
      />
    </div>
  );
}

// ─── Bulk confirm dialog ───

function BulkConfirmDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: {
    matched: Array<{ slot: ColorMatchSlot; file: File; expected: string }>;
    duplicates: Array<{ slot: ColorMatchSlot; files: File[] }>;
    unmatched: File[];
    missing: ColorMatchSlot[];
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
            Review the matches below. Only matched files will be imported — each replaces its corresponding slot's tokens.
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
                    <span>{COLOR_SLOT_LABELS[m.slot]}</span>
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
                    <span>{COLOR_SLOT_LABELS[slot]}</span>
                    <span>—</span>
                    <code className="bg-secondary px-1.5 rounded-[var(--radius)]">{COLOR_EXPECTED_FILES[slot]}</code>
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
                      <span>— another file already matched {COLOR_SLOT_LABELS[d.slot]}</span>
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

// ─── Token display components ───

function GroupedTokenSectionCMS({
  sectionLabel,
  sectionSlug,
  groups,
  type,
  globalMap,
}: {
  sectionLabel: string;
  sectionSlug: string;
  groups: GroupedTokens[];
  type: "global" | "semantic";
  globalMap: Map<string, string>;
}) {
  const totalCount = groups.reduce((sum, g) => sum + g.tokens.length, 0);

  if (totalCount === 0) {
    return (
      <div id={`section-${sectionSlug}`}>
        <h4 className="mb-3" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
          {sectionLabel}
        </h4>
        <div
          className="text-center py-8 text-muted-foreground border border-border rounded-[var(--radius-card)]"
          style={{ fontSize: "var(--text-label)" }}
        >
          No {type} tokens defined. Upload a JSON file to populate.
        </div>
      </div>
    );
  }

  return (
    <div id={`section-${sectionSlug}`}>
      <h4 className="mb-3" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
        {sectionLabel}
        <span className="text-muted-foreground ml-2" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-normal)" }}>
          ({totalCount})
        </span>
      </h4>
      <div className="border border-border rounded-[var(--radius-card)] overflow-hidden">
        {groups.map((group) => {
          const groupId = `group-${sectionSlug}-${slugify(group.groupName)}`;
          return (
            <div key={group.groupName} id={groupId}>
              {/* Group header */}
              <div className="px-4 py-2 bg-secondary/30 border-b border-border/50">
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                  {group.groupName}
                </span>
                <span className="text-muted-foreground ml-1.5" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-normal)" }}>
                  ({group.tokens.length})
                </span>
              </div>
              {/* Group tokens */}
              {group.tokens.map((token, idx) => (
                <TokenRow key={`${token.name}-${idx}`} token={token} type={type} globalMap={globalMap} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TokenRow({
  token,
  type,
  globalMap,
}: {
  token: ColorToken;
  type: "global" | "semantic";
  globalMap: Map<string, string>;
}) {
  const normalizedValue = normalizeTokenValue(token.value);

  const copyName = () => {
    copyToClipboard(token.name);
    toast.success(`Copied name: ${token.name}`);
  };

  const copyValue = () => {
    copyToClipboard(normalizedValue);
    toast.success(`Copied value: ${normalizedValue}`);
  };

  let swatchColor: string | null = null;
  const isDirect = isDirectColorValue(normalizedValue);

  if (isDirect) {
    swatchColor = normalizedValue;
  } else {
    const resolved = resolveTokenReference(normalizedValue, globalMap);
    if (resolved && isDirectColorValue(resolved)) {
      swatchColor = normalizeTokenValue(resolved);
    }
  }

  const alphaInfo = swatchColor ? parseHexAlpha(swatchColor) : null;

  let displayHex = normalizedValue;
  let displayOpacity: string | null = null;

  if (isDirect) {
    if (alphaInfo) {
      displayHex = alphaInfo.hex6;
      displayOpacity = `${alphaInfo.alphaPercent}%`;
    } else {
      displayHex = normalizedValue.toUpperCase();
    }
  }

  let resolvedDisplay: string | null = null;
  if (!isDirect && swatchColor) {
    const resolvedAlpha = parseHexAlpha(swatchColor);
    if (resolvedAlpha) {
      resolvedDisplay = `${resolvedAlpha.hex6} ${resolvedAlpha.alphaPercent}%`;
    } else {
      resolvedDisplay = swatchColor.toUpperCase();
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-secondary/20 transition-colors group">
      {swatchColor ? (
        <div
          className="size-8 rounded-[var(--radius)] border border-border shrink-0"
          style={{ backgroundColor: swatchColor }}
        />
      ) : (
        <div className="size-8 rounded-[var(--radius)] border border-border shrink-0 flex items-center justify-center bg-secondary/30">
          <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>REF</span>
        </div>
      )}

      <span
        className="text-foreground flex-1 min-w-0 truncate flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
        style={{ fontSize: "var(--text-label)" }}
        onClick={copyName}
        title="Click to copy name"
      >
        {token.name}
        <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </span>

      {token.description && (
        <span
          className="text-muted-foreground hidden sm:block truncate max-w-[160px]"
          style={{ fontSize: "var(--text-label)" }}
        >
          {token.description}
        </span>
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        {isDirect ? (
          <>
            <code
              className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ fontSize: "var(--text-label)" }}
              onClick={copyValue}
              title="Click to copy value"
            >
              {displayHex}
              <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </code>
            {displayOpacity && (
              <code
                className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-[var(--radius)]"
                style={{ fontSize: "var(--text-label)" }}
              >
                {displayOpacity}
              </code>
            )}
          </>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <code
              className="text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ fontSize: "var(--text-label)" }}
              onClick={copyValue}
              title="Click to copy value"
            >
              {normalizedValue}
              <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </code>
            {resolvedDisplay && (
              <code
                className="text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-[var(--radius)]"
                style={{ fontSize: "var(--text-label)" }}
              >
                {resolvedDisplay}
              </code>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
