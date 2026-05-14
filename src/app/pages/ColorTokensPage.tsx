import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { CssSyntaxBlock } from "../components/shared/CssSyntaxBlock";
import {
  getLightColorTokens,
  getDarkColorTokens,
  getGlobalColorTokens,
  getLightColorTokensFromKv,
  getDarkColorTokensFromKv,
  getGlobalColorTokensFromKv,
  looksLikeFigmaColorTokens,
  buildSemanticCssLines,
  buildGlobalCssLines,
  exportColorCSSAsZip,
} from "../components/shared/color-json-token-utils";
import { useAppData } from "../store/data-store";

function linesToString(lines: { text: string }[]): string {
  return lines.map(l => l.text).join("\n");
}

export function ColorTokensPage() {
  const [activeTab, setActiveTab] = useState<"light" | "dark" | "global">("light");

  // Pivoted from build-time-bundled JSON to live KV state. Falls back to
  // bundled JSON when KV holds the shadcn-style placeholder seed.
  const { colorTokens } = useAppData();
  const lightCss = useMemo(() => linesToString(buildSemanticCssLines(
    looksLikeFigmaColorTokens(colorTokens.semanticLight)
      ? getLightColorTokensFromKv(colorTokens.semanticLight)
      : getLightColorTokens(),
    "SEMANTIC TOKENS — LIGHT MODE"
  )), [colorTokens.semanticLight]);
  const darkCss = useMemo(() => linesToString(buildSemanticCssLines(
    looksLikeFigmaColorTokens(colorTokens.semanticDark)
      ? getDarkColorTokensFromKv(colorTokens.semanticDark)
      : getDarkColorTokens(),
    "SEMANTIC TOKENS — DARK MODE"
  )), [colorTokens.semanticDark]);
  const globalCss = useMemo(() => linesToString(buildGlobalCssLines(
    looksLikeFigmaColorTokens(colorTokens.global)
      ? getGlobalColorTokensFromKv(colorTokens.global)
      : getGlobalColorTokens()
  )), [colorTokens.global]);

  const handleExport = async () => {
    try {
      await exportColorCSSAsZip();
      toast.success("Exported color-tokens.zip");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <Link
        to="/color"
        className="inline-flex items-center gap-1.5 text-primary mb-6 hover:underline"
        style={{ fontSize: "var(--text-label)" }}
      >
        <ArrowLeft className="size-4" />
        Back to Color
      </Link>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Color Tokens
        </h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
        </Button>
      </div>
      <div className="h-px bg-border mt-3 mb-6" />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="light">Light</TabsTrigger>
          <TabsTrigger value="dark">Dark</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
        </TabsList>
        <TabsContent value="light"  className="mt-0"><CssSyntaxBlock code={lightCss}  maxHeight="70vh" /></TabsContent>
        <TabsContent value="dark"   className="mt-0"><CssSyntaxBlock code={darkCss}   maxHeight="70vh" /></TabsContent>
        <TabsContent value="global" className="mt-0"><CssSyntaxBlock code={globalCss} maxHeight="70vh" /></TabsContent>
      </Tabs>
    </div>
  );
}
