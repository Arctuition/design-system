import React, { useMemo, useState } from "react";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import type { ColorToken } from "../store/data-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  isDirectColorValue,
  parseHexAlpha,
  resolveTokenReference,
  normalizeTokenValue,
  groupSemanticTokensStable,
  groupGlobalTokensStable,
  exportCSSAsZip,
  type GroupedTokens,
} from "../components/shared/color-token-utils";
import {
  TokenOutlineSidebar,
  buildOutlineSections,
  slugify,
} from "../components/shared/TokenOutlineSidebar";

import { copyToClipboard } from "../utils/clipboard";

// ─── Cookie helpers ───

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
}

type TokenNameFormat = "default" | "cssvar";

function formatTokenName(name: string, format: TokenNameFormat): string {
  if (format === "cssvar") {
    return name.replace(/\./g, "-");
  }
  return name;
}

// ─── Token swatch row ───

function TokenSwatch({
  token,
  globalMap,
  nameFormat,
}: {
  token: ColorToken;
  globalMap: Map<string, string>;
  nameFormat: TokenNameFormat;
}) {
  const normalizedValue = normalizeTokenValue(token.value);

  const copyValue = () => {
    copyToClipboard(normalizedValue);
    toast.success(`Copied ${token.name}`);
  };

  const copyName = () => {
    copyToClipboard(formatTokenName(token.name, nameFormat));
    toast.success(`Copied name: ${formatTokenName(token.name, nameFormat)}`);
  };

  const isDirect = isDirectColorValue(normalizedValue);
  let swatchColor: string | null = null;

  if (isDirect) {
    swatchColor = normalizedValue;
  } else {
    const resolved = resolveTokenReference(normalizedValue, globalMap);
    if (resolved && isDirectColorValue(resolved)) {
      swatchColor = normalizeTokenValue(resolved);
    }
  }

  const alphaInfo = isDirect && swatchColor ? parseHexAlpha(swatchColor) : null;
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

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors group">
      {swatchColor ? (
        <div
          className="size-10 rounded-[var(--radius-card)] border border-border shrink-0"
          style={{ backgroundColor: swatchColor }}
        />
      ) : (
        <div className="size-10 rounded-[var(--radius-card)] border border-border shrink-0 flex items-center justify-center bg-secondary/30">
          <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>REF</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p
          className="text-foreground truncate flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
          style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}
          onClick={copyName}
          title="Click to copy name"
        >
          {formatTokenName(token.name, nameFormat)}
          <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </p>
        {token.description && (
          <p className="text-muted-foreground truncate" style={{ fontSize: "var(--text-label)" }}>
            {token.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {isDirect ? (
          <>
            <code
              className="text-card-foreground bg-secondary px-2 py-1 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ fontSize: "var(--text-label)" }}
              onClick={copyValue}
              title="Click to copy"
            >
              {displayHex}
              <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </code>
            {displayOpacity && (
              <code
                className="text-muted-foreground bg-secondary px-2 py-1 rounded-[var(--radius)]"
                style={{ fontSize: "var(--text-label)" }}
              >
                {displayOpacity}
              </code>
            )}
          </>
        ) : (
          <code
            className="text-card-foreground bg-secondary px-2 py-1 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
            style={{ fontSize: "var(--text-label)" }}
            onClick={copyValue}
            title="Click to copy"
          >
            {normalizedValue}
            <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </code>
        )}
      </div>
    </div>
  );
}

// ─── Grouped token section with IDs for outline ───

function GroupedTokenSection({
  title,
  sectionSlug,
  groups,
  globalMap,
  nameFormat,
}: {
  title: string;
  sectionSlug: string;
  groups: GroupedTokens[];
  globalMap: Map<string, string>;
  nameFormat: TokenNameFormat;
}) {
  const totalCount = groups.reduce((sum, g) => sum + g.tokens.length, 0);
  if (totalCount === 0) return null;

  return (
    <div className="mb-8" id={`section-${sectionSlug}`}>
      <h3 className="mb-4" style={{ fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-normal)" }}>
        {title}
        <span className="text-muted-foreground ml-2" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-normal)" }}>
          ({totalCount})
        </span>
      </h3>
      <div className="border border-border rounded-[var(--radius-card)] overflow-hidden">
        {groups.map((group) => {
          const groupId = `group-${sectionSlug}-${slugify(group.groupName)}`;
          return (
            <div key={group.groupName} id={groupId}>
              <div className="px-4 py-2 bg-secondary/30 border-b border-border/50">
                <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-medium)" }}>
                  {group.groupName}
                </span>
                <span className="text-muted-foreground ml-1.5" style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-normal)" }}>
                  ({group.tokens.length})
                </span>
              </div>
              {group.tokens.map((token) => (
                <TokenSwatch key={token.name} token={token} globalMap={globalMap} nameFormat={nameFormat} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ───

export function ColorTokensPage() {
  const { colorArticle, colorTokens } = useAppData();
  const [activeMode, setActiveMode] = useState("light");

  const [nameFormat, setNameFormat] = useState<TokenNameFormat>(() => {
    const saved = getCookie("tokenNameFormat");
    return saved === "cssvar" ? "cssvar" : "default";
  });

  const handleNameFormatChange = (format: TokenNameFormat) => {
    setNameFormat(format);
    setCookie("tokenNameFormat", format);
  };

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

  const hasTokens =
    colorTokens.globalLight.length > 0 ||
    colorTokens.semanticLight.length > 0 ||
    colorTokens.globalDark.length > 0 ||
    colorTokens.semanticDark.length > 0;

  // Build outline for current mode
  const semanticGroups = activeMode === "light"
    ? groupSemanticTokensStable(colorTokens.semanticLight)
    : groupSemanticTokensStable(colorTokens.semanticDark);
  const globalGroups = activeMode === "light"
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

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-[1400px] mx-auto px-8 py-10">
        {/* Article Section */}
        <ArticleRenderer html={colorArticle} />

        {/* Token Display */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
              Color Tokens
            </h2>
            {hasTokens && (
              <Button variant="outline" onClick={handleExportCSS}>
                <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
              </Button>
            )}
          </div>
          <div className="h-px bg-border mt-3 mb-6" />

          <Tabs value={activeMode} onValueChange={setActiveMode}>
            {/* Controls row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <TabsList>
                <TabsTrigger value="light">Light Mode</TabsTrigger>
                <TabsTrigger value="dark">Dark Mode</TabsTrigger>
              </TabsList>

              {/* Name format toggle */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground shrink-0" style={{ fontSize: "var(--text-label)" }}>
                  Name format:
                </span>
                <div className="flex border border-border rounded-[var(--radius-card)] overflow-hidden">
                  <button
                    onClick={() => handleNameFormatChange("default")}
                    className="px-3 py-1.5 transition-colors"
                    style={{
                      fontSize: "var(--text-label)",
                      backgroundColor: nameFormat === "default" ? "var(--primary)" : "transparent",
                      color: nameFormat === "default" ? "var(--primary-foreground)" : "var(--foreground)",
                    }}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => handleNameFormatChange("cssvar")}
                    className="px-3 py-1.5 border-l border-border transition-colors"
                    style={{
                      fontSize: "var(--text-label)",
                      backgroundColor: nameFormat === "cssvar" ? "var(--primary)" : "transparent",
                      color: nameFormat === "cssvar" ? "var(--primary-foreground)" : "var(--foreground)",
                    }}
                  >
                    CSS VAR
                  </button>
                </div>
              </div>
            </div>

            <TabsContent value="light" className="mt-0">
              <GroupedTokenSection
                title="Semantic Tokens"
                sectionSlug={slugify("Semantic Tokens")}
                groups={groupSemanticTokensStable(colorTokens.semanticLight)}
                globalMap={globalLightMap}
                nameFormat={nameFormat}
              />
              <GroupedTokenSection
                title="Global Tokens"
                sectionSlug={slugify("Global Tokens")}
                groups={groupGlobalTokensStable(colorTokens.globalLight)}
                globalMap={globalLightMap}
                nameFormat={nameFormat}
              />
            </TabsContent>

            <TabsContent value="dark" className="mt-0">
              <GroupedTokenSection
                title="Semantic Tokens"
                sectionSlug={slugify("Semantic Tokens")}
                groups={groupSemanticTokensStable(colorTokens.semanticDark)}
                globalMap={globalDarkMap}
                nameFormat={nameFormat}
              />
              <GroupedTokenSection
                title="Global Tokens"
                sectionSlug={slugify("Global Tokens")}
                groups={groupGlobalTokensStable(colorTokens.globalDark)}
                globalMap={globalDarkMap}
                nameFormat={nameFormat}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Outline sidebar (right) */}
      {outlineSections.length > 0 && (
        <TokenOutlineSidebar sections={outlineSections} />
      )}
    </div>
  );
}