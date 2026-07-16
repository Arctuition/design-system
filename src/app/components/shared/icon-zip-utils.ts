import JSZip from "jszip";
import type { IconItem } from "../../store/data-store";
import { getIconDownloadFileName } from "./icon-file-utils";

/** A single SVG file staged for upload — flattened to its basename. */
export interface ParsedSvgUpload {
  fileName: string;
  svgContent: string;
}

/** Promisified FileReader — reads a File's contents as UTF-8 text. */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/** True when the text looks like an actual SVG document, not stray bytes. */
function looksLikeSvg(content: string): boolean {
  return content.includes("<svg");
}

/**
 * Pull every SVG entry out of a ZIP archive. Nested paths are flattened to
 * their basename (icons are keyed by a flat fileName, so folder structure
 * inside the zip is discarded). macOS resource-fork junk (`__MACOSX/`,
 * dot-underscore files) and non-SVG entries are skipped.
 */
export async function extractSvgFilesFromZip(file: File): Promise<ParsedSvgUpload[]> {
  const zip = await JSZip.loadAsync(file);
  const out: ParsedSvgUpload[] = [];
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    if (entry.name.includes("__MACOSX/")) continue;
    const base = entry.name.split("/").pop() || entry.name;
    if (!base || base.startsWith(".") || base.startsWith("._")) continue;
    if (!base.toLowerCase().endsWith(".svg")) continue;
    const svgContent = await entry.async("string");
    if (!looksLikeSvg(svgContent)) continue;
    out.push({ fileName: base, svgContent });
  }
  return out;
}

/**
 * Collect SVG uploads from an arbitrary selection of files. Each entry may be
 * a raw `.svg` file (from a multi-select or a folder pick via
 * `webkitdirectory`) or a `.zip` archive whose SVG members are extracted.
 * Everything else is ignored. `errors` names files that could not be read or
 * unzipped so the caller can surface a toast without aborting the whole batch.
 */
export async function collectSvgUploads(
  files: File[],
): Promise<{ items: ParsedSvgUpload[]; errors: string[] }> {
  const items: ParsedSvgUpload[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      try {
        items.push(...(await extractSvgFilesFromZip(file)));
      } catch {
        errors.push(file.name);
      }
    } else if (lower.endsWith(".svg")) {
      try {
        const svgContent = await readFileAsText(file);
        if (looksLikeSvg(svgContent)) items.push({ fileName: file.name, svgContent });
        else errors.push(file.name);
      } catch {
        errors.push(file.name);
      }
    }
    // Any other file type (README, .png, etc.) is silently ignored.
  }
  return { items, errors };
}

export async function downloadIconsAsZip(icons: IconItem[], zipFileName = "icons.zip") {
  if (icons.length === 0) return;
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  icons.forEach((icon) => {
    let name = getIconDownloadFileName(icon.fileName, icon.name);

    // Deduplicate file names
    const count = usedNames.get(name) || 0;
    if (count > 0) {
      const base = name.replace(/\.svg$/i, "");
      name = `${base}-${count}.svg`;
    }
    usedNames.set(getIconDownloadFileName(icon.fileName, icon.name), count + 1);

    zip.file(name, icon.svgContent);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  a.click();
  URL.revokeObjectURL(url);
}
