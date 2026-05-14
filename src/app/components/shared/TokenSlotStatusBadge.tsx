import React from "react";
import { CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { useAppData } from "../../store/data-store";

/**
 * Three-state status badge for a single token slot on the CMS upload cards.
 *
 *   - **empty**: no data in this slot.
 *   - **uploaded**: data exists AND was set later than this slot's
 *     publishedAt (or there's no publishedAt and there IS an mtime).
 *   - **published**: data exists AND publishedAt >= mtime, OR data exists
 *     with neither timestamp (legacy data — we have no evidence of a
 *     recent upload, so trust that the contents were published at some
 *     point in the past).
 *
 * The badge always renders a small timestamp underneath when we have one:
 *   "Uploaded   May 14, 14:32"  (yellow, mtime)
 *   "Published  May 14, 14:35"  (green,  publishedAt)
 *
 * For legacy data with no timestamps, the timestamp line is omitted —
 * the badge reads "Published" alone so we don't make up a date we don't
 * actually know. The first Publish click after Group E shipped will
 * seed a publishedAt baseline for each slot via markTokensPublished.
 */
export type TokenSlotState = "empty" | "uploaded" | "published";

export interface TokenSlotStateResult {
  state: TokenSlotState;
  /** ISO timestamp to display under the badge — undefined when unknown. */
  timestamp?: string;
}

export function computeTokenSlotState(
  slotKey: string,
  hasData: boolean,
  slotMtimes: Record<string, string>,
  slotPublishedAt: Record<string, string>,
): TokenSlotStateResult {
  if (!hasData) return { state: "empty" };
  const mtime = slotMtimes[slotKey];
  const publishedAt = slotPublishedAt[slotKey];

  // No tracked timestamps at all → legacy data. Default to "Published"
  // (no timestamp shown). The first Publish click will set a baseline.
  if (!mtime && !publishedAt) return { state: "published" };

  // Have an upload time but no publish time → user has uploaded since
  // tracking began but hasn't published yet.
  if (mtime && !publishedAt) return { state: "uploaded", timestamp: mtime };

  // Have a publish time but no upload time → published, content hasn't
  // been re-uploaded since.
  if (!mtime && publishedAt) return { state: "published", timestamp: publishedAt };

  // Both present — compare. Newer upload than publish means it's waiting
  // to ship; otherwise the current contents are live.
  if (mtime && publishedAt && mtime > publishedAt) {
    return { state: "uploaded", timestamp: mtime };
  }
  return { state: "published", timestamp: publishedAt };
}

/** Short, locale-stable display: "May 14, 14:32" — enough precision for
 *  the user to tell "did this just happen" from "this is stale" without
 *  being so verbose it overflows the card. */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hh}:${mm}`;
}

export function TokenSlotStatusBadge({
  slotKey,
  hasData,
}: {
  slotKey: string;
  hasData: boolean;
}) {
  const { tokenStatus } = useAppData();
  const { state, timestamp } = computeTokenSlotState(
    slotKey,
    hasData,
    tokenStatus.tokenSlotMtimes,
    tokenStatus.tokenSlotPublishedAt,
  );

  const labelByState: Record<TokenSlotState, string> = {
    empty: "Empty",
    uploaded: "Uploaded",
    published: "Published",
  };

  const Icon =
    state === "empty"     ? Circle        :
    state === "uploaded"  ? AlertCircle   :
                            CheckCircle2;

  const badgeClass =
    state === "empty"
      ? "border border-transparent bg-muted text-muted-foreground"
      : state === "uploaded"
        ? "border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300";

  const title =
    state === "empty"
      ? "Slot is empty — upload a JSON file to populate it"
      : state === "uploaded"
        ? "Uploaded — click Publish to push to production bootstrap.css"
        : "Published — current contents match what's in production bootstrap.css";

  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0">
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius)] ${badgeClass}`}
        style={{ fontSize: "var(--text-label)" }}
        title={title}
      >
        <Icon className="size-3" />
        {labelByState[state]}
      </span>
      {timestamp && (
        <span
          className="text-muted-foreground"
          style={{ fontSize: "10px", lineHeight: 1.1 }}
          title={new Date(timestamp).toLocaleString()}
        >
          {formatTimestamp(timestamp)}
        </span>
      )}
    </div>
  );
}
