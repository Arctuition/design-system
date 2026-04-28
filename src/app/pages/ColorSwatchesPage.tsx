import React, { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import {
  getLightColorTokens,
  getDarkColorTokens,
  getGlobalColorTokens,
  groupColorTokens,
  type ParsedColorToken,
} from "../components/shared/color-json-token-utils";
import { TokenOutlineSidebar, buildOutlineSections, slugify } from "../components/shared/TokenOutlineSidebar";
import { copyToClipboard } from "../utils/clipboard";

// ── Swatch row ────────────────────────────────────────────────────────────

function SwatchRow({ token }: { token: ParsedColorToken }) {
  const copyVal = () => {
    copyToClipboard(token.value);
    toast.success(`Copied ${token.value}`);
  };
  const copyVar = () => {
    copyToClipboard(token.cssVar);
    toast.success(`Copied ${token.cssVar}`);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors group">
      {/* Swatch */}
      <div
        className="size-10 rounded-[var(--radius-card)] border border-border shrink-0"
        style={{ backgroundColor: token.value }}
        title={token.value}
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p
          className="text-foreground truncate flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
          style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)" }}
          onClick={copyVar}
          title="Click to copy CSS var"
        >
          {token.cssVar}
          <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </p>
        {token.aliasOf && (
          <p className="text-muted-foreground truncate mt-0.5" style={{ fontSize: "var(--text-label)" }}>
            → {token.aliasOf}
          </p>
        )}
      </div>

      {/* Hex value */}
      <code
        className="text-card-foreground bg-secondary px-2 py-1 rounded-[var(--radius)] cursor-pointer flex items-center gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
        style={{ fontSize: "var(--text-label)" }}
        onClick={copyVal}
        title="Click to copy value"
      >
        {token.value}
        <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </code>
    </div>
  );
}

// ── Grouped section ───────────────────────────────────────────────────────

function SwatchSection({
  groupName,
  tokens,
  sectionSlug,
}: {
  groupName: string;
  tokens: ParsedColorToken[];
  sectionSlug: string;
}) {
  return (
    <div className="mb-8" id={`section-${sectionSlug}`}>
      <h3
        className="mb-4"
        style={{ fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-normal)" }}
      >
        {groupName}
        <span
          className="text-muted-foreground ml-2"
          style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-normal)" }}
        >
          ({tokens.length})
        </span>
      </h3>
      <div className="border border-border rounded-[var(--radius-card)] overflow-hidden">
        {tokens.map((token) => (
          <SwatchRow key={token.cssVar} token={token} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type ColorTab = "light" | "dark" | "global";

export function ColorSwatchesPage() {
  const [activeTab, setActiveTab] = useState<ColorTab>("light");

  const lightGroups  = useMemo(() => groupColorTokens(getLightColorTokens()),  []);
  const darkGroups   = useMemo(() => groupColorTokens(getDarkColorTokens()),   []);
  const globalGroups = useMemo(() => groupColorTokens(getGlobalColorTokens()), []);

  const currentGroups =
    activeTab === "light"  ? lightGroups  :
    activeTab === "dark"   ? darkGroups   :
    globalGroups;

  const outlineSections = useMemo(
    () => buildOutlineSections(currentGroups.map((g) => ({ title: g.groupName, groups: [] }))),
    [currentGroups]
  );

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 min-w-0 max-w-[1400px] mx-auto px-8 py-10">
        <div className="mb-1">
          <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
            Color Swatches
          </h1>
        </div>
        <div className="h-px bg-border mt-3 mb-6" />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ColorTab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="light">Light</TabsTrigger>
            <TabsTrigger value="dark">Dark</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>

          {(["light", "dark", "global"] as ColorTab[]).map((tab) => {
            const groups =
              tab === "light"  ? lightGroups  :
              tab === "dark"   ? darkGroups   :
              globalGroups;
            return (
              <TabsContent key={tab} value={tab} className="mt-0">
                {groups.map((g) => (
                  <SwatchSection
                    key={g.groupName}
                    groupName={g.groupName}
                    tokens={g.tokens}
                    sectionSlug={slugify(g.groupName)}
                  />
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      {/* Outline sidebar */}
      {outlineSections.length > 0 && (
        <TokenOutlineSidebar sections={outlineSections} />
      )}
    </div>
  );
}
