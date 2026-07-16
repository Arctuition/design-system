import React, { useState, useRef, useMemo } from "react";
import { Navigate, Link } from "react-router";
import { useAppData } from "../../store/data-store";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ArrowLeft, Upload, Plus, Pencil, Trash2, Save, X, Tag, Search, FolderDown, FolderUp, ChevronDown, RefreshCw, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { downloadIconsAsZip, collectSvgUploads } from "../../components/shared/icon-zip-utils";
import { getIconDownloadFileName, iconFileNameToDisplayName } from "../../components/shared/icon-file-utils";
import { buildIconTagsFromName } from "../../store/icon-tag-enrichment";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import type { IconItem } from "../../store/data-store";

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
  return new Map([...groups.entries()].sort((a, b) => parseInt(a[0]) - parseInt(b[0])));
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
    if (!d || isNaN(d.getTime())) key = "Unknown";
    else if (d >= startOfToday) key = "Today";
    else if (d >= prev7) key = "Previous 7 Days";
    else if (d >= prev30) key = "Previous 30 Days";
    else key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
    if (!d || isNaN(d.getTime())) key = "Unknown";
    else if (d >= startOfToday) key = "Today";
    else if (d >= prev7) key = "Previous 7 Days";
    else if (d >= prev30) key = "Previous 30 Days";
    else key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(icon);
  });
  return groups;
}

type GroupByMode = "size" | "date" | "dateModified";

// Persist the Icon Manager's "Group by" choice in a cookie so the sort order
// survives reloads and navigation. Default is "dateModified" (most-recently
// changed first) — the most useful default for a library that's actively being
// added to. Kept independent from the public library's cookie so a CMS editor's
// working preference doesn't change what visitors see (that page has its own).
const GROUP_BY_COOKIE = "ds-icon-manager-group-by";

function readGroupByCookie(): GroupByMode {
  if (typeof document === "undefined") return "dateModified";
  const m = document.cookie.match(/(?:^|;\s*)ds-icon-manager-group-by=([^;]+)/);
  const v = m?.[1];
  return v === "size" || v === "date" || v === "dateModified" ? v : "dateModified";
}

function writeGroupByCookie(v: GroupByMode) {
  if (typeof document === "undefined") return;
  // ~1 year persistence; scoped to the whole site, lax same-site.
  document.cookie = `${GROUP_BY_COOKIE}=${v}; path=/; max-age=31536000; SameSite=Lax`;
}

/** One SVG staged for a bulk upload, resolved against the current library. */
interface StagedIcon {
  fileName: string;
  svgContent: string;
  /** True when an icon with this fileName already exists (upload = overwrite). */
  isUpdate: boolean;
}

function tagsToInputValue(tags: string[]): string {
  return tags.join(", ");
}

function parseTagsInput(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of value.split(",")) {
    const normalized = part.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    tags.push(normalized);
  }

  return tags;
}

