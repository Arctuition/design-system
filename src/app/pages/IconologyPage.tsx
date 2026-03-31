import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppData } from "../store/data-store";
import { ArticleRenderer } from "../components/shared/ArticleRenderer";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Search, Download, Copy, FolderDown, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { downloadIconsAsZip } from "../components/shared/icon-zip-utils";
import { getIconDownloadFileName } from "../components/shared/icon-file-utils";
import type { IconItem } from "../store/data-store";
import { copyToClipboard } from "../utils/clipboard";

/** Allow Cmd/Ctrl+A to select all text inside an input instead of being swallowed by the host environment */
function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if ((e.metaKey || e.ctrlKey) && e.key === "a") {
    e.stopPropagation();
  }
}

function extractSvgHeight(svgContent: string): number {
  const heightMatch = svgContent.match(/height="(\d+)"/);
  if (heightMatch) return parseInt(heightMatch[1], 10);

  const vbMatch = svgContent.match(/viewBox="[\d.]+\s+[\d.]+\s+[\d.]+\s+([\d.]+)"/);
  if (vbMatch) return Math.round(parseFloat(vbMatch[1]));

  return 24;
}

function groupIconsBySize(icons: IconItem[]): Map<string, IconItem[]> {
  const groups = new Map<string, IconItem[]>();
  icons.forEach((icon) => {
    const height = extractSvgHeight(icon.svgContent);
    const key = `${height}px`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(icon);
  });
  return new Map([...groups.entries()].sort((a, b) => {
    return parseInt(a[0]) - parseInt(b[0]);
  }));
}

function groupIconsByDate(icons: IconItem[]): Map<string, IconItem[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const prev7 = new Date(startOfToday.getTime() - 7 * 86400000);
  const prev30 = new Date(startOfToday.getTime() - 30 * 86400000);

  const groups = new Map<string, IconItem[]>();

  const sorted = [...icons].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });

  sorted.forEach((icon) => {
    const d = icon.createdAt ? new Date(icon.createdAt) : null;
    let key: string;
    if (!d || isNaN(d.getTime())) {
      key = "Unknown";
    } else if (d >= startOfToday) {
      key = "Today";
    } else if (d >= prev7) {
      key = "Previous 7 Days";
    } else if (d >= prev30) {
      key = "Previous 30 Days";
    } else {
      key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(icon);
  });

  return groups;
}

