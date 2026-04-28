import React, { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { CssSyntaxBlock } from "../components/shared/CssSyntaxBlock";
import {
  getFontTokens,
  exportFontCSSAsZip,
  FONT_MODES,
  type FontMode,
} from "../components/shared/font-token-utils";

function buildCss(mode: FontMode): string {
  const lines = getFontTokens(mode).map(t => `  ${t.cssVar}: ${t.value};`);
  return `:root {\n${lines.join("\n")}\n}`;
}

export function TypographyTokensPage() {
  const [activeMode, setActiveMode] = useState<FontMode>("web-desktop");

  const handleExport = async () => {
    try {
      await exportFontCSSAsZip();
      toast.success("Exported font-tokens.zip (4 CSS files)");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Typography Tokens
        </h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
        </Button>
      </div>
      <div className="h-px bg-border mt-3 mb-6" />

      <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as FontMode)}>
        <TabsList className="mb-6">
          {FONT_MODES.map(({ key, label }) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
        {FONT_MODES.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-0">
            <CssSyntaxBlock code={buildCss(key)} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