export function IconEditor() {
  const { isAuthenticated, icons, addIcon, updateIcon, removeIcon, regenerateAllIconTags } = useAppData();
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [hasManualTagEdits, setHasManualTagEdits] = useState(false);
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState<number | null>(null);
  const [styleFilters, setStyleFilters] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<GroupByMode>(() => readGroupByCookie());
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ added: number; updated: number; duplicatesInBatch: number } | null>(null);
  // Pre-upload preview: files are parsed and staged here so the user can review
  // (and drop) them before anything is written to the library. null = no
  // preview open. `pendingDuplicates` counts same-named files collapsed within
  // the batch (last one wins), surfaced in the preview footer.
  const [isPreparing, setIsPreparing] = useState(false);
  const [pendingIcons, setPendingIcons] = useState<StagedIcon[] | null>(null);
  const [pendingDuplicates, setPendingDuplicates] = useState(0);

  if (!isAuthenticated) return <Navigate to="/cms/login" replace />;

  const handleSingleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const existing = icons.find((i) => i.fileName === file.name);
        if (existing) {
          updateIcon(existing.id, { svgContent: content });
          toast.success(`Updated: ${file.name}`);
        } else {
          addIcon({
            name: iconFileNameToDisplayName(file.name),
            tags: [],
            svgContent: content,
            fileName: file.name,
          });
          toast.success(`Uploaded: ${file.name}`);
        }
      };
      reader.readAsText(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Parse a bulk selection (multi-select SVGs, a folder, and/or ZIP archives)
  // and open the preview dialog. Nothing is written to the library yet — the
  // user reviews the staged list first (requirement: preview before any upload,
  // whether the files are new or overwrite existing icons).
  const prepareBulkUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setIsPreparing(true);
    try {
      const { items, errors } = await collectSvgUploads(files);
      if (errors.length > 0) {
        toast.error(`Could not read ${errors.length} file${errors.length === 1 ? "" : "s"}`);
      }
      if (items.length === 0) {
        if (errors.length === 0) toast.error("No SVG files found in the selection.");
        return;
      }
      // Dedupe within the batch by fileName (last one wins), so two same-named
      // files don't both stage as separate rows.
      const dedupedByName = new Map<string, string>();
      items.forEach((item) => dedupedByName.set(item.fileName, item.svgContent));
      const duplicatesInBatch = items.length - dedupedByName.size;

      const staged: StagedIcon[] = Array.from(dedupedByName.entries()).map(([fileName, svgContent]) => ({
        fileName,
        svgContent,
        isUpdate: icons.some((i) => i.fileName === fileName),
      }));
      // New icons first, then overwrites; alphabetical within each group.
      staged.sort(
        (a, b) => Number(a.isUpdate) - Number(b.isUpdate) || a.fileName.localeCompare(b.fileName),
      );

      setPendingDuplicates(duplicatesInBatch);
      setPendingIcons(staged);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (bulkInputRef.current) bulkInputRef.current.value = "";
    void prepareBulkUpload(files);
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (folderInputRef.current) folderInputRef.current.value = "";
    void prepareBulkUpload(files);
  };

  const removePendingIcon = (fileName: string) => {
    setPendingIcons((prev) => (prev ? prev.filter((i) => i.fileName !== fileName) : prev));
  };

  const cancelPendingUpload = () => {
    setPendingIcons(null);
    setPendingDuplicates(0);
  };

  // Commit the reviewed batch. Existence is re-resolved against the current
  // library at write time (not the flag captured at preview) so the counts and
  // add-vs-update decision stay correct even if the library changed meanwhile.
  const confirmPendingUpload = () => {
    if (!pendingIcons || pendingIcons.length === 0) return;
    let added = 0;
    let updated = 0;
    pendingIcons.forEach((item) => {
      const existing = icons.find((i) => i.fileName === item.fileName);
      if (existing) {
        updateIcon(existing.id, { svgContent: item.svgContent });
        updated++;
      } else {
        addIcon({
          name: iconFileNameToDisplayName(item.fileName),
          tags: [],
          svgContent: item.svgContent,
          fileName: item.fileName,
        });
        added++;
      }
    });
    const duplicatesInBatch = pendingDuplicates;
    setPendingIcons(null);
    setPendingDuplicates(0);
    setBulkResult({ added, updated, duplicatesInBatch });
  };

  const handleGroupByChange = (value: GroupByMode) => {
    setGroupBy(value);
    writeGroupByCookie(value);
  };

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const nextFileName = file.name;
      updateIcon(replacingId, {
        svgContent: ev.target?.result as string,
        fileName: nextFileName,
        name: iconFileNameToDisplayName(nextFileName),
      });
      toast.success("Icon replaced");
      setReplacingId(null);
    };
    reader.readAsText(file);
    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  const startEdit = (icon: typeof icons[0]) => {
    setEditing(icon.id);
    setEditName(getIconDownloadFileName(icon.fileName, icon.name).replace(/\.svg$/i, ""));
    setEditTags(tagsToInputValue(icon.tags));
    setHasManualTagEdits(false);
  };

  const regenerateTags = () => {
    const generatedTags = buildIconTagsFromName(editName);
    setEditTags(tagsToInputValue(generatedTags));
    setHasManualTagEdits(false);
    toast.success(`Regenerated ${generatedTags.length} tag${generatedTags.length === 1 ? "" : "s"}`);
  };

  const handleEditNameChange = (value: string) => {
    setEditName(value);
    if (!hasManualTagEdits) {
      setEditTags(tagsToInputValue(buildIconTagsFromName(value)));
    }
  };

  const handleEditTagsChange = (value: string) => {
    setEditTags(value);
    setHasManualTagEdits(true);
  };

  const saveEdit = () => {
    if (!editing) return;
    const normalizedFileBase = editName.trim().replace(/\.svg$/i, "");
    if (!normalizedFileBase) {
      toast.error("Icon name is required");
      return;
    }

    const nextFileName = `${normalizedFileBase}.svg`;

    updateIcon(editing, {
      name: iconFileNameToDisplayName(nextFileName),
      fileName: nextFileName,
      tags: parseTagsInput(editTags),
    });
    setEditing(null);
    toast.success("Icon updated");
  };

  const toggleStyleFilter = (filter: string) => {
    setStyleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  };

  const availableSizes = useMemo(() => {
    const sizes = new Set<number>();
    icons.forEach((icon) => sizes.add(extractSvgHeight(icon.svgContent)));
    return [...sizes].sort((a, b) => a - b);
  }, [icons]);

  const filteredIcons = useMemo(() => {
    let result = icons;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q)));
    }
    if (sizeFilter !== null) {
      result = result.filter((i) => extractSvgHeight(i.svgContent) === sizeFilter);
    }
    if (styleFilters.size > 0) {
      result = result.filter((icon) => {
        const nameLower = icon.name.toLowerCase();
        return [...styleFilters].some((f) => nameLower.includes(f));
      });
    }
    return result;
  }, [icons, search, sizeFilter, styleFilters]);

  const groupedBySize = useMemo(() => groupIconsBySize(filteredIcons), [filteredIcons]);
  const groupedByDate = useMemo(() => groupIconsByDate(filteredIcons), [filteredIcons]);
  const groupedByDateModified = useMemo(() => groupIconsByDateModified(filteredIcons), [filteredIcons]);

  const activeGroups = useMemo(() => {
    if (groupBy === "size") return groupedBySize;
    if (groupBy === "date") return groupedByDate;
    return groupedByDateModified;
  }, [groupBy, groupedBySize, groupedByDate, groupedByDateModified]);

  const handleBulkDownload = async () => {
    if (filteredIcons.length === 0) return;
    setIsDownloading(true);
    try {
      await downloadIconsAsZip(filteredIcons, "icons.zip");
      toast.success(`Downloaded ${filteredIcons.length} icons as ZIP`);
    } catch {
      toast.error("Failed to create ZIP file");
    } finally {
      setIsDownloading(false);
    }
  };

  const regenerateTagsForAllIcons = () => {
    const res = regenerateAllIconTags();
    if (!res.changed) {
      toast.success(`Tags are already up to date (${res.iconCount} icons)`);
      return;
    }
    toast.success(`Regenerated tags for ${res.iconCount} icons`);
  };

  const renderIconRow = (icon: IconItem) => (
    <div key={icon.id} className="flex items-center gap-4 p-3 border rounded-[var(--radius-card)]" style={{ borderColor: "var(--color-border-default)" }}>
      <div className="size-10 flex items-center justify-center shrink-0" style={{ color: "var(--color-label-primary)" }} dangerouslySetInnerHTML={{ __html: icon.svgContent }} />

      {editing === icon.id ? (
        <div className="flex-1 min-w-0 space-y-2">
          <Input value={editName} onChange={(e) => handleEditNameChange(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Icon name" />
          <div className="flex items-center gap-1.5">
            <Tag className="size-3.5 shrink-0" style={{ color: "var(--color-label-tertiary)" }} />
            <Input value={editTags} onChange={(e) => handleEditTagsChange(e.target.value)} onKeyDown={handleInputKeyDown} placeholder="Tags (comma separated)" />
            <Button size="sm" variant="outline" type="button" onClick={regenerateTags}>
              <RefreshCw className="size-3.5 mr-1" /> Regenerate Tags
            </Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit}><Save className="size-3.5 mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)", color: "var(--color-label-primary)" }}>{icon.name}</p>
            {icon.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {icon.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded-[var(--radius)]" style={{ fontSize: "11px", backgroundColor: "var(--color-fill-secondary)", color: "var(--color-label-secondary)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => startEdit(icon)} title="Edit">
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => { setReplacingId(icon.id); replaceInputRef.current?.click(); }} title="Replace">
              <Upload className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => { if (confirm("Delete this icon?")) { removeIcon(icon.id); toast.success("Icon deleted"); } }} title="Delete">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto" style={{ padding: "var(--spacing-10, 40px) var(--spacing-8, 32px)" }}>
      <Link to="/cms" className="flex items-center gap-1.5 mb-6 hover:underline" style={{ fontSize: "var(--text-label)", color: "var(--color-label-action-primary)" }}>
        <ArrowLeft className="size-4" /> Back to CMS
      </Link>
      <h1 style={{ fontSize: "var(--text-h2)", fontWeight: "var(--font-weight-normal)", color: "var(--color-label-primary)" }}>
        Icon Manager
      </h1>
      <div className="h-px mt-3 mb-6" style={{ backgroundColor: "var(--color-divider-default)" }} />

      <Tabs defaultValue="icons">
        <TabsList>
          <TabsTrigger value="icons">Icon Management</TabsTrigger>
          <TabsTrigger value="doc">Reference Doc</TabsTrigger>
        </TabsList>

        <TabsContent value="doc" className="mt-6">
          <div className="border rounded-[var(--radius-card)] p-5" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-surface-container-high)" }}>
            <p className="mb-3" style={{ fontSize: "var(--text-p)", color: "var(--color-label-primary)" }}>
              Edit the Iconology reference doc (Markdown) shown on <code>/iconology</code>. Saving
              auto-publishes to Storage for AI agents — same pipeline as the token docs.
            </p>
            <Link to="/cms/icon-editor/doc">
              <Button type="button">
                <Pencil className="size-4 mr-1.5" /> Open Markdown Editor
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="icons" className="mt-6">
          {/* Upload & download area */}
          <div className="flex flex-wrap items-center gap-3 mb-6 p-4 border rounded-[var(--radius-card)]" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-surface-container-high)" }}>
            <input ref={fileInputRef} type="file" accept=".svg" className="hidden" onChange={handleSingleUpload} />
            <input ref={bulkInputRef} type="file" accept=".svg,.zip" multiple className="hidden" onChange={handleBulkUpload} />
            {/* `webkitdirectory` turns the native picker into a folder picker; it
                yields every file inside (flattened to basenames). React's types
                don't include the attribute, so it's spread as a plain prop. */}
            <input
              ref={folderInputRef}
              type="file"
              className="hidden"
              onChange={handleFolderUpload}
              {...({ webkitdirectory: "", directory: "", multiple: true } as Record<string, unknown>)}
            />
            <input ref={replaceInputRef} type="file" accept=".svg" className="hidden" onChange={handleReplace} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Plus className="size-4 mr-1.5" /> Upload Single
            </Button>
            <Button
              variant="outline"
              onClick={() => bulkInputRef.current?.click()}
              disabled={isPreparing}
              title="Select multiple SVG files or a ZIP archive"
            >
              {isPreparing ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Upload className="size-4 mr-1.5" />}
              Bulk Import (SVG / ZIP)
            </Button>
            <Button
              variant="outline"
              onClick={() => folderInputRef.current?.click()}
              disabled={isPreparing}
              title="Select a folder of SVG files"
            >
              <FolderUp className="size-4 mr-1.5" /> Upload Folder
            </Button>
            <div className="w-px h-6" style={{ backgroundColor: "var(--color-divider-default)" }} />
            <Button
              variant="outline"
              onClick={handleBulkDownload}
              disabled={filteredIcons.length === 0 || isDownloading}
              title="Download all filtered icons as ZIP"
            >
              <FolderDown className="size-4 mr-1.5" />
              {isDownloading ? "Zipping..." : `Download All (${filteredIcons.length})`}
            </Button>
            <div className="w-px h-6" style={{ backgroundColor: "var(--color-divider-default)" }} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-10" aria-label="More actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <RefreshCw className="size-4" />
                      Regenerate all tags
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Regenerate tags for all icons?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will overwrite existing tags for all {icons.length} icons. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={regenerateTagsForAllIcons}>
                        Regenerate all tags
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sticky search & filters */}
          <div className="sticky top-0 z-10 py-3 -mx-1 px-1" style={{ backgroundColor: "var(--color-surface-default)" }}>
            <div className="relative" style={{ minWidth: "300px" }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "var(--color-label-tertiary)" }} />
              <Input
                placeholder="Search icons by name or tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className={search ? "pl-10 pr-8" : "pl-10"}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--color-label-tertiary)" }}
                  aria-label="Clear search"
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-label-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-label-tertiary)")}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Size, Style, Group by filters */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {availableSizes.length > 1 && (
                <>
                  <span className="shrink-0" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
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

                  <div className="w-px h-4 shrink-0 mx-1" style={{ backgroundColor: "var(--color-divider-default)" }} />
                </>
              )}

              <span className="shrink-0" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
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
                  className="transition-colors hover:opacity-80"
                  style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}
                >
                  Clear
                </button>
              )}

              <div className="flex-1" />

              {/* Group by dropdown */}
              <div className="relative shrink-0">
                <span className="mr-1.5" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                  Group by:
                </span>
                <select
                  value={groupBy}
                  onChange={(e) => handleGroupByChange(e.target.value as GroupByMode)}
                  className="appearance-none border rounded-[var(--radius)] pl-2 pr-6 py-1 cursor-pointer"
                  style={{ fontSize: "var(--text-label)", backgroundColor: "var(--color-surface-default)", borderColor: "var(--color-border-default)", color: "var(--color-label-primary)" }}
                >
                  <option value="size">Size</option>
                  <option value="date">Date Added</option>
                  <option value="dateModified">Date Modified</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 size-3 pointer-events-none" style={{ color: "var(--color-label-tertiary)" }} />
              </div>
            </div>

            <p className="mt-2" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
              {filteredIcons.length} icon{filteredIcons.length !== 1 ? "s" : ""} found
              {sizeFilter !== null && ` at ${sizeFilter}px`}
            </p>
          </div>

          {/* Icon list grouped */}
          <div className="mt-3">
            {[...activeGroups.entries()].map(([groupLabel, groupIcons]) => (
              <div key={groupLabel} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h3 style={{ fontSize: "var(--text-h4)", fontWeight: "var(--font-weight-medium)", color: "var(--color-label-primary)" }}>
                    {groupLabel}
                  </h3>
                  <span style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                    {groupIcons.length} icon{groupIcons.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupIcons.map(renderIconRow)}
                </div>
              </div>
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12" style={{ fontSize: "var(--text-p)", color: "var(--color-label-secondary)" }}>
              No icons found.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pre-upload preview dialog — review staged icons before writing them */}
      <Dialog open={pendingIcons !== null} onOpenChange={(open) => { if (!open) cancelPendingUpload(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review before uploading</DialogTitle>
          </DialogHeader>
          {(() => {
            const newCount = pendingIcons?.filter((i) => !i.isUpdate).length ?? 0;
            const updateCount = pendingIcons?.filter((i) => i.isUpdate).length ?? 0;
            return (
              <>
                <div className="flex flex-wrap items-center gap-3 py-1" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                  <span>
                    <span className="font-medium" style={{ color: "var(--color-label-primary)" }}>{pendingIcons?.length ?? 0}</span> file{(pendingIcons?.length ?? 0) !== 1 ? "s" : ""} ready
                  </span>
                  <span style={{ color: "var(--color-label-success-primary)" }}>{newCount} new</span>
                  <span style={{ color: "var(--color-label-action-primary)" }}>{updateCount} will overwrite</span>
                  {pendingDuplicates > 0 && (
                    <span>{pendingDuplicates} duplicate{pendingDuplicates !== 1 ? "s" : ""} collapsed</span>
                  )}
                </div>

                <div className="mt-1 max-h-[52vh] overflow-y-auto space-y-2 pr-1">
                  {pendingIcons?.map((item) => (
                    <div
                      key={item.fileName}
                      className="flex items-center gap-3 p-2.5 border rounded-[var(--radius-card)]"
                      style={{ borderColor: "var(--color-border-default)" }}
                    >
                      <div
                        className="size-9 flex items-center justify-center shrink-0 overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full"
                        style={{ color: "var(--color-label-primary)" }}
                        dangerouslySetInnerHTML={{ __html: item.svgContent }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: "var(--text-p)", fontWeight: "var(--font-weight-medium)", color: "var(--color-label-primary)" }}>
                          {item.fileName}
                        </p>
                      </div>
                      <span
                        className="shrink-0 px-2 py-0.5 rounded-[var(--radius)]"
                        style={{
                          fontSize: "11px",
                          backgroundColor: "var(--color-fill-secondary)",
                          color: item.isUpdate ? "var(--color-label-action-primary)" : "var(--color-label-success-primary)",
                        }}
                      >
                        {item.isUpdate ? "Overwrite" : "New"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => removePendingIcon(item.fileName)}
                        title="Remove from this batch"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {updateCount > 0 && (
                  <p style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                    Overwrites replace the SVG only — existing tags are kept.
                  </p>
                )}

                <DialogFooter>
                  <Button variant="ghost" onClick={cancelPendingUpload}>Cancel</Button>
                  <Button onClick={confirmPendingUpload} disabled={(pendingIcons?.length ?? 0) === 0}>
                    Upload {pendingIcons?.length ?? 0} icon{(pendingIcons?.length ?? 0) !== 1 ? "s" : ""}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Bulk import result dialog */}
      <Dialog open={bulkResult !== null} onOpenChange={(open) => { if (!open) setBulkResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Import Complete</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3" style={{ fontSize: "var(--text-p)", color: "var(--color-label-primary)" }}>
            <div className="flex justify-between">
              <span>Total processed</span>
              <span className="font-medium">{(bulkResult?.added ?? 0) + (bulkResult?.updated ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>New icons added</span>
              <span className="font-medium" style={{ color: "var(--color-label-success-primary)" }}>{bulkResult?.added ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Existing icons updated</span>
              <span className="font-medium" style={{ color: "var(--color-label-action-primary)" }}>{bulkResult?.updated ?? 0}</span>
            </div>
            {(bulkResult?.duplicatesInBatch ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>Duplicate filenames in batch (collapsed)</span>
                <span className="font-medium" style={{ color: "var(--color-label-secondary)" }}>{bulkResult?.duplicatesInBatch ?? 0}</span>
              </div>
            )}
            {(bulkResult?.updated ?? 0) > 0 && (
              <p className="pt-1" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                Updated icons had their SVG renewed while keeping their original tags.
              </p>
            )}
            {(bulkResult?.duplicatesInBatch ?? 0) > 0 && (
              <p className="pt-1" style={{ fontSize: "var(--text-label)", color: "var(--color-label-secondary)" }}>
                Same filename appeared multiple times in this upload — only the last one was kept.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setBulkResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// The Iconology reference doc is now Markdown, edited via the shared
// MarkdownEditorPage (see TokenDocEditors → IconologyDocEditor, mounted at
// /cms/icon-editor/doc). The old HTML ArticleEditorPage path was retired when
// the doc moved to the MD-canonical pipeline — see ARCHITECTURE.md.
