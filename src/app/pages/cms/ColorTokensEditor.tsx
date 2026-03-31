import React, { useRef, useState, useMemo } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Upload, Download, Sun, Moon, Pencil, Info, Copy } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import type { ColorTokenGroup, ColorToken } from "../../store/data-store";
import {
  isDirectColorValue,
  parseHexAlpha,
  resolveTokenReference,
  normalizeTokenValue,
  parseAndClassifyTokens,
  groupSemanticTokensStable,
  groupGlobalTokensStable,
  exportCSSAsZip,
  type GroupedTokens,
} from "../../components/shared/color-token-utils";
import {
  TokenOutlineSidebar,
  buildOutlineSections,
  slugify,
} from "../../components/shared/TokenOutlineSidebar";
import { copyToClipboard } from "../../utils/clipboard";

// ─── Component ───

export function ColorTokensEditor() {
  const { isAuthenticated, colorTokens, setColorTokens } = useAppData();
  const lightInputRef = useRef<HTMLInputElement>(null);
  const darkInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("tokens");
  const [tokenDisplayTab, setTokenDisplayTab] = useState("light");
  const [lastLightFile, setLastLightFile] = useState<string | null>(null);
  const [lastDarkFile, setLastDarkFile] = useState<string | null>(null);

  // Build lookup maps for resolving semantic token references
  const globalLightMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of colorTokens.globalLight) {
      map.set(t.name, t.value);
      map.set(t.name.replace(/\./g, "-"), t.value);
    }
    return map;
  }, [colorTokens.globalLight]);

  const globalDarkMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of colorTokens.globalDark) {
      map.set(t.name, t.value);
      map.set(t.name.replace(/\./g, "-"), t.value);
    }
    return map;
  }, [colorTokens.globalDark]);

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const handleImportLight = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const { global, semantic } = parseAndClassifyTokens(data);
        if (global.length === 0 && semantic.length === 0) {
          toast.error("No color tokens found in the uploaded file.");
          return;
        }
        const updated: ColorTokenGroup = {
          ...colorTokens,
          globalLight: global,
          semanticLight: semantic,
        };
        setColorTokens(updated);
        setLastLightFile(fileName);
        setTokenDisplayTab("light");
        toast.success(
          `Light tokens imported: ${global.length} global, ${semantic.length} semantic tokens from "${fileName}"`
        );
      } catch {
        toast.error("Failed to parse JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
    if (lightInputRef.current) lightInputRef.current.value = "";
  };

  const handleImportDark = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const { global, semantic } = parseAndClassifyTokens(data);
        if (global.length === 0 && semantic.length === 0) {
          toast.error("No color tokens found in the uploaded file.");
          return;
        }
        const updated: ColorTokenGroup = {
          ...colorTokens,
          globalDark: global,
          semanticDark: semantic,
        };
        setColorTokens(updated);
        setLastDarkFile(fileName);
        setTokenDisplayTab("dark");
        toast.success(
          `Dark tokens imported: ${global.length} global, ${semantic.length} semantic tokens from "${fileName}"`
        );
      } catch {
        toast.error("Failed to parse JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
    if (darkInputRef.current) darkInputRef.current.value = "";
  };

  const handleExportCSS = async () => {
    try {
      await exportCSSAsZip(
        colorTokens.semanticLight,
        colorTokens.globalLight,
        colorTokens.semanticDark,
        colorTokens.globalDark
      );
      toast.success("Exported color-tokens.zip (color-light.css + color-dark.css)");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  const totalLight = colorTokens.globalLight.length + colorTokens.semanticLight.length;
  const totalDark = colorTokens.globalDark.length + colorTokens.semanticDark.length;

  // Build outline for current token display tab
  const semanticGroups = tokenDisplayTab === "light"
    ? groupSemanticTokensStable(colorTokens.semanticLight)
    : groupSemanticTokensStable(colorTokens.semanticDark);
  const globalGroups = tokenDisplayTab === "light"
    ? groupGlobalTokensStable(colorTokens.globalLight)
    : groupGlobalTokensStable(colorTokens.globalDark);

  const outlineSections = useMemo(
    () =>
      buildOutlineSections([
        { title: "Semantic Tokens", groups: semanticGroups },
        { title: "Global Tokens", groups: globalGroups },
      ]),
    [semanticGroups, globalGroups]
  );

  const showOutline = activeTab === "tokens" && outlineSections.length > 0;

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tokens">Token Management</TabsTrigger>
            <TabsTrigger value="article">Article</TabsTrigger>
          </TabsList>

          <TabsContent value="article" className="mt-6">
            <div className="border border-border rounded-[var(--radius-card)] p-5 bg-secondary/10">
              <p className="text-card-foreground mb-3" style={{ fontSize: "var(--text-p)" }}>
                Edit the Color Tokens article content in the full-page editor.
              </p>
              <Link to="/cms/color-editor/article">
                <Button type="button">
                  <Pencil className="size-4 mr-1.5" /> Open Article Editor
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="tokens" className="mt-6">
            {/* Info banner */}
            <div
              className="flex items-start gap-3 p-4 mb-6 border border-primary/20 rounded-[var(--radius-card)] bg-primary/5"
            >
              <Info className="size-4 text-primary mt-0.5 shrink-0" />
              <p className="text-card-foreground" style={{ fontSize: "var(--text-label)" }}>
                Upload a Figma/Tokens Studio JSON file. Tokens named
                <code className="bg-secondary px-1 rounded-[var(--radius)]">color.global.***</code> are classified as
                <strong> Global</strong> tokens. Tokens named
                <code className="bg-secondary px-1 rounded-[var(--radius)]">color.***</code> (excluding global) are classified as
                <strong> Semantic</strong> tokens. Other tokens fall back to value-based classification. Each upload completely replaces the corresponding mode's tokens.
              </p>
            </div>

            {/* Import Section */}
            <div className="space-y-4 mb-8">
              <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                Import Tokens
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Light Mode Upload */}
                <div className="p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="size-4 text-foreground" />
                    <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                      Light Mode
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3" style={{ fontSize: "var(--text-label)" }}>
                    Upload a JSON file with light mode color tokens. Supports Figma exports, Tokens Studio, flat arrays, or key-value maps.
                  </p>
                  {lastLightFile && (
                    <p className="text-primary mb-2" style={{ fontSize: "var(--text-label)" }}>
                      Last uploaded: <strong>{lastLightFile}</strong>
                    </p>
                  )}
                  <input
                    ref={lightInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportLight}
                  />
                  <Button variant="outline" className="w-full" onClick={() => lightInputRef.current?.click()}>
                    <Upload className="size-4 mr-1.5" /> Upload Light Tokens
                  </Button>
                </div>

                {/* Dark Mode Upload */}
                <div className="p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="size-4 text-foreground" />
                    <span style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                      Dark Mode
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3" style={{ fontSize: "var(--text-label)" }}>
                    Upload a JSON file with dark mode color tokens. Supports Figma exports, Tokens Studio, flat arrays, or key-value maps.
                  </p>
                  {lastDarkFile && (
                    <p className="text-primary mb-2" style={{ fontSize: "var(--text-label)" }}>
                      Last uploaded: <strong>{lastDarkFile}</strong>
                    </p>
                  )}
                  <input
                    ref={darkInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportDark}
                  />
                  <Button variant="outline" className="w-full" onClick={() => darkInputRef.current?.click()}>
                    <Upload className="size-4 mr-1.5" /> Upload Dark Tokens
                  </Button>
                </div>
              </div>

              {/* Export */}
              <div className="flex flex-wrap items-center gap-3 p-4 border border-border rounded-[var(--radius-card)] bg-secondary/10">
                <span className="text-foreground mr-2" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}>
                  Export:
                </span>
                <Button variant="outline" onClick={handleExportCSS}>
                  <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
                </Button>
              </div>
            </div>

            {/* Token Preview */}
            <h3 className="mb-4" style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
              Token Preview
            </h3>
            <Tabs value={tokenDisplayTab} onValueChange={setTokenDisplayTab}>
              <TabsList>
                <TabsTrigger value="light">
                  <Sun className="size-3.5 mr-1.5" /> Light Mode
                  {totalLight > 0 && (
                    <span className="ml-1.5 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                      ({totalLight})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="dark">
                  <Moon className="size-3.5 mr-1.5" /> Dark Mode
                  {totalDark > 0 && (
                    <span className="ml-1.5 text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
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
                  globalMap={globalLightMap}
                />
                <GroupedTokenSectionCMS
                  sectionLabel="Global Tokens"
                  sectionSlug={slugify("Global Tokens")}
                  groups={groupGlobalTokensStable(colorTokens.globalLight)}
                  type="global"
                  globalMap={globalLightMap}
                />
              </TabsContent>

              <TabsContent value="dark" className="mt-4 space-y-6">
                <GroupedTokenSectionCMS
                  sectionLabel="Semantic Tokens"
                  sectionSlug={slugify("Semantic Tokens")}
                  groups={groupSemanticTokensStable(colorTokens.semanticDark)}
                  type="semantic"
                  globalMap={globalDarkMap}
                />
                <GroupedTokenSectionCMS
                  sectionLabel="Global Tokens"
                  sectionSlug={slugify("Global Tokens")}
                  groups={groupGlobalTokensStable(colorTokens.globalDark)}
                  type="global"
                  globalMap={globalDarkMap}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Outline sidebar (right) */}
      {showOutline && (
        <TokenOutlineSidebar sections={outlineSections} />
      )}
    </div>
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