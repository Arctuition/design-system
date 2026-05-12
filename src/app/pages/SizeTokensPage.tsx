import React, { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { CssSyntaxBlock } from "../components/shared/CssSyntaxBlock";
import {
  getSizeTokens,
  exportSizeCSSAsZip,
  buildGroupedSizeCss,
  buildGlobalSizeCss,
  buildBreakpointCss,
  SIZE_MODES,
  type SizeMode,
} from "../components/shared/size-json-token-utils";

type SizeTab = SizeMode | "global" | "breakpoints";

export function SizeTokensPage() {
  const [activeTab, setActiveTab] = useState<SizeTab>("web-desktop");

  const handleExport = async () => {
    try {
      await exportSizeCSSAsZip();
      toast.success("Exported size-tokens.zip");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <Link
        to="/size"
        className="inline-flex items-center gap-1.5 text-primary mb-6 hover:underline"
        style={{ fontSize: "var(--text-label)" }}
      >
        <ArrowLeft className="size-4" />
        Back to Size & Space
      </Link>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Size & Space Tokens
        </h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
        </Button>
      </div>
      <div className="h-px bg-border mt-3 mb-6" />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SizeTab)}>
        <TabsList className="mb-6">
          {SIZE_MODES.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="breakpoints">Breakpoints</TabsTrigger>
        </TabsList>
        {SIZE_MODES.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-0">
            <CssSyntaxBlock code={buildGroupedSizeCss(getSizeTokens(key))} maxHeight="70vh" />
          </TabsContent>
        ))}
        <TabsContent value="global" className="mt-0">
          <CssSyntaxBlock code={buildGlobalSizeCss()} maxHeight="70vh" />
        </TabsContent>
        <TabsContent value="breakpoints" className="mt-0">
          <CssSyntaxBlock code={buildBreakpointCss()} maxHeight="70vh" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