function groupIconsByDateModified(icons: IconItem[]): Map<string, IconItem[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const prev7 = new Date(startOfToday.getTime() - 7 * 86400000);
  const prev30 = new Date(startOfToday.getTime() - 30 * 86400000);

  const groups = new Map<string, IconItem[]>();

  const sorted = [...icons].sort((a, b) => {
    const da = (a.updatedAt || a.createdAt) ? new Date(a.updatedAt || a.createdAt!).getTime() : 0;
    const db = (b.updatedAt || b.createdAt) ? new Date(b.updatedAt || b.createdAt!).getTime() : 0;
    return db - da;
  });

  sorted.forEach((icon) => {
    const dateStr = icon.updatedAt || icon.createdAt;
    const d = dateStr ? new Date(dateStr) : null;
    let key: string;
    if (!d || isNaN(d.getTime())) {
      key = "Unknown";
    } else if (d >= startOfToday) {
      key = "Today";
    } else if (d >= prev7) {
      key = "Previous 7 Days";
    } else if (d >= prev30) {
      key = "Previous 30 Days";
    } else {
      key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(icon);
  });

  return groups;
}

type GroupByMode = "size" | "date" | "dateModified";

export function IconologyPage() {
  const { iconologyArticle, icons } = useAppData();
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<number | null>(null);
  const [styleFilters, setStyleFilters] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByMode>("size");
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [popoverReady, setPopoverReady] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const clickedRectRef = useRef<DOMRect | null>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!selectedIcon) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedIcon(null);
        setPopoverPos(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selectedIcon]);

  // Close popover on Escape
  useEffect(() => {
    if (!selectedIcon) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedIcon(null);
        setPopoverPos(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedIcon]);

  // Two-pass positioning: after popover mounts, measure actual height → exactly 8px gap
  useEffect(() => {
    if (!selectedIcon || !popoverRef.current || !clickedRectRef.current) return;
    const rect = clickedRectRef.current;
    const popoverEl = popoverRef.current;
    const popoverWidth = 280;
    const gap = 8;
    const actualHeight = popoverEl.offsetHeight;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    let top = rect.top - actualHeight - gap; // popup bottom sits 8px above card top

    if (top < gap) {
      top = rect.bottom + gap; // 8px below card if no room above
    }
    if (left + popoverWidth > window.innerWidth - gap) {
      left = window.innerWidth - popoverWidth - gap;
    }
    if (left < gap) left = gap;

    setPopoverPos({ top, left });
    setPopoverReady(true);
  }, [selectedIcon]);

  const toggleStyleFilter = (filter: string) => {
    setStyleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const filteredIcons = useMemo(() => {
    let result = icons;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (icon) =>
          icon.name.toLowerCase().includes(q) ||
          icon.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sizeFilter !== null) {
      result = result.filter((icon) => extractSvgHeight(icon.svgContent) === sizeFilter);
    }
    if (styleFilters.size > 0) {
      result = result.filter((icon) => {
        const nameLower = icon.name.toLowerCase();
        return [...styleFilters].some((f) => nameLower.includes(f));
      });
    }
    return result;
  }, [icons, search, sizeFilter, styleFilters]);

  const groupedIcons = useMemo(() => groupIconsBySize(filteredIcons), [filteredIcons]);
  const groupedByDate = useMemo(() => groupIconsByDate(filteredIcons), [filteredIcons]);
  const groupedByDateModified = useMemo(() => groupIconsByDateModified(filteredIcons), [filteredIcons]);

  const availableSizes = useMemo(() => {
    const sizes = new Set<number>();
    icons.forEach((icon) => sizes.add(extractSvgHeight(icon.svgContent)));
    return [...sizes].sort((a, b) => a - b);
  }, [icons]);

  const downloadSvg = (icon: IconItem) => {
    const blob = new Blob([icon.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getIconDownloadFileName(icon.fileName, icon.name);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkDownload = async () => {
    if (filteredIcons.length === 0) return;
    setIsDownloading(true);
    try {
      const label = sizeFilter !== null ? `icons-${sizeFilter}px` : "icons";
      await downloadIconsAsZip(filteredIcons, `${label}.zip`);
      toast.success(`Downloaded ${filteredIcons.length} icons as ZIP`);
    } catch {
      toast.error("Failed to create ZIP file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleIconClick = (icon: IconItem, e: React.MouseEvent<HTMLDivElement>) => {
    clickedRectRef.current = e.currentTarget.getBoundingClientRect();
    setPopoverReady(false);
    setSelectedIcon(icon);
    setPopoverPos({ top: -9999, left: -9999 }); // off-screen until measured
  };

  const copyIconName = (icon: IconItem) => {
    copyToClipboard(icon.name);
    toast.success(`Copied name: ${icon.name}`);
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--color-surface-dim)" }}>
      {/* Sticky search & filter bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border" style={{ padding: "var(--spacing-4, 16px) var(--spacing-8, 32px)" }}>
        <div className="max-w-[1400px] mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative" style={{ minWidth: "300px" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search icons by name or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={search ? "pl-10 pr-8" : "pl-10"}
                onKeyDown={handleInputKeyDown}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleBulkDownload}
              disabled={filteredIcons.length === 0 || isDownloading}
              title="Download all filtered icons as ZIP"
              style={{ fontSize: "var(--text-label)" }}
              className="ml-auto"
            >
              <FolderDown className="size-4 mr-1.5" />
              {isDownloading ? "Zipping..." : `Download All (${filteredIcons.length})`}
            </Button>
          </div>

          {/* Size & Style filters */}
          {availableSizes.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground shrink-0" style={{ fontSize: "var(--text-label)" }}>
                Size:
              </span>
              <Button
                variant={sizeFilter === null ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5"
                onClick={() => setSizeFilter(null)}
                style={{ fontSize: "var(--text-label)" }}
              >
                All
              </Button>
              {availableSizes.map((size) => (
                <Button
                  key={size}
                  variant={sizeFilter === size ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5"
                  onClick={() => setSizeFilter(sizeFilter === size ? null : size)}
                  style={{ fontSize: "var(--text-label)" }}
                >
                  {size}px
                </Button>
              ))}

              <div className="w-px h-4 bg-border shrink-0 mx-1" />

              <span className="text-muted-foreground shrink-0" style={{ fontSize: "var(--text-label)" }}>
                Style:
              </span>
              {["fill", "duotone", "circle"].map((filter) => (
                <Button
                  key={filter}
                  variant={styleFilters.has(filter) ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2.5 capitalize"
                  onClick={() => toggleStyleFilter(filter)}
                  style={{ fontSize: "var(--text-label)" }}
                >
                  {filter}
                </Button>
              ))}
              {styleFilters.size > 0 && (
                <button
                  onClick={() => setStyleFilters(new Set())}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  Clear
                </button>
              )}

              <div className="flex-1" />

              {/* Group by dropdown */}
              <div className="relative shrink-0">
                <span className="text-muted-foreground mr-1.5" style={{ fontSize: "var(--text-label)" }}>
                  Group by:
                </span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
                  className="appearance-none bg-background border border-border rounded-[var(--radius)] pl-2 pr-6 py-1 text-foreground cursor-pointer"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  <option value="size">Size</option>
                  <option value="date">Date Added</option>
                  <option value="dateModified">Date Modified</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" style={{ right: 6, top: "50%" }} />
              </div>
            </div>
          )}

          {/* Show group-by even when there's only one size */}
          {availableSizes.length <= 1 && (
            <div className="flex items-center gap-2 justify-end">
              <div className="relative shrink-0">
                <span className="text-muted-foreground mr-1.5" style={{ fontSize: "var(--text-label)" }}>
                  Group by:
                </span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupByMode)}
                  className="appearance-none bg-background border border-border rounded-[var(--radius)] pl-2 pr-6 py-1 text-foreground cursor-pointer"
                  style={{ fontSize: "var(--text-label)" }}
                >
                  <option value="size">Size</option>
                  <option value="date">Date Added</option>
                  <option value="dateModified">Date Modified</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" style={{ right: 6, top: "50%" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto" style={{ padding: "var(--spacing-10, 40px) var(--spacing-8, 32px)" }}>
          {/* Article */}
          <ArticleRenderer html={iconologyArticle} />

          {/* Icon Grid - grouped by height */}
          <div className="mt-12">
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)" }}>
              Icon Library
            </h2>
            <div className="h-px bg-border mt-3 mb-6" />

            <p className="text-muted-foreground mb-6" style={{ fontSize: "var(--text-label)" }}>
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""} found
              {sizeFilter !== null && ` at ${sizeFilter}px`}
            </p>

            {groupBy === "size" ? (
              <>
                {[...groupedIcons.entries()].map(([sizeLabel, sizeIcons]) => (
                  <div key={sizeLabel} className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                        {sizeLabel}
                      </h3>
                      <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                        {sizeIcons.length} icon{sizeIcons.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" style={{ gap: 16 }}>
                      {sizeIcons.map((icon) => {
                        const size = extractSvgHeight(icon.svgContent);
                        return (
                          <div
                            key={icon.id}
                            className={`flex flex-col items-center justify-center gap-2 p-4 pb-2 align-bottom rounded-[var(--radius-card)] transition-all cursor-pointer ${
                              selectedIcon?.id === icon.id
                                ? "ring-1 ring-primary"
                                : ""
                            }`}
                            style={{
                              minHeight: 140,
                              backgroundColor: selectedIcon?.id === icon.id
                                ? "var(--color-surface-container-action-hover)"
                                : "var(--color-surface-container-default)",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedIcon?.id !== icon.id) {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-container-action-hover)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedIcon?.id !== icon.id) {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-container-default)";
                              }
                            }}
                            onClick={(e) => handleIconClick(icon, e)}
                          >
                            <div
                              className="flex items-center justify-center text-foreground"
                              style={{ width: size, height: size }}
                              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                            />
                            <span
                              className="text-center text-muted-foreground w-full"
                              style={{
                                fontSize: "var(--text-label)",
                                lineHeight: "1.5",
                                minHeight: "calc(var(--text-label) * 3)",
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                              }}
                            >
                              {icon.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : groupBy === "date" ? (
              <>
                {[...groupedByDate.entries()].map(([dateLabel, dateIcons]) => (
                  <div key={dateLabel} className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                        {dateLabel}
                      </h3>
                      <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                        {dateIcons.length} icon{dateIcons.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" style={{ gap: 16 }}>
                      {dateIcons.map((icon) => {
                        const size = extractSvgHeight(icon.svgContent);
                        return (
                          <div
                            key={icon.id}
                            className={`flex flex-col items-center justify-center gap-2 p-4 pb-2 align-bottom rounded-[var(--radius-card)] transition-all cursor-pointer ${
                              selectedIcon?.id === icon.id
                                ? "ring-1 ring-primary"
                                : ""
                            }`}
                            style={{
                              minHeight: 140,
                              backgroundColor: selectedIcon?.id === icon.id
                                ? "var(--color-surface-container-action-hover)"
                                : "var(--color-surface-container-default)",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedIcon?.id !== icon.id) {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-container-action-hover)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedIcon?.id !== icon.id) {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-container-default)";
                              }
                            }}
                            onClick={(e) => handleIconClick(icon, e)}
                          >
                            <div
                              className="flex items-center justify-center text-foreground"
                              style={{ width: size, height: size }}
                              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                            />
                            <span
                              className="text-center text-muted-foreground w-full"
                              style={{
                                fontSize: "var(--text-label)",
                                lineHeight: "1.5",
                                minHeight: "calc(var(--text-label) * 3)",
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                              }}
                            >
                              {icon.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[...groupedByDateModified.entries()].map(([dateLabel, dateIcons]) => (
                  <div key={dateLabel} className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)" }}>
                        {dateLabel}
                      </h3>
                      <span className="text-muted-foreground" style={{ fontSize: "var(--text-label)" }}>
                        {dateIcons.length} icon{dateIcons.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8" style={{ gap: 16 }}>
                      {dateIcons.map((icon) => {
                        const size = extractSvgHeight(icon.svgContent);
                        return (
                          <div
                            key={icon.id}
                            className={`flex flex-col items-center justify-center gap-2 p-4 pb-2 align-bottom rounded-[var(--radius-card)] transition-all cursor-pointer ${
                              selectedIcon?.id === icon.id
                                ? "ring-1 ring-primary"
                                : ""
                            }`}
                            style={{
                              minHeight: 140,
                              backgroundColor: selectedIcon?.id === icon.id
                                ? "var(--color-surface-container-action-hover)"
                                : "var(--color-surface-container-default)",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedIcon?.id !== icon.id) {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-container-action-hover)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedIcon?.id !== icon.id) {
                                e.currentTarget.style.backgroundColor = "var(--color-surface-container-default)";
                              }
                            }}
                            onClick={(e) => handleIconClick(icon, e)}
                          >
                            <div
                              className="flex items-center justify-center text-foreground"
                              style={{ width: size, height: size }}
                              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                            />
                            <span
                              className="text-center text-muted-foreground w-full"
                              style={{
                                fontSize: "var(--text-label)",
                                lineHeight: "1.5",
                                minHeight: "calc(var(--text-label) * 3)",
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                overflow: "hidden",
                              }}
                            >
                              {icon.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}

            {filteredIcons.length === 0 && (
              <div className="text-center py-16 text-muted-foreground" style={{ fontSize: "var(--text-p)" }}>
                No icons match your search. Try different keywords.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Icon detail popover */}
      {selectedIcon && popoverPos && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-card border border-border overflow-hidden"
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
            width: 280,
            borderRadius: "var(--radius-card)",
            boxShadow: "0px 10px 15px 0px rgba(0,0,0,0.1), 0px 4px 6px 0px rgba(0,0,0,0.1)",
            opacity: popoverReady ? 1 : 0,
            transition: "opacity 80ms ease",
          }}
        >
          {/* Icon preview — gray background */}
          <div
            className="flex items-center justify-center w-full shrink-0"
            style={{ height: 128, backgroundColor: "var(--color-surface-dim)" }}
          >
            <div
              className="flex items-center justify-center text-foreground"
              style={{ width: 80, height: 80 }}
              dangerouslySetInnerHTML={{
                __html: selectedIcon.svgContent
                  .replace(/width="[^"]*"/, 'width="80"')
                  .replace(/height="[^"]*"/, 'height="80"'),
              }}
            />
          </div>

          {/* Name + actions */}
          <div className="flex flex-col items-center" style={{ gap: 6, paddingLeft: 12, paddingRight: 12, paddingTop: 12, paddingBottom: 12 }}>
            {/* Name row with copy icon */}
            <button
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] hover:bg-secondary/60 transition-colors"
              style={{ paddingLeft: 6, paddingRight: 6, paddingTop: 4, paddingBottom: 4 }}
              onClick={() => copyIconName(selectedIcon)}
              aria-label="Copy icon name"
            >
              <span
                className="text-foreground"
                style={{ fontSize: "var(--text-label)", fontWeight: "var(--font-weight-semibold)" }}
              >
                {selectedIcon.name}
              </span>
              <Copy className="size-3.5 text-muted-foreground shrink-0" />
            </button>

            {/* Download SVG */}
            <button
              className="flex items-center justify-center gap-2 w-full rounded-[var(--radius)] transition-colors text-foreground hover:bg-secondary/60"
              style={{ fontSize: "var(--text-label)", paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12 }}
              onClick={() => downloadSvg(selectedIcon)}
            >
              <Download className="size-3.5 shrink-0" />
              Download SVG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
