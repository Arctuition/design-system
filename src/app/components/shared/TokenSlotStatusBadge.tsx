import React from "react";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { useAppData } from "../../store/data-store";

/**
 * Three-state status badge for a single token slot on the CMS upload cards.
 *
 *   - **empty**: no real data in this slot. Either the array is empty or it
 *     looks like the shadcn-style placeholder seed (not a Figma export).
 *   - **uploaded**: data exists, and was set later than the last successful
 *     Publish — so it hasn't reached production bootstrap.css yet.
 *   - **published**: data exists, and the most recent upload was at or
 *     before the last successful Publish.
 *
 * The "looksLikeFigma" check lives on the caller via the `isFigmaShaped`
 * prop so each editor can apply its collection-specific heuristic
 * (color names use dots; size/font use slashes).
 */
export type TokenSlotState = "empty" | "uploaded" | "published";

export function computeTokenSlotState(
  slotKey: string,
  hasData: boolean,
  slotMtimes: Record<string, string>,
  lastPublishedAt: string | null,
): TokenSlotState {
  if (!hasData) return "empty";
  const mtime = slotMtimes[slotKey];
  if (!mtime) {
    // No mtime recorded but data is present — treat as published. This
    // happens for slots seeded from a server fetch before this PR landed.
    return lastPublishedAt ? "published" : "uploaded";
  }
  if (!lastPublishedAt) return "uploaded";
  return mtime <= lastPublishedAt ? "published" : "uploaded";
}

export function TokenSlotStatusBadge({
  slotKey,
  hasData,
}: {
  slotKey: string;
  hasData: boolean;
}) {
  const { tokenStatus } = useAppData();
  const state = computeTokenSlotState(
    slotKey,
    hasData,
    tokenStatus.tokenSlotMtimes,
    tokenStatus.tokensLastPublishedAt,
  );

  if (state === "empty") {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius)] bg-muted text-muted-foreground"
        style={{ fontSize: "var(--text-label)" }}
        title="Slot is empty — upload a JSON file to populate it"
      >
        <Circle className="size-3" />
        Empty
      </span>
    );
  }

  if (state === "uploaded") {
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius)] border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        style={{ fontSize: "var(--text-label)" }}
        title="Uploaded — click Publish to push to production bootstrap.css"
      >
        <AlertCircle className="size-3" />
        Uploaded
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius)] border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300"
      style={{ fontSize: "var(--text-label)" }}
      title="Published — current contents match what's in production bootstrap.css"
    >
      <CheckCircle2 className="size-3" />
      Published
    </span>
  );
}
