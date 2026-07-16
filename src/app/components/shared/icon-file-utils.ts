export function iconFileNameToDisplayName(fileName: string): string {
  return fileName
    .replace(/\.svg$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayNameToIconFileName(name: string): string {
  const baseName = name
    .trim()
    .replace(/\.svg$/i, "")
    .replace(/[^a-zA-Z0-9\s_-]+/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${baseName || "icon"}.svg`;
}

export function getIconDownloadFileName(fileName: string | undefined, fallbackName: string): string {
  const normalized = (fileName || displayNameToIconFileName(fallbackName)).trim();
  return normalized.toLowerCase().endsWith(".svg") ? normalized : `${normalized}.svg`;
}

/**
 * The name copied by the "copy name" affordances — the dashed file base name
 * (e.g. `arrow-right`), NOT the prettified display name (`Arrow Right`). This
 * is the identifier the CMS edit form treats as the icon's name and what code
 * uses to reference an icon. Extension is dropped; falls back to deriving a
 * dashed name from the display name when no fileName is stored.
 */
export function getIconCopyName(fileName: string | undefined, fallbackName: string): string {
  return getIconDownloadFileName(fileName, fallbackName).replace(/\.svg$/i, "");
}
