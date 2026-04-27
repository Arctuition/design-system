import React from "react";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportSizeCSSAsZip } from "../components/shared/size-token-utils";

export function SizeTokensPage() {
  const { sizeArticle, sizeTokens } = useAppData();

  const totalTokens =
    sizeTokens.global.length +
    sizeTokens.deviceMobile.length +
    sizeTokens.deviceTablet.length +
    sizeTokens.webMobile.length +
    sizeTokens.webDesktop.length;

  const handleExportCSS = async () => {
    if (totalTokens === 0) {
      toast.error("No size tokens to export. Upload token files in the CMS first.");
      return;
    }
    try {
      await exportSizeCSSAsZip(sizeTokens);
      toast.success("Exported size-tokens.zip (5 CSS files)");
    } catch {
      toast.error("Failed to export CSS files.");
    }
  };

  return (
    <div className="flex-1 min-w-0 max-w-[1400px] mx-auto px-8 py-10">
      {/* Export button on top */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
          Size &amp; Space Tokens
        </h1>
        <Button variant="outline" onClick={handleExportCSS}>
          <Download className="size-4 mr-1.5" /> Export CSS VAR (.zip)
        </Button>
      </div>
      <div className="h-px bg-border mb-6" />

      <ArticleRenderer html={sizeArticle} />
    </div>
  );
}
