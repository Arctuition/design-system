import React from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "../../utils/clipboard";

export interface TokenRow {
  cssVar: string;
  value: string;
  aliasOf?: string;
  preview?: React.ReactNode; // optional swatch / visual
}

export interface TokenGroup {
  groupName: string;
  tokens: TokenRow[];
}

interface TokenTableProps {
  groups: TokenGroup[];
}

function TokenRowItem({ token }: { token: TokenRow }) {
  const copyVar = () => {
    copyToClipboard(token.cssVar);
    toast.success(`Copied ${token.cssVar}`);
  };
  const copyVal = () => {
    copyToClipboard(token.value);
    toast.success(`Copied ${token.value}`);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors group">
      {/* Optional preview slot */}
      {token.preview && <div className="shrink-0">{token.preview}</div>}

      {/* CSS var name */}
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
            alias: {token.aliasOf}
          </p>
        )}
      </div>

      {/* Value */}
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

export function TokenTable({ groups }: TokenTableProps) {
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground" style={{ fontSize: "var(--text-p)" }}>
        No tokens found.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.groupName} id={`group-${group.groupName.toLowerCase().replace(/\s+/g, "-")}`}>
          <h3
            className="mb-4"
            style={{ fontSize: "var(--text-h3)", fontWeight: "var(--font-weight-normal)" }}
          >
            {group.groupName}
            <span
              className="text-muted-foreground ml-2"
              style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-normal)" }}
            >
              ({group.tokens.length})
            </span>
          </h3>
          <div className="border border-border rounded-[var(--radius-card)] overflow-hidden">
            {group.tokens.map((token) => (
              <TokenRowItem key={token.cssVar} token={token} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
